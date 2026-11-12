import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { buildRequest, queryProvider } from '../providers.js';
const env={OPENAI_API_KEY:'fake-openai-test-secret',ANTHROPIC_API_KEY:'fake-anthropic-test-secret'};
async function withServer(fn,options={}) {
  const server=createApp(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{await fn(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(r=>server.close(r));}
}
const post=(url,data,headers={})=>fetch(`${url}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof data==='string'?data:JSON.stringify(data)});
test('adapters preserve the same question and instruction',()=>{
 const a=buildRequest('openai','Olá',env),b=buildRequest('anthropic','Olá',env);
 assert.equal(a.body.input,b.body.messages[0].content);assert.equal(a.body.instructions,b.body.system);assert.equal(a.body.max_output_tokens,b.body.max_tokens);assert.equal(a.body.store,false);
});
test('demo never calls external APIs and identifies fictitious data',async()=>{
 const r=await queryProvider('openai','teste','demo',{env,fetchImpl:()=>{throw Error('must not run');}});
 assert.equal(r.mode,'demo');assert.equal(r.elapsedMs,null);assert.match(r.notice,/fictícios/);assert.ok(!JSON.stringify(r).includes(env.OPENAI_API_KEY));
});
test('missing key does not invent upstream HTTP 401',async()=>{
 const r=await queryProvider('openai','teste','live',{env:{}});assert.equal(r.status,null);assert.equal(r.ok,false);
});
test('successful real adapter extracts nested text and removes secrets',async()=>{
 const r=await queryProvider('openai','teste','live',{env,fetchImpl:async(url,opts)=>{
 assert.equal(opts.headers.Authorization,`Bearer ${env.OPENAI_API_KEY}`);
 return Response.json({output:[{content:[{type:'output_text',text:`Resposta ${env.ANTHROPIC_API_KEY}`}]}],usage:{input_tokens:4,output_tokens:8}});
 }});assert.equal(r.ok,true);assert.match(r.text,/REMOVIDO/);assert.ok(!JSON.stringify(r).includes(env.OPENAI_API_KEY));
});
test('Anthropic extracts text blocks and keeps token usage',async()=>{
 const r=await queryProvider('anthropic','teste','live',{env,fetchImpl:async()=>Response.json({content:[{type:'text',text:'Olá'}],usage:{input_tokens:5,output_tokens:2}})});
 assert.equal(r.text,'Olá');assert.equal(r.usage.output_tokens,2);
});
test('401 and 429 do not expose upstream error bodies',async()=>{
 for(const status of [401,429]){const r=await queryProvider('anthropic','teste','live',{env,fetchImpl:async()=>new Response(env.ANTHROPIC_API_KEY,{status})});assert.equal(r.status,status);assert.ok(!JSON.stringify(r).includes(env.ANTHROPIC_API_KEY));}
});
test('timeout is reported without provider exception details',async()=>{
 const r=await queryProvider('openai','teste','live',{env,fetchImpl:async()=>{throw new DOMException('secret','TimeoutError');}});assert.match(r.error,/Tempo limite/);
});
test('HTTP: assets, .env protection, validation, origin, rate limit',async()=>withServer(async url=>{
 assert.equal((await fetch(url)).status,200);assert.equal((await fetch(url+'/.env')).status,404);
 assert.equal((await post(url,'{')).status,400);assert.equal((await post(url,{prompt:'',mode:'demo'})).status,400);
 assert.equal((await post(url,{prompt:'x',mode:'demo'},{Origin:'https://evil.example'})).status,403);
 const res=await post(url,{prompt:'Explique API',mode:'demo'});assert.equal(res.status,200);assert.equal((await res.json()).results.length,2);
 assert.equal((await post(url,{prompt:'x',mode:'demo'})).status,429);
},{env:{},limit:1}));
test('partial provider failure still returns successful response from other provider',async()=>withServer(async url=>{
 const res=await post(url,{prompt:'Explique API',mode:'live'});const data=await res.json();assert.equal(data.results[0].ok,true);assert.equal(data.results[1].status,401);
},{env,fetchImpl:async url=>url.includes('openai')?Response.json({output:[{content:[{type:'output_text',text:'Tudo certo'}]}]}):new Response('',{status:401})}));
