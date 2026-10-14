export function localizeContent(source,locale,dictionaries,reviewed){
 const original=source||'';
 if(!original||locale==='en')return {text:original,original,method:'original',translated:false};
 if(reviewed)return {text:reviewed,original,method:'reviewed',translated:true};
 const translated=dictionaries[locale]?.[original];
 return translated?{text:translated,original,method:'machine',translated:true}:{text:original,original,method:'unavailable',translated:false};
}
