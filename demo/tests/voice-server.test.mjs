import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenResponse, configResponse } from '../server/deepgram.mjs';
const env={DEEPGRAM_API_KEY:'test-server-secret'};
const request=(method='POST',origin='https://test.invalid',body='{}',extra={})=>new Request('https://test.invalid/api/deepgram-token',{method,headers:{Origin:origin,...extra},...(['GET','HEAD'].includes(method)?{}:{body})});
const options=(fetcher=async()=>new Response(JSON.stringify({access_token:'test-jwt',expires_in:1000})))=>({env,fetcher,limits:new Map(),inflight:new Set(),client:'test'});
test('configuration reveals presence but never credentials',async()=>{const response=configResponse(new Request('https://test.invalid/api/voice-config'),env);const text=await response.text();assert.ok(!text.includes(env.DEEPGRAM_API_KEY));assert.equal(JSON.parse(text).configured,true);assert.match(response.headers.get('cache-control'),/no-store/);});
test('wrong method, cross-origin, absent credentials and invalid input never contact provider',async()=>{
 let calls=0;const opts=options(async()=>{calls++;throw Error();});
 assert.equal((await tokenResponse(request('GET'),opts)).status,405);
 assert.equal((await tokenResponse(request('POST','https://outside.invalid'),opts)).status,403);
 assert.equal((await tokenResponse(request(),{...opts,env:{}})).status,503);
 assert.equal((await tokenResponse(request('POST','https://test.invalid','{"ttl_seconds":9999}'),opts)).status,400);
 assert.equal((await tokenResponse(request('POST','https://test.invalid','[]'),opts)).status,400);
 assert.equal((await tokenResponse(request('POST','https://test.invalid','x'.repeat(1025)),opts)).status,413);
 assert.equal(calls,0);
});
test('server fixes TTL, keeps key out of response and uses only provider grant endpoint',async()=>{
 const opts=options(async(url,init)=>{assert.equal(url,'https://api.deepgram.com/v1/auth/grant');assert.equal(init.headers.Authorization,`Token ${env.DEEPGRAM_API_KEY}`);assert.deepEqual(JSON.parse(init.body),{ttl_seconds:30});return new Response(JSON.stringify({access_token:'test-jwt'}));});
 const response=await tokenResponse(request(),opts);assert.deepEqual(await response.json(),{access_token:'test-jwt',expires_in:30});assert.match(response.headers.get('cache-control'),/no-store/);
});
test('provider error details and secrets are never forwarded',async()=>{const opts=options(async()=>new Response(`provider details ${env.DEEPGRAM_API_KEY}`,{status:401}));const response=await tokenResponse(request(),opts);assert.equal(response.status,502);assert.ok(!(await response.text()).includes(env.DEEPGRAM_API_KEY));assert.equal(opts.inflight.size,0);});
test('optional access code gates token issuance',async()=>{const opts={...options(),env:{...env,DEEPGRAM_DEMO_ACCESS_CODE:'test-access'}};assert.equal((await tokenResponse(request(),opts)).status,401);assert.equal((await tokenResponse(request('POST','https://test.invalid','{}',{'X-Voice-Access-Code':'test-access'}),opts)).status,200);});
test('per-instance throttle rejects the seventh grant',async()=>{const opts=options();for(let i=0;i<6;i++)assert.equal((await tokenResponse(request(),opts)).status,200);assert.equal((await tokenResponse(request(),opts)).status,429);});
test('concurrent token requests from one client do not fan out provider calls',async()=>{let release;const opts=options(()=>new Promise(resolve=>{release=()=>resolve(new Response('{"access_token":"test-jwt"}'));}));const first=tokenResponse(request(),opts);await new Promise(resolve=>setImmediate(resolve));assert.equal((await tokenResponse(request(),opts)).status,429);release();assert.equal((await first).status,200);});
