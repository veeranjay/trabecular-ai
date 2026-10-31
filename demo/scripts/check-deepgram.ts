// Explicitly invoked, bounded provider integration check. No microphone recording.
import { AgentSession } from '@deepgram/agents';
import { agentConfiguration } from '../src/deepgram';
import { validateToolCall, type VoiceContext } from '../src/voice-contract';
import { loadLocalEnvironment } from '../server/load-env.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
loadLocalEnvironment();
const key=process.env.DEEPGRAM_API_KEY;if(!key)throw new Error('Configure DEEPGRAM_API_KEY locally before this optional provider check.');
const started=Date.now(),metrics={settings_applied:false,user_transcript_received:false,function_calls:[] as string[],parameter_applied:false,output_audio_bytes:0,assistant_text_received:false,elapsed_seconds:0,passed:false,source:'generated speech / fixture workspace; no human microphone'};
const context:VoiceContext={case_id:'female',case_name:'Integration fixture',params:{thickness:1.5,width:3,advancement:6,screwLength:8,angle:0,load:520,modulus:1200,clearance:4,loadCase:'bilateral'},response:{source:'illustrative-demo'},baseline:{},busy:'',candidates:[],study:{},source:'illustrative-demo'};
const speech=await fetch('https://api.deepgram.com/v1/speak?model=aura-2-thalia-en&encoding=linear16&sample_rate=16000&container=none',{method:'POST',headers:{Authorization:`Token ${key}`,'Content-Type':'application/json'},body:JSON.stringify({text:'Set the plate thickness to two millimeters.'}),signal:AbortSignal.timeout(10000)});
if(!speech.ok)throw new Error(`Speech-fixture generation failed (${speech.status}); no account details logged.`);
const pcm=new Uint8Array(await speech.arrayBuffer());
const session=new AgentSession(agentConfiguration(context,async()=>{const res=await fetch('https://api.deepgram.com/v1/auth/grant',{method:'POST',headers:{Authorization:`Token ${key}`,'Content-Type':'application/json'},body:'{"ttl_seconds":30}',signal:AbortSignal.timeout(8000)});if(!res.ok)throw Error(`Token grant rejected (${res.status}).`);return(await res.json()).access_token;}));
let finish:()=>void,fail:(e:Error)=>void;const done=new Promise<void>((resolve,reject)=>{finish=resolve;fail=reject;});
const timeout=setTimeout(()=>fail(new Error('Bounded Deepgram check timed out.')),25000);
session.on('error',message=>{const description=String(message.description||message.message||message.code||'Voice settings rejected').replaceAll(key,'[redacted]').replace(/eyJ[A-Za-z0-9_.-]+/g,'[redacted token]');fail(new Error('Deepgram: '+description.slice(0,700)));});session.on('sdk-error',()=>fail(new Error('Deepgram transport failed.')));
session.on('conversation-text',message=>{if(message.role==='user')metrics.user_transcript_received=true;else metrics.assistant_text_received=true;});
session.on('audio',chunk=>{metrics.output_audio_bytes+=chunk.byteLength;});
session.on('function-call-request',message=>{for(const call of message.functions){if(!call.client_side)continue;try{const args=validateToolCall(call.name,JSON.parse(call.arguments||'{}'));metrics.function_calls.push(call.name);let result:unknown=context;if(call.name==='update_design'){Object.assign(context.params,args.changes);metrics.parameter_applied=context.params.thickness===2;result={applied:true,params:context.params,source:'illustrative-demo'};}session.sendFunctionCallResponse(call.id,call.name,JSON.stringify(result));}catch{session.sendFunctionCallResponse(call.id,call.name,'{"error":"Invalid integration-fixture tool call."}');}}});
session.on('agent-audio-done',()=>{if(metrics.parameter_applied&&metrics.output_audio_bytes>0)finish();});
session.on('settings-applied',async()=>{metrics.settings_applied=true;const audio=new Uint8Array(pcm.length+64000);audio.set(pcm);for(let i=0;i<audio.length;i+=640){if(Date.now()-started>24000)break;const chunk=audio.slice(i,i+640);session.sendAudio(chunk.buffer);await new Promise(resolve=>setTimeout(resolve,20));}});
try{await Promise.race([session.connect(),done]);await done;metrics.passed=metrics.settings_applied&&metrics.user_transcript_received&&metrics.parameter_applied&&metrics.assistant_text_received&&metrics.output_audio_bytes>0;}
finally{clearTimeout(timeout);session.disconnect();session.removeAllListeners();metrics.elapsed_seconds=(Date.now()-started)/1000;await mkdir('../docs/verification',{recursive:true});await writeFile('../docs/verification/deepgram-live-check.json',JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));}
if(!metrics.passed)throw new Error('Provider check did not satisfy all gates.');
