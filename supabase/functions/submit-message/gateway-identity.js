export async function gatewayIdentity(headers,raw,secret,now=Date.now()){
 const ip=headers.get('x-community-client'),ts=headers.get('x-community-timestamp'),sig=headers.get('x-community-signature');
 if(!secret||!ip||!/^[a-fA-F0-9:.]{2,64}$/.test(ip)||!ts||!/^\d+$/.test(ts)||Math.abs(now/1000-Number(ts))>60||!sig||!/^[a-f0-9]{64}$/.test(sig))return null;
 const bytes=new TextEncoder(),digest=await crypto.subtle.digest('SHA-256',bytes.encode(raw));
 const hex=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const key=await crypto.subtle.importKey('raw',bytes.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const signature=Uint8Array.from(sig.match(/../g),x=>parseInt(x,16));
 const valid=await crypto.subtle.verify('HMAC',key,signature,bytes.encode(ts+'\n'+ip+'\n'+hex));
 return valid?ip:null;
}
