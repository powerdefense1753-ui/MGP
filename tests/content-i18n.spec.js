import {test,expect} from '@playwright/test';
import {games,details} from '../src/catalog.js';
import summaries from '../src/data/review-summaries.json' with {type:'json'};
import content from '../src/data/content-translations.json' with {type:'json'};
import {languages,translate} from '../src/i18n.js';
test('descriptions, summary and excerpts follow every language, with accessible originals',async({page})=>{
 await page.goto('/');const game=games[0],source=game.overviewEn||game.description,summary=summaries[game.id];
 const expected=(text,code,reviewed)=>code==='en'?text:code==='zh-Hans'&&reviewed?reviewed:content.translations[code][text];
 for(const {code} of languages){
  await page.getByTestId('language-select').selectOption(code);
  await expect(page.locator('.game-card .overview').first()).toHaveText(expected(source,code,summary.overviewZh));
  await page.locator('.game-name').first().click();
  await expect(page.locator('.modal-body .overview')).toHaveText(expected(source,code,summary.overviewZh));
  await expect(page.locator('.feedback-section .localized-content>p').first()).toHaveText(expected(summary.positive.en,code,summary.positive.zh));
  await page.locator('.sample-link').click();const excerpt=details[game.id].reviews[0].excerpt;
  await expect(page.locator('.review-excerpt blockquote').first()).toHaveText(expected(excerpt,code));
  if(code!=='en'){
   const original=page.locator('.review-excerpt').first().locator('.original-content');await original.locator('summary').click();
   await expect(original.locator('p')).toHaveText(excerpt);
   await expect(page.locator('.review-excerpt').first()).toContainText(translate(code,'Machine translation'));
  }
  await page.getByRole('button',{name:translate(code,'Close dialog'),exact:true}).click();
 }
});
