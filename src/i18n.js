import en from './locales/en.json' with {type:'json'};
import hans from './locales/zh-Hans.json' with {type:'json'};
import hant from './locales/zh-Hant.json' with {type:'json'};
import ja from './locales/ja.json' with {type:'json'};
import es from './locales/es.json' with {type:'json'};
import fr from './locales/fr.json' with {type:'json'};
import de from './locales/de.json' with {type:'json'};
import pt from './locales/pt.json' with {type:'json'};
import th from './locales/th.json' with {type:'json'};
import id from './locales/id.json' with {type:'json'};
export const messages={en,'zh-Hans':hans,'zh-Hant':hant,ja,es,fr,de,pt,th,id};
export const languages=[{code:'en',label:'English'},{code:'zh-Hans',label:'简体中文'},{code:'zh-Hant',label:'繁體中文'},{code:'ja',label:'日本語'},{code:'es',label:'Español'},{code:'fr',label:'Français'},{code:'de',label:'Deutsch'},{code:'pt',label:'Português'},{code:'th',label:'ไทย'},{code:'id',label:'Bahasa Indonesia'}];
export const preferenceKey='stratum-language';
export function initialPreference(storage){
 try{const value=storage.getItem(preferenceKey);return Object.hasOwn(messages,value)?value:'auto'}catch{return 'auto'}
}
export function resolveLanguage(preference,systemLanguages=[]){
 if(Object.hasOwn(messages,preference))return preference;
 for(const input of systemLanguages){
  const parts=String(input).toLowerCase().replaceAll('_','-').split('-');
  if(parts[0]==='zh'){
   if(parts.includes('hant'))return 'zh-Hant';
   if(parts.includes('hans'))return 'zh-Hans';
   return parts.some(p=>['tw','hk','mo'].includes(p))?'zh-Hant':'zh-Hans';
  }
  if(Object.hasOwn(messages,parts[0]))return parts[0];
 }
 return 'en';
}
export const translate=(locale,key)=>messages[locale]?.[key]??messages.en[key]??key;
