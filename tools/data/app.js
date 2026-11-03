import { draftStore } from '../../core/drafts.js';
import { saveFile, downloadFile } from '../../core/files.js';
import { formatJSON } from './json.js';
import { parseCSV, writeCSV, guessDelimiter } from './csv.js';
import { toBase64, fromBase64, base64Bytes } from './codecs.js';
import { parseInteger } from '../calculator/programmer.js';

export function mountData(root) {
  root.innerHTML = `<div class="workbench data-app"><nav class="wb-tabs" role="tablist" aria-label="Herramientas de datos"></nav><div class="wb-body"></div><div class="wb-status wb-export-footer"><span class="draft-status" role="status"></span><label>Al guardar <select class="export-destination" aria-label="Destino de exportación"><option value="save">Elegir destino</option><option value="download">Descargar</option></select></label></div></div>`;
  const body = root.querySelector('.wb-body'), status = root.querySelector('.draft-status');
  const store = draftStore('data-workbench', status);
  let state, mode = 'json', disposed = false, worker, timeout, rows = [['Nombre','Valor'],['Ejemplo','42']], page = 0;
  const modes = { json:'JSON', csv:'CSV', regex:'Expresiones regulares', codecs:'URL / Base64', bases:'Bases numéricas' };
  const tabs = root.querySelector('.wb-tabs');
  for (const [id, label] of Object.entries(modes)) {
    const button = document.createElement('button'); button.textContent = label; button.setAttribute('role','tab'); button.dataset.mode = id;
    button.addEventListener('click', () => { stopWorker(); mode = id; render(); }); tabs.append(button);
  }
  const q = selector => body.querySelector(selector);
  const message = (text, error = false) => { const el=q('.wb-message'); if(el){el.textContent=text;el.classList.toggle('error-text',error);} };
  function change(key,value) { state[key]=value; store.change(state); }
  function stopWorker() { worker?.terminate(); worker=null; clearTimeout(timeout); }
  function textEditors(inputLabel='Entrada', outputLabel='Resultado') {
    return `<div class="wb-split"><div class="wb-editor"><label for="data-input">${inputLabel}</label><textarea id="data-input" spellcheck="false"></textarea></div><div class="wb-editor"><label for="data-output">${outputLabel}</label><textarea id="data-output" readonly spellcheck="false"></textarea></div></div>`;
  }
  function source(key) { q('#data-input').value=state[key]||'';q('#data-input').addEventListener('input',e=>change(key,e.target.value)); }
  async function exportText(text,name,type='text/plain') { if(!text){message('No hay contenido para guardar.',true);return;}try { const blob=new Blob([text],{type:`${type};charset=utf-8`});if(root.querySelector('.export-destination').value==='download')downloadFile(blob,name);else await saveFile(blob,name); } catch(e){message(`No se pudo guardar: ${e.message}`,true);} }
  function upload(key,accept) {
    const input=document.createElement('input');input.type='file';input.accept=accept;
    input.onchange=async()=>{const file=input.files[0];if(!file)return;if(file.size>5_000_000){message('El archivo supera 5 MB.',true);return;}try {const text=await file.text();if(disposed)return;change(key,text);if(mode===key){render();message(`Abierto: ${file.name}`);}}catch(e){message(e.message,true);}}; input.click();
  }
  function render() {
    if(!state)return;
    for(const tab of tabs.children){tab.setAttribute('aria-selected',String(tab.dataset.mode===mode));tab.tabIndex=tab.dataset.mode===mode?0:-1;}
    if(mode==='json') {
      body.innerHTML=`<div class="wb-toolbar"><button data-do="open">Abrir JSON</button><button data-do="format">Formatear</button><button data-do="minify">Compactar</button><label><input type="checkbox" id="json-sort">Ordenar claves</label><label>Sangría <select id="json-indent"><option value="2">2 espacios</option><option value="4">4 espacios</option><option value="tab">Tabulación</option></select></label><button data-do="save">Guardar JSON…</button></div><p class="wb-message" role="status"></p>${textEditors('Documento JSON','JSON validado')}<p class="wb-help">Hasta 5 MB. Se conservan las cifras exactas y las claves duplicadas; no se ejecuta código.</p>`;
      source('json');
      const run=compact=>{try{const result=formatJSON(state.json,compact?'':q('#json-indent').value==='tab'?'\t':' '.repeat(Number(q('#json-indent').value)),q('#json-sort').checked);q('#data-output').value=result.text;message(`JSON válido · ${result.nodes} valores${result.duplicates?` · ${result.duplicates} claves duplicadas conservadas`:''}`);return result.text;}catch(e){q('#data-output').value='';message(e.message,true);return '';}};
      q('[data-do=open]').onclick=()=>upload('json','.json,application/json');q('[data-do=format]').onclick=()=>run(false);q('[data-do=minify]').onclick=()=>run(true);q('[data-do=save]').onclick=()=>exportText(run(false),'datos.json','application/json');
    } else if(mode==='csv') renderCSV();
    else if(mode==='regex') {
      body.innerHTML=`<div class="wb-toolbar"><label>Patrón <input id="regex-pattern" placeholder="(\\w+)" spellcheck="false" maxlength="2000"></label><label>Opciones <input id="regex-flags" size="7" maxlength="8" aria-label="Opciones de expresión regular"></label><button data-do="test">Buscar</button></div><label>Sustitución <input id="regex-replacement" maxlength="2000" placeholder="$1"></label><div class="wb-toolbar"><button data-do="replace">Sustituir</button><button data-do="save">Guardar resultado…</button></div><p class="wb-message" role="status"></p>${textEditors('Texto de prueba','Coincidencias o sustitución')}<p class="wb-help">Sintaxis JavaScript. g: todas · i: sin distinguir mayúsculas · m: líneas · s: punto incluye saltos · u: Unicode. Sustitución: $&amp;, $1, $&lt;nombre&gt;, $$. Hasta 200.000 caracteres y 1.000 coincidencias; las búsquedas lentas se interrumpen.</p>`;
      source('regex');
      for(const [id,key,defaultValue]of [['regex-pattern','pattern','\\w+'],['regex-flags','flags','g'],['regex-replacement','replacement','']]){q('#'+id).value=state[key]??defaultValue;q('#'+id).oninput=e=>change(key,e.target.value);}
      const run=replace=>{
        stopWorker();message('Buscando…');q('#data-output').value='';
        try{worker=new Worker(new URL('./regex-worker.js',import.meta.url),{type:'module'});
          worker.onmessage=e=>{stopWorker();if(disposed||mode!=='regex')return;if(e.data.error){message(e.data.error,true);return;}const r=e.data.result;q('#data-output').value=replace?r.result:r.matches.map((m,i)=>`${i+1}. Posición ${m.index}: ${JSON.stringify(m.text)}${m.groups.length?'\n   Grupos: '+JSON.stringify(m.groups):''}`).join('\n');message(`${r.matches.length} coincidencias${r.truncated?' · límite alcanzado':''}`);};
          worker.onerror=()=>{stopWorker();message('No se pudo ejecutar la búsqueda.',true);};
          worker.postMessage({pattern:q('#regex-pattern').value,flags:q('#regex-flags').value,text:q('#data-input').value,replace,template:q('#regex-replacement').value});
          timeout=setTimeout(()=>{stopWorker();message('Búsqueda interrumpida por superar el tiempo permitido. Simplifica el patrón.',true);},1000);
        }catch(e){stopWorker();message(e.message,true);}
      };
      q('[data-do=test]').onclick=()=>run(false);q('[data-do=replace]').onclick=()=>run(true);q('[data-do=save]').onclick=()=>exportText(q('#data-output').value,'resultado.txt');
    } else if(mode==='codecs') {
      body.innerHTML=`<div class="wb-toolbar"><button data-codec="url-encode">Codificar URL</button><button data-codec="url-decode">Decodificar URL</button><button data-codec="base64-encode">Texto → Base64</button><button data-codec="base64-decode">Base64 → Texto</button><button data-do="bytes">Descargar bytes Base64</button><button data-do="save">Guardar texto…</button></div><p class="wb-message" role="status"></p>${textEditors()}<p class="wb-help">URL usa componentes (encodeURIComponent). Base64 utiliza texto UTF-8; para contenido binario descarga sus bytes. Límite: 2 millones de caracteres.</p>`;
      source('codecs');
      for(const button of body.querySelectorAll('[data-codec]'))button.onclick=()=>{try{const text=q('#data-input').value;if(text.length>2_000_000)throw Error('La entrada supera 2 millones de caracteres.');const actions={'url-encode':encodeURIComponent,'url-decode':decodeURIComponent,'base64-encode':toBase64,'base64-decode':fromBase64};q('#data-output').value=actions[button.dataset.codec](text);message('Conversión completada.');}catch(e){message(e.message,true);}};
      q('[data-do=bytes]').onclick=()=>{try{const text=q('#data-input').value;if(text.length>2_000_000)throw Error('Entrada demasiado grande.');downloadFile(new Blob([base64Bytes(text)]),'datos.bin');message('Descarga de bytes preparada.');}catch(e){message(e.message,true);}};q('[data-do=save]').onclick=()=>exportText(q('#data-output').value,'conversion.txt');
    } else {
      body.innerHTML=`<div class="wb-toolbar"><label>Base de entrada <select id="number-base"><option value="10">Decimal</option><option value="16">Hexadecimal</option><option value="2">Binario</option><option value="8">Octal</option></select></label><button data-do="convert">Convertir</button><button data-do="save">Guardar resultado…</button></div><p class="wb-message" role="status"></p>${textEditors('Número entero','Equivalencias')}<p class="wb-help">Hasta 256 cifras de entrada, con signo. Conversión exacta mediante enteros grandes, sin limitar a 64 bits.</p>`;
      source('bases');q('#number-base').value=state.base||'10';q('#number-base').onchange=e=>change('base',e.target.value);
      q('[data-do=convert]').onclick=()=>{try{const n=parseInteger(q('#data-input').value,Number(q('#number-base').value));q('#data-output').value=[[10,'Decimal'],[16,'Hexadecimal'],[2,'Binario'],[8,'Octal']].map(([base,name])=>`${name}: ${n.toString(base).toUpperCase()}`).join('\n');message('Conversión exacta.');}catch(e){message(e.message,true);}};q('[data-do=save]').onclick=()=>exportText(q('#data-output').value,'bases.txt');
    }
  }
  function renderCSV() {
    body.innerHTML=`<div class="wb-toolbar"><button data-do="open">Abrir CSV</button><label>Separador <select id="csv-delimiter"><option value=",">Coma</option><option value=";">Punto y coma</option><option value="tab">Tabulación</option><option value="auto">Detectar</option></select></label><button data-do="parse">Texto → Tabla</button><button data-do="serialize">Tabla → Texto</button><button data-do="save-source">Guardar texto CSV…</button><button data-do="save">Guardar tabla CSV…</button></div><div class="wb-editor"><label for="data-input">Texto CSV</label><textarea id="data-input" spellcheck="false" style="min-height:110px;max-height:180px"></textarea></div><p class="wb-message" role="status"></p><div class="wb-toolbar"><button data-do="row">Añadir fila</button><button data-do="column">Añadir columna</button><button data-do="previous">Anterior</button><span id="csv-page" class="wb-help"></span><button data-do="next">Siguiente</button></div><div class="wb-table-wrap"><table class="wb-table" aria-label="Tabla CSV editable"></table></div><label><input type="checkbox" id="csv-safe">Proteger fórmulas al abrir en una hoja de cálculo (añade un apóstrofo)</label><p class="wb-help">La primera fila también es editable. Hasta 3.000 filas, 100 columnas y 50.000 celdas. La tabla se guarda como borrador; pulsa Tabla → Texto para actualizar el CSV.</p>`;
    source('csv');q('#csv-delimiter').value=state.delimiter||',';
    const delimiter=()=>q('#csv-delimiter').value==='auto'?guessDelimiter(q('#data-input').value):q('#csv-delimiter').value==='tab'?'\t':q('#csv-delimiter').value;
    const persist=()=>{change('table',rows);};
    function table(){const node=q('table');node.replaceChildren();const from=page*50,to=Math.min(rows.length,from+50);for(let i=from;i<to;i++){const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=String(i+1);tr.append(th);rows[i].forEach((value,j)=>{const td=document.createElement('td'),input=document.createElement('textarea');input.rows=1;input.value=value;input.setAttribute('aria-label',`Fila ${i+1}, columna ${j+1}`);input.oninput=()=>{rows[i][j]=input.value;persist();};td.append(input);tr.append(td);});const td=document.createElement('td'),button=document.createElement('button');button.textContent='Eliminar';button.setAttribute('aria-label',`Eliminar fila ${i+1}`);button.onclick=()=>{rows.splice(i,1);if(!rows.length)rows=[['']];page=Math.min(page,Math.floor((rows.length-1)/50));persist();table();};td.append(button);tr.append(td);node.append(tr);}q('#csv-page').textContent=`${from+1}–${to} de ${rows.length} filas · ${rows[0]?.length||0} columnas`;q('[data-do=previous]').disabled=page===0;q('[data-do=next]').disabled=to>=rows.length;}
    q('#csv-delimiter').onchange=e=>change('delimiter',e.target.value);
    q('[data-do=open]').onclick=()=>upload('csv','.csv,.tsv,text/csv');
    q('[data-do=parse]').onclick=()=>{try{rows=parseCSV(q('#data-input').value,delimiter());page=0;persist();table();message('Tabla cargada.');}catch(e){message(e.message,true);}};
    const serialize=()=>{const text=writeCSV(rows,delimiter(),q('#csv-safe').checked);q('#data-input').value=text;change('csv',text);message('Texto CSV actualizado.');return text;};
    q('[data-do=serialize]').onclick=serialize;q('[data-do=save-source]').onclick=()=>exportText(q('#data-input').value,'datos.csv','text/csv');q('[data-do=save]').onclick=()=>exportText(writeCSV(rows,delimiter(),q('#csv-safe').checked),'tabla.csv','text/csv');
    q('[data-do=row]').onclick=()=>{if(rows.length>=3000||(rows.length+1)*rows[0].length>50000){message('Límite de tabla alcanzado.',true);return;}rows.push(Array(rows[0].length).fill(''));page=Math.floor((rows.length-1)/50);persist();table();};
    q('[data-do=column]').onclick=()=>{if(rows[0].length>=100||rows.length*(rows[0].length+1)>50000){message('Límite de tabla alcanzado.',true);return;}rows.forEach(row=>row.push(''));persist();table();};
    q('[data-do=previous]').onclick=()=>{page--;table();};q('[data-do=next]').onclick=()=>{page++;table();};table();
  }
  tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=Object.keys(modes),index=keys.indexOf(mode);mode=keys[e.key==='Home'?0:e.key==='End'?keys.length-1:(index+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length];stopWorker();render();tabs.querySelector(`[data-mode=${mode}]`).focus();});
  store.load({json:'{\n  "nombre": "Tools",\n  "local": true\n}',csv:'Nombre,Valor\nEjemplo,42',regex:'Una herramienta para cada idea.',codecs:'',bases:''}).then(value=>{if(disposed)return;state=value&&typeof value==='object'?value:{};if(Array.isArray(state.table)&&state.table.length&&state.table.length<=3000&&state.table.every(r=>Array.isArray(r)&&r.length>0&&r.length<=100&&r.every(c=>typeof c==='string'))&&state.table.reduce((n,r)=>n+r.length,0)<=50000)rows=state.table;render();});
  return {preventClose:()=>store.pending,closeMessage:'Hay cambios pendientes de guardado local. ¿Cerrar Datos?',destroy(){disposed=true;stopWorker();store.destroy();}};
}
