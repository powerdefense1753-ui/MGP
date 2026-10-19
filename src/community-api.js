export const WEBSITE_COMMENT_ID='website-experience';
export const validateMessage=x=>{
 const body=typeof x.body==='string'?x.body.trim():'';
 const nickname=typeof x.nickname==='string'?x.nickname.trim():'';
 if(body.length<3||body.length>2000||nickname.length>40)throw Error('invalid');
 return {body,nickname:nickname||'Anonymous'};
};
export function communityClient({url,key},fetcher=fetch){
 if(!url||!key)return null;
 const request=async(path,options={},token=key)=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const r=await fetcher(url+path,{...options,signal:controller.signal,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});
   const x=await r.json().catch(()=>null);
   if(!r.ok)throw Error(r.status===429?'rate_limited':r.status===401||r.status===403||x?.error_code==='invalid_credentials'?'unauthorized':'unavailable');
   return x;
  }catch(e){throw Error(['rate_limited','unauthorized'].includes(e.message)?e.message:'unavailable')}finally{clearTimeout(timer)}
 };
 return {
  websiteComments:()=>request('/rest/v1/community_messages?select=id,nickname,body,created_at&kind=eq.comment&status=eq.approved&game_id=eq.'+WEBSITE_COMMENT_ID+'&order=created_at.desc&limit=50'),
  submitWebsiteComment:input=>request('/functions/v1/submit-message',{method:'POST',body:JSON.stringify({...input,...validateMessage(input),kind:'comment',game_id:WEBSITE_COMMENT_ID})}),
  submit:input=>request('/functions/v1/submit-message',{method:'POST',body:JSON.stringify({...input,...validateMessage(input)})}),
  login:(email,password)=>request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})}),
  membership:token=>request('/rest/v1/community_moderators?select=user_id',{},token),
  pending:token=>request('/rest/v1/community_messages?select=*&status=eq.pending&order=created_at.asc&limit=100',{},token),
  moderate:(id,status,token)=>{if(!['approved','rejected'].includes(status))throw Error('invalid');return request('/rest/v1/community_messages?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status}),headers:{Prefer:'return=representation'}},token);},
  usageSummary:(days,token)=>request('/rest/v1/rpc/usage_summary',{method:'POST',body:JSON.stringify({p_days:days})},token),
  logout:token=>request('/auth/v1/logout',{method:'POST'},token)
 };
}

