import {readFile,writeFile,readdir} from 'node:fs/promises';
const files=await readdir(new URL('../dist/assets/',import.meta.url));
let js=await readFile(new URL('../dist/assets/'+files.find(f=>f.endsWith('.js')),import.meta.url),'utf8');
const css=await readFile(new URL('../dist/assets/'+files.find(f=>f.endsWith('.css')),import.meta.url),'utf8');
const mediaFiles=await readdir(new URL('../dist/play-media/',import.meta.url));
const embedded=new Map();
for(const file of mediaFiles){const bytes=await readFile(new URL('../dist/play-media/'+file,import.meta.url));const mime=file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'image/jpeg';embedded.set('/play-media/'+file,'data:'+mime+';base64,'+bytes.toString('base64'));}
js=js.replace(/\/play-media\/[a-zA-Z0-9._-]+/g,url=>embedded.get(url)||url);
const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#244637"><title>Stratum — Interactive prototype</title><style>${css.replaceAll('</style','<\\/style')}</style></head><body><div id="root"></div><script type="module">${js.replaceAll('</script','<\\/script')}</script></body></html>`;
await writeFile(new URL('../dist/stratum-prototype.html',import.meta.url),html);
await writeFile(new URL('../dist/stratum-table.html',import.meta.url),html);
console.log('Standalone files: dist/stratum-prototype.html and dist/stratum-table.html');
