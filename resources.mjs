import {readFile} from 'node:fs/promises';

export const inject=['connection'];
const catalogUrl=new URL('./lib/resources.json',import.meta.url);

// Finite binary resources on DSH's authenticated, carrier-neutral transport.
export async function createResourceHandler(){
  const catalog=JSON.parse(await readFile(catalogUrl,'utf8'));
  const files=new Map(catalog.map(row=>[row.name,{...row,url:new URL('./lib/assets/'+row.name,import.meta.url)}]));
  return async request=>{
    const params=new URL(request.url).searchParams;
    if(params.getAll('name').length!==1||[...params.keys()].some(key=>key!=='name'))return new Response('Expected one resource name',{status:400});
    const row=files.get(params.get('name'));
    if(!row)return new Response('Unknown game resource',{status:404});
    const headers={'Content-Type':row.type,'Content-Length':String(row.bytes),'Cache-Control':'private, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'};
    if(request.method==='HEAD')return new Response(null,{headers});
    const bytes=await readFile(row.url,{signal:request.signal});
    return new Response(bytes,{headers});
  };
}

export async function apply(ctx){
  const handler=await createResourceHandler();
  // Connection checks the admitted owner Peer before calling an exact Fetch
  // route. The shared RPC interceptor belongs exclusively to API Gateway.
  ctx.effect(()=>ctx.connection.fetch.register({path:'/api/braingames/resource',methods:['GET','HEAD'],requestBody:'buffered',fetch:handler}),'BrainGames packaged resources');
}
