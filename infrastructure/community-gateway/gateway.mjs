import {createHash,createHmac} from 'node:crypto';
import {isIP} from 'node:net';
const origin='https://findcoolgame.com';
const routes=new Map([['/rest/v1/community_messages',['GET','PATCH']],['/rest/v1/community_moderators',['GET']],['/auth/v1/token',['POST']],['/auth/v1/logout',['POST']],['/functions/v1/submit-message',['POST']]]);
const cors={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey, authorization, content-type, prefer','Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
export function createGateway(env,fetcher=fetch){
 env={...env,...Object.fromEntries(['SUPABASE_URL','SUPABASE_ANON_KEY','COMMUNITY_GATEWAY_SECRET'].map(k=>[k,env[k]?.trim()]))};
 return async req=>{
 const reply=(status,error)=>Response.json({error},{status,headers:cors});
 if(req.headers.get('origin')!==origin)return reply(403,'origin');
 const u=new URL(req.url),methods=routes.get(u.pathname);
 if(!methods)return reply(404,'not_found');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(!methods.includes(req.method))return reply(405,'method');
 if(env.SUPABASE_URL!=='https://zhgjbbvgjnyqthfiqdrc.supabase.co'||!env.SUPABASE_ANON_KEY)return reply(503,'unavailable');
 const headers=new Headers({'apikey':env.SUPABASE_ANON_KEY,'Authorization':req.headers.get('authorization')||'Bearer '+env.SUPABASE_ANON_KEY,'Content-Type':'application/json','Origin':origin});
 const prefer=req.headers.get('prefer');if(prefer==='return=representation')headers.set('Prefer',prefer);
 let body;
 try{
 if(req.method!=='GET'){
 if(Number(req.headers.get('content-length'))>12000)return reply(413,'too_large');
 const reader=req.body?.getReader();let size=0;const parts=[];
 if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000){await reader.cancel();return reply(413,'too_large')}parts.push(value)}
 body=Buffer.concat(parts).toString('utf8');
 }
 if(u.pathname==='/functions/v1/submit-message'){
 // Vercel overwrites X-Forwarded-For at its ingress; never trust a caller-supplied signing header.
 const ip=req.headers.get('x-forwarded-for')?.trim();
 if(!ip||!isIP(ip)||!env.COMMUNITY_GATEWAY_SECRET)return reply(503,'unavailable');
 const ts=String(Math.floor(Date.now()/1000));
 const digest=createHash('sha256').update(body||'').digest('hex');
 const sig=createHmac('sha256',env.COMMUNITY_GATEWAY_SECRET).update(ts+'\n'+ip+'\n'+digest).digest('hex');
 headers.set('x-community-client',ip);headers.set('x-community-timestamp',ts);headers.set('x-community-signature',sig);
 }
 const result=await fetcher(env.SUPABASE_URL+u.pathname+u.search,{method:req.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(12000)});
 if(result.status>=300&&result.status<400)return reply(503,'unavailable');
 // No response cookies, location, platform internals or cacheable private data.
 return new Response(result.body,{status:result.status,headers:{...cors,'Content-Type':'application/json'}});
 }catch{return reply(503,'unavailable')}
 };
}


