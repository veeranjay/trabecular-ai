import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { DeepgramConnection } from '../.checks/deepgram.mjs';
import { agentTools, validateToolCall } from '../src/voice-contract.ts';
const context={case_id:'female',case_name:'fixture',params:{thickness:1.5,width:3,advancement:6,screwLength:8,angle:0,load:520,modulus:1200,clearance:4,loadCase:'bilateral'},response:{source:'illustrative-demo'},baseline:{},busy:'',candidates:[],study:{},source:'illustrative-demo'};
test('provider settings use endpoint omission for client tools and defer mutations until turn end',()=>{
 for(const tool of agentTools){assert.equal('client_side' in tool,false);assert.equal('endpoint' in tool,false);assert.equal(tool.defer_until_eot,tool.name!=='inspect_workspace');}
});
test('tool contracts reject unlisted actions, invalid numbers, extra fields and bad enums',()=>{
 for(const [name,args] of [['shell',{command:'x'}],['update_design',{changes:{thickness:100}}],['update_design',{changes:{thickness:NaN}}],['update_design',{changes:{thickness:true}}],['update_design',{changes:{private_key:'x'}}],['control_camera',{view:'unknown'}],['show_field',{field:'hidden'}],['run_workflow',{action:'deploy'}],['inspect_workspace',{unexpected:true}]])assert.throws(()=>validateToolCall(name,args));
 assert.equal(validateToolCall('update_design',{changes:{thickness:2,angle:-10,loadCase:'left'}}).changes.thickness,2);
});
class Session extends EventEmitter{static last;constructor(config){super();this.config=config;this.answers=[];Session.last=this;}async connect(){this.emit('settings-applied',{});}disconnect(){this.emit('disconnected','closed');}updatePrompt(){}sendAudio(){}injectUserMessage(){}sendFunctionCallResponse(id,name,text){this.answers.push({id,name,text});}}
class Microphone{static last;constructor(){this.muted=true;this.stops=0;Microphone.last=this;}async start(){}mute(){this.muted=true;}unmute(){this.muted=false;}stop(){this.stops++;}getInputVolume(){return 0;}}
class Player{static last;constructor(){this.disposed=false;Player.last=this;}queue(){}interrupt(){}mute(){}unmute(){}getRemainingPlaybackTime(){return 0;}getOutputVolume(){return 0;}dispose(){this.disposed=true;}}
function fixture(){const state=structuredClone(context),events=[],errors=[];let effects=0;const connection=new DeepgramConnection({context:()=>state,tool:()=>{effects++;return{applied:true};},status:s=>events.push(s),text(){},error:e=>errors.push(e),ended(){},accessCode:()=>''},{Session,Microphone,Player});return{connection,state,events,errors,effects:()=>effects};}
test('replayed function calls execute the workspace effect once',async()=>{const f=fixture();await f.connection.connect(false);const call={id:'same-call',name:'update_design',client_side:true,arguments:'{"changes":{"thickness":2}}'};Session.last.emit('function-call-request',{functions:[call]});Session.last.emit('function-call-request',{functions:[call]});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.effects(),1);assert.equal(Session.last.answers.length,2);f.connection.stop();});
test('case changes disconnect and release all session resources',async()=>{const f=fixture();await f.connection.connect(true);assert.equal(f.connection.connected,true);f.state.case_id='male';f.connection.updateContext();assert.equal(f.connection.connected,false);assert.ok(Microphone.last.stops>0);assert.equal(Player.last.disposed,true);assert.match(f.errors[0],/Case changed/);});
test('closing prevents late function calls from mutating the workspace',async()=>{const f=fixture();await f.connection.connect(false);f.connection.stop();Session.last.emit('function-call-request',{functions:[{id:'late',name:'run_workflow',client_side:true,arguments:'{"action":"study"}'}]});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.effects(),0);});
