const { chromium } = require('/home/user/wook/pipeline/node_modules/playwright');
const path=require('path'),fs=require('fs');
(async()=>{const out=path.join(__dirname,'frames');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
 const fps=30;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
 const p=await b.newPage({viewport:{width:540,height:960}});p.on('console',m=>m.type()==='error'&&console.log('console:',m.text()));
 await p.goto('file://'+path.join(__dirname,'scene.html'));await p.waitForFunction(()=>window.isReady&&window.isReady());
 const total=await p.evaluate(()=>window.TOTAL);const n=Math.round(total*fps);
 for(let i=0;i<n;i++){await p.evaluate(t=>window.renderAt(t),i/fps);await p.screenshot({path:path.join(out,`f${String(i).padStart(4,'0')}.png`)});}
 await b.close();console.log('frames',n,'total',total.toFixed(2));})();
