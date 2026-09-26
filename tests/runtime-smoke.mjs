import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4173'],{stdio:'inherit'});
let browser;
const key='dungeon-wonder-v1',url='http://127.0.0.1:4173/dungeon/';
try{
 for(let i=0;i<50;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true,...(process.env.TEST_CHROME?{executablePath:process.env.TEST_CHROME}:{}),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 const view=async id=>{await page.waitForFunction(id=>document.querySelector('#viewport').dataset.view===id,id);await page.waitForFunction(()=>!document.querySelector('#spots').inert);assert.ok(await page.locator('#room').evaluate(img=>img.complete&&img.naturalWidth>1000))};
 const go=async(label,id)=>{await page.getByRole('button',{name:label,exact:true}).click();await view(id)};
 const turn=async id=>go('↶ Turn around',id);
 await view('fountain');
 await page.getByRole('button',{name:'Map',exact:true}).click();assert.equal(await page.locator('#map circle').count(),1);assert.ok(!(await page.locator('#map').innerText()).includes('room for one'));await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Sound off',exact:true}).click();
 await go('Sit beside the fountain','pool');await go('Trail your fingers in the water','pool');await go('Stand up','fountain');
 await go('Enter the red corridor','armor');await go('Approach the nearest helmet','visor');await go('Listen inside the helmet','visor');await go('Step back','armor');
 await go('Walk toward the bridge','bridge');await go('Lean over the parapet','shaft');await go('Step away from the edge','bridge');await go('Cross the bridge','landing');await turn('bridge-back');await turn('landing');await go('Step into the bell chamber','bell');
 assert.equal(await page.locator('[data-spot="mouth"]').count(),0);
 await page.getByRole('button',{name:'Pull the bell rope',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#spots').inert);assert.equal(await page.locator('[data-spot="mouth"]').count(),1);assert.ok((await page.locator('#room').getAttribute('src')).includes('bell-open'));
 await go('Step between the stone lips','tea');await go('Sit in the velvet chair','chair');await go('Warm your hands around the cup','chair');await page.reload();await view('chair');
 await go('Leave the chair','tea');await go('Step back through the stone lips','bell');assert.equal(await page.locator('[data-spot="mouth"]').count(),1);
 await page.getByRole('button',{name:'Pull the bell rope',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#spots').inert);assert.equal(await page.locator('[data-spot="mouth"]').count(),0);assert.ok(!(await page.locator('#room').getAttribute('src')).includes('bell-open'));
 await go('Descend into the lantern garden','mushroom');await go('Sit beneath the mushrooms','root');await go('Stand up','mushroom');await go('Return to the frog fountain','fountain');
 // Walk the loop in the other direction and verify the reverse views.
 await go('Follow the mushroom light','mushroom');await go('Climb toward the copper bell','bell');await go('Return to the bridge','bridge-back');await go('Cross back to the armor hall','armor-back');await turn('armor');await turn('armor-back');await go('Return to the frog fountain','fountain');
 await page.getByRole('button',{name:'Map',exact:true}).click();assert.equal(await page.locator('#map circle').count(),6);assert.equal(await page.locator('#map line:not(.unexplored)').count(),6);await page.keyboard.press('Escape');assert.equal(await page.locator('#map-dialog').evaluate(d=>d.open),false);
 // Directional selection and activation use real visible buttons.
 await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await view('armor');await page.keyboard.press('Escape');await view('armor-back');await go('Return to the frog fountain','fountain');
 // Simulated standard Gamepad API input exercises the actual polling adapter.
 await page.evaluate(()=>{window.testPad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};window.testPadPolls=0;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>{window.testPadPolls++;return [window.testPad]}})});
 const press=async n=>{let count=await page.evaluate(n=>{window.testPad.buttons[n].pressed=true;return window.testPadPolls},n);await page.waitForFunction(count=>window.testPadPolls>count,count);count=await page.evaluate(n=>{window.testPad.buttons[n].pressed=false;return window.testPadPolls},n);await page.waitForFunction(count=>window.testPadPolls>count,count)};
 await press(15);await press(0);await view('armor');await press(1);await view('armor-back');await press(9);assert.equal(await page.locator('#map-dialog').evaluate(d=>d.open),true);await press(1);assert.equal(await page.locator('#map-dialog').evaluate(d=>d.open),false);
 // The timed visor is visible without clicking or a notification.
 await turn('armor');await page.evaluate(()=>{Date.now=()=>47000;const m=JSON.parse(localStorage.getItem('dungeon-wonder-v1'));m.seed=1;localStorage.setItem('dungeon-wonder-v1',JSON.stringify(m))});await page.reload();await view('armor');
 await page.evaluate(()=>{Date.now=()=>47000});await page.waitForFunction(()=>document.querySelector('#echo').style.opacity==='1');assert.equal(await page.locator('#message').textContent(),'');
 // Every hotspot stays inside its image at mobile sizes, even close to edges.
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const bounds=await page.locator('#viewport').boundingBox();for(const spot of await page.locator('.spot').all()){const r=await spot.boundingBox();assert.ok(r.x>=bounds.x-1&&r.y>=bounds.y-1&&r.x+r.width<=bounds.x+bounds.width+1&&r.y+r.height<=bounds.y+bounds.height+1,JSON.stringify({bounds,r}))}}
 // Bad save values, including inherited property names, are never accepted as rooms.
 await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({view:'constructor',visited:['constructor','fountain',4],paths:['bad'],mouth:false})),key);await page.reload();await view('fountain');
 assert.deepEqual(errors,[]);
 const failPage=await browser.newPage({reducedMotion:'reduce'});await failPage.route('**/armor-*.webp',route=>route.abort());await failPage.goto(url);await failPage.waitForFunction(()=>document.querySelector('#viewport').dataset.view==='fountain'&&!document.querySelector('#spots').inert);await failPage.getByRole('button',{name:'Enter the red corridor',exact:true}).click();await failPage.waitForFunction(()=>document.querySelector('#message').textContent.includes('could not be loaded'));assert.equal(await failPage.locator('#viewport').getAttribute('data-view'),'fountain');await failPage.unroute('**/armor-*.webp');await failPage.getByRole('button',{name:'Enter the red corridor',exact:true}).click();await failPage.waitForFunction(()=>document.querySelector('#viewport').dataset.view==='armor');
 const blocked=await browser.newPage({reducedMotion:'reduce'});await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')}});await blocked.goto(url);await blocked.waitForFunction(()=>document.querySelector('#viewport').dataset.view==='fountain'&&!document.querySelector('#spots').inert);await blocked.getByRole('button',{name:'Follow the mushroom light',exact:true}).click();await blocked.waitForFunction(()=>document.querySelector('#viewport').dataset.view==='mushroom');
 console.log('Passed: both loop directions, all close views, bell opening/closing, hidden room, saved state, no map spoilers, keyboard, simulated controller, timed visor, responsive bounds, image failure/retry, invalid and unavailable storage, audio activation, no runtime errors.');
}finally{if(browser)await browser.close();server.kill()}
