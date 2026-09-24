import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4173'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4173/dungeon/')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/dungeon/');
 const view=async id=>{await page.waitForFunction(id=>document.querySelector('#viewport').dataset.view===id,id);await page.waitForFunction(()=>!document.querySelector('#spots').inert);assert.ok(await page.locator('#room').evaluate(img=>img.complete&&img.naturalWidth>1000))};
 const go=async(label,id)=>{await page.getByRole('button',{name:label,exact:true}).click();await view(id)};
 await view('entrance');
 await go('Approach the saint','saint');await go('Touch the worn bowl','saint');await go('Step back','entrance');
 await go('Follow the blue tiles','gallery');await go('Examine the broken tiles','tiles');await go('Step back','gallery');await go('Continue into the chapel','chapel');await go('Walk between the benches','altar');await go('Step back between the benches','chapel');
 await go('Pass behind the altar','crypt');await go('Look inside the low alcove','alcove');await go('Step back','crypt');await go('Descend below the chapel','cistern');
 await go('Kneel at the water','water');await go('Touch the water','water');await go('Stand up on the ledge','cistern');await go('Follow the ledge to the return stair','stair');await go('Climb back to the saint','entrance');
 // Reverse the complete loop, then traverse the shortcut in both directions.
 await go('Go down beside the iron rail','stair');await go('Step onto the cistern ledge','cistern');await go('Climb toward the burial niches','crypt-back');await go('Return beside the altar','chapel-back');await go('Walk back into the gallery','gallery-back');await go('Return to the saint','entrance');
 await go('Follow the blue tiles','gallery');await go('Follow the water downhill','watercourse');await go('Examine the mineral seam','seam');await go('Step back','watercourse');await go('Follow the channel to the cistern','cistern');await go('Climb the sloping watercourse','watercourse');await go('Climb to the blue tiles','gallery-back');
 await page.reload();await view('gallery-back');
 await page.getByRole('button',{name:'Map',exact:true}).click();assert.equal(await page.locator('#map circle').count(),7);await page.getByRole('button',{name:'Close',exact:true}).click();
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const image=await page.locator('#viewport').boundingBox();for(const spot of await page.locator('.spot').all()){const r=await spot.boundingBox();assert.ok(r.x>=image.x-1&&r.y>=image.y-1&&r.x+r.width<=image.x+image.width+1&&r.y+r.height<=image.y+image.height+1)}}
 assert.deepEqual(errors,[]);console.log('Passed: both loop directions, shortcut, close views, persistence, discovered map, mobile geometry, image loads, runtime errors.');
}finally{if(browser)await browser.close();server.kill()}
