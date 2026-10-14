export function listingLinks(html){
 const ids=new Set();
 for(const match of html.matchAll(/href="([^"]+)"/g)){
  try{const url=new URL(match[1].replaceAll('&amp;','&'),'https://play.google.com');if(url.hostname==='play.google.com'&&url.pathname==='/store/apps/details'){const id=url.searchParams.get('id');if(id&&/^[a-zA-Z0-9_.]+$/.test(id))ids.add(id);}}catch{}
 }
 return [...ids];
}
export function queueTask(tasks,kind,id,via=''){
 const key=kind+':'+id;
 if(!tasks[key])tasks[key]={kind,id,via,status:'pending',attempts:0,createdAt:new Date().toISOString()};
 return tasks[key];
}
export function pickTasks(tasks,n,now=Date.now()){
 return Object.values(tasks).filter(t=>t.status==='pending'&&(!t.notBefore||t.notBefore<=now)).sort((a,b)=>({app:0,developer:1,expand:2,search:3}[a.kind]-{app:0,developer:1,expand:2,search:3}[b.kind])).slice(0,n);
}

export function developerKey(app){
 const id=app.developerInternalID||app.developerId;if(!id)return null;
 try{return decodeURIComponent(String(id).replaceAll('+',' '));}catch{return String(id);}
}
