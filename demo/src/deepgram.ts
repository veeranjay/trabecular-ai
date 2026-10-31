import { AgentSession, AgentMicrophone, AgentPlayer, type AgentSessionConfig } from '@deepgram/agents';
import { agentPrompt, agentTools, validateToolCall, type VoiceContext } from './voice-contract';
export type AgentStatus='idle'|'connecting'|'listening'|'thinking'|'speaking';
export function agentConfiguration(context:VoiceContext,tokenFactory:()=>Promise<string>):AgentSessionConfig {
 return {auth:{tokenFactory},agent:{listen:{provider:{type:'deepgram',version:'v1',model:'nova-3'}},think:{provider:{type:'open_ai',model:'gpt-4o-mini'},prompt:agentPrompt(context),functions:agentTools},speak:{provider:{type:'deepgram',model:'aura-2-thalia-en'}}},audio:{input:{encoding:'linear16',sampleRate:16000},output:{encoding:'linear16',sampleRate:24000}},reconnect:{enabled:false},tags:['trabecular-presentation']};
}
type Callbacks={context:()=>VoiceContext;tool:(name:string,args:Record<string,any>)=>unknown;status:(value:AgentStatus)=>void;text:(role:string,text:string)=>void;error:(text:string)=>void;ended:()=>void;accessCode:()=>string};
export class DeepgramConnection {
 private session:AgentSession;private microphone:AgentMicrophone;private player:AgentPlayer;
 private closed=false;private ready=false;private capturing=false;private caseId:string;private timer:ReturnType<typeof setTimeout>|null=null;private idleTimer:ReturnType<typeof setTimeout>|null=null;private playbackTimer:ReturnType<typeof setTimeout>|null=null;private ignoredAudio=false;
 private calls=new Map<string,Promise<string>>();
 constructor(private callbacks:Callbacks,drivers={Session:AgentSession,Microphone:AgentMicrophone,Player:AgentPlayer}){
  this.caseId=callbacks.context().case_id;
  this.session=new drivers.Session(agentConfiguration(callbacks.context(),async()=>{
   const response=await fetch('/api/deepgram-token',{method:'POST',headers:{'Content-Type':'application/json',...(callbacks.accessCode()?{'X-Voice-Access-Code':callbacks.accessCode()}: {})},body:'{}',signal:AbortSignal.timeout(12000)});
   const data=await response.json();if(!response.ok||!data.access_token)throw new Error(data.error||'Could not start Deepgram.');return data.access_token;
  }));
  this.microphone=new drivers.Microphone(data=>{if(!this.closed&&this.ready)this.session.sendAudio(data);},{sampleRate:16000});
  this.player=new drivers.Player({sampleRate:24000});
  this.session.on('settings-applied',()=>{if(this.closed)return;this.ready=true;this.microphone.unmute();callbacks.status('listening');this.resetIdle();});
  this.session.on('conversation-text',message=>{if(this.closed)return;callbacks.text(message.role,message.content);this.resetIdle();});
  this.session.on('audio',chunk=>{if(!this.closed&&!this.ignoredAudio)this.player.queue(chunk);});
  this.session.on('user-started-speaking',()=>{if(this.closed)return;this.clearPlayback();this.player.interrupt();this.ignoredAudio=false;callbacks.status('listening');this.resetIdle();});
  this.session.on('agent-thinking',()=>{if(!this.closed)callbacks.status('thinking');});
  this.session.on('agent-started-speaking',()=>{if(!this.closed){this.ignoredAudio=false;callbacks.status('speaking');}});
  this.session.on('agent-audio-done',()=>{if(this.closed)return;this.clearPlayback();this.playbackTimer=setTimeout(()=>{if(!this.closed){callbacks.status('listening');this.ignoredAudio=false;this.resetIdle();}},this.player.getRemainingPlaybackTime()*1000+50);});
  this.session.on('function-call-request',async message=>{
   for(const call of message.functions){
    if(this.closed||!call.client_side)continue;
    let output=this.calls.get(call.id||'');
    if(!output){output=Promise.resolve().then(()=>{
     if(this.closed||this.caseId!==callbacks.context().case_id)throw new Error('The case changed. Reconnect voice before changing this design.');
     if(this.calls.size>64)throw new Error('Session action limit reached. Start a new session.');
     if((call.arguments||'').length>4096)throw new Error('Tool arguments are too large.');
     const args=validateToolCall(call.name,JSON.parse(call.arguments||'{}'));
     return JSON.stringify(callbacks.tool(call.name,args));
    }).catch(error=>JSON.stringify({error:error instanceof Error?error.message:'Workspace action failed.'}));if(call.id)this.calls.set(call.id,output);}
    const content=await output;if(!this.closed)this.session.sendFunctionCallResponse(call.id,call.name,content);
   }
  });
  this.session.on('sdk-error',error=>{if(!this.closed){callbacks.error(error.message||'The voice connection failed.');this.stop();}});
  this.session.on('error',()=>{if(!this.closed){callbacks.error('Deepgram rejected the voice session. Check account access and the configured voice models.');this.stop();}});
  this.session.on('injection-refused',()=>{if(!this.closed)callbacks.error('The agent is still speaking. Interrupt it or try the command again.');});
  this.session.on('disconnected',()=>{if(!this.closed)this.stop();});
 }
 async connect(capture:boolean){
  this.callbacks.status('connecting');
  const timeout=setTimeout(()=>{if(!this.ready&&!this.closed){this.callbacks.error('Deepgram did not become ready. Please reconnect.');this.stop();}},18000);
  try{
   if(capture){await this.microphone.start();this.capturing=true;this.microphone.mute();if(this.closed){this.microphone.stop();return;}}
   await this.session.connect();if(this.closed)return;
   await new Promise<void>((resolve,reject)=>{if(this.ready){resolve();return;}const deadline=setTimeout(()=>reject(new Error('Deepgram settings were not accepted.')),15000);this.session.once('settings-applied',()=>{clearTimeout(deadline);resolve();});this.session.once('disconnected',()=>{clearTimeout(deadline);reject(new Error('The voice connection closed.'));});});
   if(this.closed)return;this.timer=setTimeout(()=>{this.callbacks.error('The five-minute voice session ended. Start a new session to continue.');this.stop();},300000);
  }catch(error){if(!this.closed){this.callbacks.error(error instanceof Error?error.message:'Could not start voice.');this.stop();}}
  finally{clearTimeout(timeout);}
 }
 async startMicrophone(){await this.microphone.start();if(this.closed){this.microphone.stop();return;}this.capturing=true;if(this.ready)this.microphone.unmute();}
 get microphoneActive(){return this.capturing&&!this.microphone.muted&&!this.closed;}
 get connected(){return this.ready&&!this.closed;}
 send(text:string){if(!this.connected)throw new Error('Deepgram is not connected.');this.player.interrupt();this.ignoredAudio=false;this.session.injectUserMessage(text);this.resetIdle();}
 setSound(enabled:boolean){if(enabled)this.player.unmute();else this.player.mute();}
 setMicrophone(enabled:boolean){if(enabled)this.microphone.unmute();else this.microphone.mute();}
 getVolume(){return Math.max(this.microphone.getInputVolume(),this.player.getOutputVolume());}
 interrupt(){this.player.interrupt();this.ignoredAudio=true;this.clearPlayback();if(!this.closed)this.callbacks.status('listening');}
 updateContext(){if(this.closed)return;if(this.caseId!==this.callbacks.context().case_id){this.callbacks.error('Case changed. Reconnect the copilot for this anatomy.');this.stop();}else if(this.ready)this.session.updatePrompt(agentPrompt(this.callbacks.context()));}
 private resetIdle(){if(this.idleTimer)clearTimeout(this.idleTimer);this.idleTimer=setTimeout(()=>{if(!this.closed){this.callbacks.error('Voice paused after a minute without conversation. Reconnect when ready.');this.stop();}},60000);}
 private clearPlayback(){if(this.playbackTimer)clearTimeout(this.playbackTimer);this.playbackTimer=null;}
 stop(){if(this.closed)return;this.closed=true;this.ready=false;if(this.timer)clearTimeout(this.timer);if(this.idleTimer)clearTimeout(this.idleTimer);this.clearPlayback();this.microphone.stop();this.session.disconnect();this.session.removeAllListeners();this.player.dispose();this.calls.clear();this.callbacks.status('idle');this.callbacks.ended();}
}
