import test from 'node:test';
import assert from 'node:assert/strict';
import { saveFile } from '../core/files.js';

test('el selector se abre en el clic, antes de esperar a que se genere un PNG',async()=>{
 const calls=[];let finish;const blob=new Blob(['png'],{type:'image/png'}),content=new Promise(resolve=>{finish=resolve;});
 globalThis.window={showSaveFilePicker:async options=>{calls.push(options.suggestedName);return{createWritable:async()=>({write:async value=>calls.push(value),close:async()=>calls.push('close')})};}};
 try{const result=saveFile(content,'imagen.png');assert.deepEqual(calls,['imagen.png']);finish(blob);assert.equal(await result,'saved');assert.equal(calls[1],blob);assert.equal(calls[2],'close');}finally{delete globalThis.window;}
});
test('cancelar no escribe y los errores de generación no abren un archivo para escritura',async()=>{
 globalThis.window={showSaveFilePicker:async()=>{const error=new Error('cancel');error.name='AbortError';throw error;}};
 try{assert.equal(await saveFile(Promise.reject(Error('generation failed')),'x.png'),'cancelled');}finally{delete globalThis.window;}
 let writes=0;globalThis.window={showSaveFilePicker:async()=>({createWritable:async()=>{writes++;}})};
 try{await assert.rejects(saveFile(Promise.reject(Error('generation failed')),'x.png'),/generation failed/);assert.equal(writes,0);}finally{delete globalThis.window;}
});
test('un fallo de escritura aborta y se comunica al llamante',async()=>{
 let aborted=false;globalThis.window={showSaveFilePicker:async()=>({createWritable:async()=>({write:async()=>{throw Error('disco lleno');},abort:async()=>{aborted=true;}})})};
 try{await assert.rejects(saveFile(new Blob(['x']),'x.txt'),/disco lleno/);assert.equal(aborted,true);}finally{delete globalThis.window;}
});
