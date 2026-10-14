import test from 'node:test';
import assert from 'node:assert/strict';
import {languages,resolveLanguage,initialPreference,translate,messages} from './i18n.js';
test('system locales match supported languages and Chinese scripts',()=>{
 for(const [input,expected] of [['en-GB','en'],['zh-CN','zh-Hans'],['zh-SG','zh-Hans'],['zh-TW','zh-Hant'],['zh-HK','zh-Hant'],['zh-Hant-CN','zh-Hant'],['zh-Hans-HK','zh-Hans'],['ja-JP','ja'],['es-MX','es'],['fr-CA','fr'],['de-AT','de'],['pt-BR','pt'],['th-TH','th'],['id-ID','id']]) assert.equal(resolveLanguage('auto',[input]),expected);
 assert.equal(resolveLanguage('auto',['ko-KR','fr-FR']),'fr');
 assert.equal(resolveLanguage('auto',['ko-KR']),'en');
 assert.equal(resolveLanguage('ja',['en-US']),'ja');
});
test('manual preference persists and unavailable storage safely uses system',()=>{
 assert.equal(initialPreference({getItem:()=> 'es'}),'es');
 assert.equal(initialPreference({getItem:()=> 'invalid'}),'auto');
 assert.equal(initialPreference({getItem:()=>{throw Error('denied')}}),'auto');
});
test('all ten interface dictionaries cover every message',()=>{
 assert.equal(languages.length,10);
 const keys=Object.keys(messages.en);
 for(const {code} of languages) for(const key of keys) assert.ok(messages[code][key]?.trim(),code+': '+key);
 assert.equal(translate('ja','All games'),'すべてのゲーム');
});
