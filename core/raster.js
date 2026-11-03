import { sanitizeSVG } from './svg.js';
export const MAX_PIXELS=8_000_000,MAX_SIDE=4096;
export function dimensions(width,height){
  width=Number(width);height=Number(height);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>MAX_SIDE||height>MAX_SIDE||width*height>MAX_PIXELS)throw Error('Tamaño permitido: 1–4.096 píxeles por lado y hasta 8 millones de píxeles.');
  return {width,height};
}
export function loadImage(blob){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(blob),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('No se pudo leer la imagen.'));};image.src=url;});}
export async function readImage(file){
  if(file.size>30_000_000)throw Error('La imagen supera 30 MB.');
  let blob=file;
  if(file.type==='image/svg+xml'||/\.svg$/i.test(file.name||''))blob=new Blob([sanitizeSVG(await file.text()).source],{type:'image/svg+xml'});
  else if(!['image/png','image/jpeg','image/webp','image/gif','image/bmp','image/avif'].includes(file.type))throw Error('Formato no admitido. Usa PNG, JPEG, WebP, GIF, BMP, AVIF o SVG.');
  const image=await loadImage(blob);dimensions(image.naturalWidth,image.naturalHeight);return image;
}
export function canvasBlob(canvas,type='image/png',quality=.9){return new Promise((resolve,reject)=>{canvas.toBlob(blob=>{if(!blob)reject(Error('No se pudo generar el archivo.'));else if(blob.type!==type)reject(Error('Este navegador no puede exportar el formato elegido. Usa PNG.'));else resolve(blob);},type,quality);});}
