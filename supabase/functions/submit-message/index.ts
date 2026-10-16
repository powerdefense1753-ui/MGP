import { gatewayIdentity } from './gateway-identity.js';
import { createClient } from 'npm:@supabase/supabase-js@2';
const origin='https://findcoolgame.com';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey, authorization, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'};
const reply=(status:number,error?:string)=>new Response(JSON.stringify(error?{error}:{ok:true}),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response(null,{headers});
 if(req.method!=='POST')return reply(405,'method');
 if(req.headers.get('origin')!==origin)return reply(403,'origin');
 try{
 const raw=await req.text();if(raw.length>10000)return reply(413,'too_large');
 const x=JSON.parse(raw);if(x.website)return reply(400,'invalid');
 const body=typeof x.body==='string'?x.body.trim():'';const nickname=typeof x.nickname==='string'?x.nickname.trim()||'Anonymous':'Anonymous';
 if(!['comment','feedback'].includes(x.kind)||body.length<3||body.length>2000||nickname.length>40)return reply(400,'invalid');
 const game=x.kind==='comment'&&typeof x.game_id==='string'?x.game_id:null;
 if(x.kind==='comment'&&(!game||!/^[a-zA-Z0-9_.-]{1,200}$/.test(game)))return reply(400,'invalid');
 const gatewaySecret=Deno.env.get('COMMUNITY_GATEWAY_SECRET');
 const ip=gatewaySecret?await gatewayIdentity(req.headers,raw,gatewaySecret):req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
 if(!ip)return reply(503,'unavailable');
 const salt=Deno.env.get('COMMUNITY_RATE_SALT');if(!salt)return reply(503,'unavailable');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+ip));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {data,error}=await db.rpc('claim_community_submission',{p_hash:hash});if(error)return reply(503,'unavailable');if(!data)return reply(429,'rate_limited');
 const saved=await db.from('community_messages').insert({kind:x.kind,game_id:game,nickname,body,status:'pending'});
 return saved.error?reply(503,'unavailable'):reply(201);
 }catch{return reply(400,'invalid');}
});

