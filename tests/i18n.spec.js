import {test,expect} from '@playwright/test';
import {languages,translate} from '../src/i18n.js';
test('system language, manual override, persistence and return to system',async({browser})=>{
 const context=await browser.newContext({locale:'ja-JP'});
 const page=await context.newPage();await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('lang','ja');
 await expect(page.getByRole('heading',{level:1})).toHaveText(translate('ja','Your next strategy game, at a glance.'));
 await page.getByTestId('language-select').selectOption('de');await page.reload();
 await expect(page.locator('html')).toHaveAttribute('lang','de');
 await expect(page.getByRole('button',{name:'Alle Spiele',exact:true})).toBeVisible();
 await page.getByTestId('language-select').selectOption('auto');
 await expect(page.locator('html')).toHaveAttribute('lang','ja');
 await context.close();
});
test('every language translates navigation, filters and dialogs without mobile overflow',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 for(const {code} of languages){
  await page.getByTestId('language-select').selectOption(code);
  await expect(page.locator('html')).toHaveAttribute('lang',code);
  await expect(page.getByRole('button',{name:translate(code,'All games'),exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{level:1})).toHaveText(translate(code,'Your next strategy game, at a glance.'));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),code).toBe(true);
  await page.locator('.game-name').first().click();
  await expect(page.locator('.tag-evidence summary')).toHaveText(translate(code,'Tag evidence'));
  await expect(page.locator('.feedback')).not.toBeEmpty();
  await page.getByRole('button',{name:translate(code,'Close dialog'),exact:true}).click();
 }
 expect(errors).toEqual([]);
});
test('traditional Chinese follows system region; unsupported systems fall back to English',async({browser})=>{
 for(const [locale,expected] of [['zh-TW','zh-Hant'],['ko-KR','en']]){
  const context=await browser.newContext({locale});const page=await context.newPage();await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang',expected);await context.close();
 }
});
