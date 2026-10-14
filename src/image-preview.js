export function previewImage(image,kind='card') {
 const url=image.localPath||image.displayUrl||image.sourceUrl;
 if(url?.startsWith('/play-media/'))return url.replace('/play-media/','/play-thumbs/').replace(/\.[^.]+$/,`-${kind}.webp`);
 try {const parsed=new URL(url);if(parsed.protocol==='https:'&&parsed.hostname.endsWith('.googleusercontent.com'))return url.replace(/=[^/]*$/,'')+`=w${kind==='icon'?128:480}`;}catch{}
 return url;
}
