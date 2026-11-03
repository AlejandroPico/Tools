import test from 'node:test';
import assert from 'node:assert/strict';
import { formatJSON } from '../tools/data/json.js';
import { parseCSV,writeCSV,guessDelimiter } from '../tools/data/csv.js';
import { toBase64,fromBase64,base64Bytes } from '../tools/data/codecs.js';
import { regexRun } from '../tools/data/regex-engine.js';
import { contrast,hexColor,rgb,hsl,extractPalette,gradientCSS,gradientSVG } from '../tools/design/color.js';
import { floodFill,cropRect } from '../tools/image/pixels.js';
import { dimensions } from '../core/raster.js';

test('JSON conserva enteros grandes, exponentes, claves duplicadas y escapes',()=>{
 const source='{"z":900719925474099312345,"a":1.2300e+20,"a":"\\u0061","__proto__":null}';
 const result=formatJSON(source,'',true);assert.equal(result.duplicates,1);assert.match(result.text,/900719925474099312345/);assert.match(result.text,/1.2300e\+20/);assert.match(result.text,/\\u0061/);assert.equal((result.text.match(/"a":/g)||[]).length,2);
 assert.deepEqual(JSON.parse(formatJSON('[true, null, "á", {"x": []}]').text),[true,null,'á',{x:[]}]);
});
test('JSON rechaza gramática inválida y profundidad excesiva',()=>{
 for(const text of ['','[1,]','{"x":1,}','01','NaN','true false','{"x" 1}','"a\nb"','[.5]','[+2]','[1e]'])assert.throws(()=>formatJSON(text));
 assert.throws(()=>formatJSON('['.repeat(65)+'0'+']'.repeat(65)),/complejo/);
});
test('CSV conserva comillas, separadores, saltos y campos vacíos',()=>{
 const rows=[['Nombre','Dato',''],['A, B','"cita"','dos\nlíneas'],['','=SUM(1)','']];
 assert.deepEqual(parseCSV(writeCSV(rows)),rows);assert.deepEqual(parseCSV('\ufeffa;b\r\n1;2\r\n',';'),[['a','b'],['1','2']]);
 assert.equal(guessDelimiter('"a,b";c\n1;2'),';');assert.equal(guessDelimiter('a\tb\n'), '\t');
 assert.throws(()=>parseCSV('"sin cerrar'));assert.throws(()=>parseCSV('"campo"x'));
 assert.equal(writeCSV([['=1','-2','texto']],',',true),"'=1,'-2,texto");
});
test('CSV limita también las celdas añadidas al normalizar filas irregulares',()=>{
 assert.throws(()=>parseCSV(Array.from({length:600},(_,i)=>i===0?Array(100).fill('x').join(','):'x').join('\n')),/celdas/);
});
test('Base64 es reversible con Unicode y distingue bytes de texto UTF-8',()=>{
 const text='Español 🛠️\n漢字';assert.equal(fromBase64(toBase64(text)),text);assert.deepEqual([...base64Bytes('/wA=')],[255,0]);assert.throws(()=>fromBase64('/wA='));assert.throws(()=>base64Bytes('no!'));assert.equal(fromBase64(''), '');
});
test('regexp respeta opciones, grupos, reemplazos y coincidencias vacías Unicode',()=>{
 assert.equal(regexRun({pattern:'(a)',flags:'g',text:'aba',replace:true,template:'[$1]-$$'}).result,'[a]-$b[a]-$');
 assert.equal(regexRun({pattern:'a',flags:'',text:'aaa'}).matches.length,1);
 assert.equal(regexRun({pattern:'(?:)',flags:'gu',text:'🛠'}).matches.length,2);
 assert.equal(regexRun({pattern:'(?<a>x)',text:'x',replace:true,template:'$<a>!'}).result,'x!');
 assert.equal(regexRun({pattern:'x',text:'x'.repeat(1001)}).truncated,true);
 assert.throws(()=>regexRun({pattern:'x',text:'x'.repeat(1001),replace:true}));assert.throws(()=>regexRun({pattern:'(',text:'x'}));
 assert.throws(()=>regexRun({pattern:'(?=(.*))',text:'a'.repeat(3000)}),/capturas/);
 assert.throws(()=>regexRun({pattern:'x',text:'x'+'a'.repeat(10000),replace:true,template:"$'".repeat(400)}),/reemplazo/);
});
test('contraste WCAG y conversiones de color conocidos',()=>{
 assert.equal(contrast('#000','#fff'),21);assert.equal(contrast('#123456','#123456'),1);assert.ok(Math.abs(contrast('#777','#fff')-4.478)<.001);
 assert.equal(hexColor('aBc'),'#aabbcc');assert.deepEqual(rgb('#f00'),[255,0,0]);assert.deepEqual(hsl('#00ff00'),[120,100,50]);assert.deepEqual(hsl('#808080'),[0,0,50]);assert.throws(()=>hexColor('red'));
});
test('paleta ignora transparencia y degradados solo aceptan colores y posiciones válidas',()=>{
 assert.deepEqual(extractPalette(new Uint8ClampedArray([255,0,0,255,255,0,0,255,0,0,255,255,0,255,0,0])),['#ff0000','#0000ff']);
 const stops=[{color:'#fff',at:100},{color:'#000',at:0}];assert.equal(gradientCSS(stops,90),'linear-gradient(90deg, #000000 0%, #ffffff 100%)');assert.match(gradientSVG(stops),/linearGradient/);assert.throws(()=>gradientCSS([{color:'url(x)',at:0},{color:'#fff',at:100}]));assert.throws(()=>gradientCSS(stops,NaN));
});
test('relleno respeta fronteras, tolerancia, alfa y píxeles fuera del lienzo',()=>{
 const data=new Uint8ClampedArray([0,0,0,255,0,0,0,255,255,255,255,255,0,0,0,255]);
 assert.equal(floodFill(data,2,2,0,0,[255,0,0,255]),true);assert.deepEqual([...data],[255,0,0,255,255,0,0,255,255,255,255,255,255,0,0,255]);assert.equal(floodFill(data,2,2,0,0,[255,0,0,255]),false);assert.equal(floodFill(data,2,2,-1,0,[1,2,3,4]),false);
});
test('recortes y dimensiones no generan lienzos vacíos o excesivos',()=>{
 assert.deepEqual(cropRect({x:80,y:60},{x:20,y:10},100,100),{x:20,y:10,width:60,height:50});assert.deepEqual(dimensions('800',600),{width:800,height:600});
 for(const size of [[0,1],[1,NaN],[4097,1],[4000,4000],[2.5,2]])assert.throws(()=>dimensions(...size));
});
