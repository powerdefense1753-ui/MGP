// Preserve the complete listing order, with one entry per distinct official image.
export function allScreenshots(urls = [], cached = []) {
 const base = url => url.replace(/=[^/]*$/, '');
 const known = new Map(cached.map(image => [base(image.listingSourceUrl || image.sourceUrl), image]));
 return [...new Set(urls.map(base))].map(url => {
  const origin = new URL(url);
  if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.googleusercontent.com')) throw new Error('Unexpected screenshot origin');
  return known.get(url) || {sourceUrl:url, displayUrl:url+'=w1280', storage:'remote'};
 });
}
