import {sanitizeSVG} from '../core/svg.js';
import {canvasBlob,loadImage,readImage} from '../core/raster.js';
const result=document.querySelector('#result'),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
document.querySelector('#run').onclick=async()=>{
 const logs=[];let failed=0;
 const check=(condition,text)=>{logs.push(`${condition?'✓':'✕'} ${text}`);if(!condition)failed++;result.textContent=logs.join('\n');};
 try{
  const clean=sanitizeSVG('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><foreignObject/><style>*{fill:red}</style><use href="#x"/><image href="https://example.invalid/x"/><rect width="80" height="60" fill="#9ce4c4" style="stroke:#000;fill:url(https://example.invalid/x)"/></svg>');
  check(!/script|foreignObject|onload|<style|<use|<image|https:/.test(clean.source)&&clean.removed>=7,'Limpieza de código activo, referencias externas y use');
  const local=sanitizeSVG('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><defs><linearGradient id="a"><stop stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect width="80" height="60" fill="url(#a)"/></svg>');
  check(local.source.includes('url(#a)')&&local.source.includes('linearGradient'),'Conservación de formas y degradados locales');
  for(const source of ['<!DOCTYPE svg [<!ENTITY x "a">]><svg xmlns="http://www.w3.org/2000/svg"/>','<svg>','<svg xmlns="https://example.invalid"/>']){let rejected=false;try{sanitizeSVG(source);}catch{rejected=true;}check(rejected,'SVG inválido o con entidades rechazado');}
  const image=await loadImage(new Blob([local.source],{type:'image/svg+xml'}));ctx.drawImage(image,0,0,80,60);check(ctx.getImageData(1,1,1,1).data[3]===255,'SVG limpio dibujado sin recursos externos');
  for(const type of ['image/png','image/jpeg','image/webp']){const blob=await canvasBlob(canvas,type,.8),decoded=await loadImage(blob);check(blob.type===type&&decoded.naturalWidth===80&&decoded.naturalHeight===60,`Exportación y lectura de ${type}`);}
  const file=new File([await(await fetch('./fixtures/creative.png')).blob()],'creative.png',{type:'image/png'}),fixture=await readImage(file);ctx.clearRect(0,0,80,60);ctx.drawImage(fixture,0,0);check([...ctx.getImageData(5,5,1,1).data].join(',')==='255,0,0,255'&&ctx.getImageData(60,45,1,1).data[3]===0,'Imagen local conserva píxeles y transparencia');
  const worker=new Worker('../tools/data/regex-worker.js',{type:'module'});const response=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{worker.terminate();reject(Error('Worker sin respuesta'));},3000);worker.onmessage=e=>{clearTimeout(timeout);resolve(e.data);};worker.onerror=e=>{clearTimeout(timeout);reject(Error(e.message));};worker.postMessage({pattern:'(a)',flags:'g',text:'aba',replace:true,template:'[$1]'});});worker.terminate();check(response.result?.result==='[a]b[a]','Worker de expresiones regulares devuelve el contrato esperado');
 }catch(error){check(false,error.message);}
 logs.push(failed?`${failed} errores`:'Todas las comprobaciones correctas');result.textContent=logs.join('\n');
};
