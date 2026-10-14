import React from 'react';
import content from './data/content-translations.json';
import {localizeContent} from './content-i18n.js';
import {translate} from './i18n.js';

export default function ContentText({source,locale,reviewed,as:Element='p',className=''}){
 const value=localizeContent(source,locale,content.translations,reviewed);
 return <div className="localized-content" data-content-language={value.translated?locale:'en'}>
  <Element className={className}>{value.text}</Element>
  {value.method!=='original'&&<div className="translation-note">
   <small>{translate(locale,value.method==='machine'?'Machine translation':value.method==='reviewed'?'Reviewed translation':'Translation unavailable; showing original')}</small>
   {value.translated&&<details className="original-content"><summary>{translate(locale,'View original')}</summary><p lang="en">{value.original}</p></details>}
  </div>}
 </div>;
}
