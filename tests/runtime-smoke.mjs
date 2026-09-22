import { chromium } from "playwright";
import { spawn } from "node:child_process";

const server=spawn("npm",["run","preview","--","--host","127.0.0.1","--port","4173"],{stdio:"inherit",shell:process.platform==="win32"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
  await sleep(1500);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:800,height:900}});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:4173/dungeon/",{waitUntil:"networkidle"});
  const result=await page.evaluate(()=>{
    const canvas=document.querySelector("#game");
    if(!(canvas instanceof HTMLCanvasElement))return {ok:false,reason:"game canvas missing"};
    const ctx=canvas.getContext("2d");
    if(!ctx)return {ok:false,reason:"2d context missing"};
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let nonBlack=0;
    for(let i=0;i<pixels.length;i+=4)if(pixels[i]||pixels[i+1]||pixels[i+2])nonBlack++;
    return {ok:nonBlack>500,nonBlack,reason:nonBlack>500?"":"viewport stayed black"};
  });
  if(errors.length)throw new Error("Browser runtime error: "+errors.join(" | "));
  if(!result.ok)throw new Error(result.reason+" (non-black pixels: "+result.nonBlack+")");
  console.log("Runtime smoke passed:",result.nonBlack,"non-black pixels rendered.");
}finally{
  if(browser)await browser.close();
  server.kill();
}
