import {createGateway} from '../gateway.mjs';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 const route=new URL(req.url,'https://gateway.invalid');
 const path=route.searchParams.get('path')||'';route.searchParams.delete('path');
 const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
 const method=req.method||'GET';
 const request=new Request('https://gateway.invalid/'+path+(route.searchParams.size?'?'+route.searchParams:''),{method,headers,...(!['GET','HEAD'].includes(method)?{body:req,duplex:'half'}:{})});
 const response=await createGateway(process.env)(request);
 res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(Buffer.from(await response.arrayBuffer()));
}
