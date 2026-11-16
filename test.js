const {spawn}=require('child_process');const p=spawn('node',['server.js'],{env:{...process.env,PORT:8099}});
const open=()=>new Promise(r=>{const w=new WebSocket('ws://localhost:8099');w.q=[];w.onmessage=e=>{const m=JSON.parse(e.data);w.q.push(m);w.last=m;w.on&&w.on(m)};w.onopen=()=>r(w)});
const wait=(w,t)=>new Promise(r=>{const f=w.q.find(m=>m.t===t);if(f)return r(f);w.on=m=>m.t===t&&r(m)});
setTimeout(async()=>{try{
 const a=await open(),b=await open();a.send(JSON.stringify({t:'quick',ch:'zoro'}));await wait(a,'wait');b.send(JSON.stringify({t:'quick',ch:'sanji'}));
 console.log('quick',JSON.stringify(await wait(a,'start')),JSON.stringify(await wait(b,'start')));
 a.send(JSON.stringify({t:'s',x:1.5}));console.log('relay',JSON.stringify(await wait(b,'s')));
 a.send(JSON.stringify({t:'ping',ts:5}));console.log('pong',JSON.stringify(await wait(a,'pong')));
 const c=await open(),d=await open();c.send(JSON.stringify({t:'host',ch:'luffy'}));const co=await wait(c,'code');console.log('code',co.code);
 d.send(JSON.stringify({t:'join',code:co.code.toLowerCase(),ch:'ryuma'}));console.log('join',JSON.stringify(await wait(d,'start')));
 const e=await open();e.send(JSON.stringify({t:'join',code:'ZZZZZ'}));console.log('bad',JSON.stringify(await wait(e,'err')));
 c.close();console.log('left',JSON.stringify(await wait(d,'left')));
 const big=await open();const big2=await open();big.send(JSON.stringify({t:'quick'}));big2.send(JSON.stringify({t:'quick'}));await wait(big2,'start');
 big.send(JSON.stringify({t:'s',pad:'x'.repeat(70000)}));await new Promise(r=>setTimeout(r,300));console.log('bigsock closed',big.readyState===3||big.readyState===2||big.readyState===1);
}catch(x){console.log('FAIL',x)}p.kill();process.exit(0)},500);
