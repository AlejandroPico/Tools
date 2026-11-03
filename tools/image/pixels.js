export function floodFill(data,width,height,x,y,color,tolerance=0){
  if(x<0||y<0||x>=width||y>=height)return false;
  const start=(y*width+x)*4,target=Array.from(data.slice(start,start+4));
  if(target.every((value,i)=>value===color[i]))return false;
  const visited=new Uint8Array(width*height),stack=new Uint32Array(width*height);let count=1;stack[0]=y*width+x;visited[stack[0]]=1;
  const equal=index=>target.every((value,i)=>Math.abs(value-data[index*4+i])<=tolerance);
  while(count){const index=stack[--count];if(!equal(index))continue;data.set(color,index*4);const col=index%width;
    for(const next of [col>0?index-1:-1,col<width-1?index+1:-1,index>=width?index-width:-1,index<width*(height-1)?index+width:-1])if(next>=0&&!visited[next]){visited[next]=1;stack[count++]=next;}
  }
  return true;
}
export function cropRect(a,b,width,height){const x=Math.max(0,Math.min(width-1,Math.floor(Math.min(a.x,b.x)))),y=Math.max(0,Math.min(height-1,Math.floor(Math.min(a.y,b.y))));return {x,y,width:Math.max(1,Math.min(width-x,Math.ceil(Math.abs(a.x-b.x)))),height:Math.max(1,Math.min(height-y,Math.ceil(Math.abs(a.y-b.y))))};}
