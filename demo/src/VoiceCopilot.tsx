import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DeepgramConnection } from './deepgram';
import type { VoiceContext } from './voice-contract';
import { Mic, MicOff, Volume2, VolumeX, X, Send, ArrowUpRight, Sparkles, Square, Play, AudioLines } from 'lucide-react';

type Props={onCommand:(text:string)=>string;onClose:()=>void;context:VoiceContext;response:string;onBriefing:()=>void;onTool:(name:string,args:Record<string,any>)=>unknown};
type VoiceState='idle'|'connecting'|'listening'|'thinking'|'speaking';
export default function VoiceCopilot({onCommand,onClose,context,response,onBriefing,onTool}:Props){
 const [status,setStatus]=useState<VoiceState>('idle'),[transcript,setTranscript]=useState(''),[input,setInput]=useState(''),[error,setError]=useState(''),[sound,setSound]=useState(true),[level,setLevel]=useState(0),[history,setHistory]=useState<{role:string;text:string}[]>([]);
 const [provider,setProvider]=useState<'deepgram'|'browser'>('deepgram'),[dgConnected,setDgConnected]=useState(false),[micActive,setMicActive]=useState(false),[configuration,setConfiguration]=useState<{configured:boolean;requires_access_code:boolean}|null>(null),[accessCode,setAccessCode]=useState('');
 const dg=useRef<DeepgramConnection|null>(null),ctx=useRef(context),tool=useRef(onTool),code=useRef(accessCode);ctx.current=context;tool.current=onTool;code.current=accessCode;
 const recognition=useRef<any>(null),stream=useRef<MediaStream|null>(null),audio=useRef<AudioContext|null>(null),frame=useRef(0),ending=useRef(false),live=useRef(true),soundRef=useRef(sound),commandRef=useRef(onCommand),sequence=useRef(0);
 soundRef.current=sound;commandRef.current=onCommand;
 const supported=!!((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition);
 function releaseAudio(){cancelAnimationFrame(frame.current);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;audio.current?.close().catch(()=>{});audio.current=null;if(live.current)setLevel(0);}
 function stop(){sequence.current++;dg.current?.stop();dg.current=null;if(live.current){setDgConnected(false);setMicActive(false);}ending.current=true;try{recognition.current?.abort();}catch{}recognition.current=null;releaseAudio();window.speechSynthesis?.cancel();if(live.current)setStatus('idle');}
 useEffect(()=>{live.current=true;return()=>{live.current=false;stop();};},[]);
 function speak(text:string){
  if(!soundRef.current||!window.speechSynthesis){setStatus('idle');return;}
  const ticket=sequence.current;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.98;utterance.pitch=1.02;
  const voices=window.speechSynthesis.getVoices();const voice=voices.find(v=>/aria|jenny|samantha|google us english|zira/i.test(v.name))||voices.find(v=>v.lang==='en-US');if(voice)utterance.voice=voice;
  utterance.onstart=()=>{if(live.current&&ticket===sequence.current)setStatus('speaking');};utterance.onend=()=>{if(live.current&&ticket===sequence.current)setStatus('idle');};utterance.onerror=()=>{if(live.current)setStatus('idle');};setStatus('speaking');window.speechSynthesis.speak(utterance);
 }
 function submitBrowser(text:string){if(!text.trim())return;setError('');setTranscript(text);setStatus('thinking');setHistory(old=>[...old,{role:'you',text}].slice(-8));const answer=commandRef.current(text);setHistory(old=>[...old,{role:'copilot',text:answer}].slice(-8));speak(answer);}
 async function listenBrowser(){
  if(status==='listening'){stop();return;}stop();ending.current=false;setError('');setTranscript('');const ticket=sequence.current;
  if(!supported){setError('Voice recognition is not available in this browser. Open this link in Chrome or Edge, or use a typed command below.');return;}
  if(!window.isSecureContext){setError('Microphone access needs HTTPS or localhost. Please use the hosted link.');return;}
  const Constructor=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  const rec=new Constructor();recognition.current=rec;rec.lang='en-US';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
  rec.onstart=()=>{if(ticket!==sequence.current)return;if(live.current&&!ending.current)setStatus('listening');};
  rec.onresult=(event:any)=>{if(ticket!==sequence.current)return;let words='';for(let i=event.resultIndex;i<event.results.length;i++){words+=event.results[i][0].transcript;if(event.results[i].isFinal){ending.current=true;try{rec.stop();}catch{}releaseAudio();submitBrowser(words.trim());return;}}setTranscript(words);};
  rec.onerror=(event:any)=>{if(ticket!==sequence.current)return;releaseAudio();if(!live.current||ending.current)return;setStatus('idle');const messages:Record<string,string>={'not-allowed':'Microphone permission was denied. Allow it for this site in your browser, then try again.','service-not-allowed':'This browser cannot start speech recognition. Open the link in Chrome or Edge.','audio-capture':'No microphone was found. Connect one or type a command below.','no-speech':'I did not hear a command. Tap the microphone and try again.','network':'The browser speech service could not connect. Check your connection or type a command.'};setError(messages[event.error]||'Voice input could not start. Try again or use a typed command.');};
  rec.onend=()=>{if(ticket!==sequence.current)return;releaseAudio();if(live.current&&!ending.current)setStatus('idle');recognition.current=null;};
  try{
   // User-initiated capture provides actual microphone levels, never an invented waveform.
   const captured=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   if(!live.current||ticket!==sequence.current){captured.getTracks().forEach(t=>t.stop());return;}
   stream.current=captured;const ac=new AudioContext();audio.current=ac;const analyser=ac.createAnalyser();analyser.fftSize=256;ac.createMediaStreamSource(captured).connect(analyser);const data=new Uint8Array(analyser.frequencyBinCount);
   const meter=()=>{if(!live.current||!audio.current)return;analyser.getByteFrequencyData(data);setLevel(data.reduce((a,b)=>a+b,0)/data.length/128);frame.current=requestAnimationFrame(meter);};meter();setStatus('listening');rec.start();
  }catch(e){releaseAudio();if(live.current){setStatus('idle');setError((e as Error).name==='NotAllowedError'?'Allow microphone access in your browser to speak with the copilot.':'Could not start the microphone. Use a typed command below.');}}
 }
 useEffect(()=>{const controller=new AbortController();fetch('/api/voice-config',{signal:controller.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(setConfiguration).catch(()=>{if(!controller.signal.aborted)setConfiguration({configured:false,requires_access_code:false});});const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);return()=>{controller.abort();document.removeEventListener('visibilitychange',hidden);};},[]);
 const contextIdentity=JSON.stringify(context);
 useEffect(()=>{const timer=setTimeout(()=>dg.current?.updateContext(),150);return()=>clearTimeout(timer);},[contextIdentity]);
 async function connectDeepgram(capture:boolean){
  if(dg.current?.connected){if(capture){await dg.current.startMicrophone();setMicActive(dg.current.microphoneActive);}return dg.current;}
  if(dg.current){setError('The copilot is still connecting. Please wait.');return null;}
  if(configuration?.configured===false){setError('Deepgram is not configured on this deployment. Add DEEPGRAM_API_KEY in the server environment and redeploy, or select Browser below.');return null;}
  if(!window.isSecureContext){setError('Voice needs HTTPS or localhost.');return null;}
  setError('');ending.current=false;
  const connection=new DeepgramConnection({context:()=>ctx.current,accessCode:()=>code.current,
   tool:(name,args)=>{let result:unknown;flushSync(()=>{result=tool.current(name,args);});return result;},
   status:value=>{if(live.current)setStatus(value);},error:message=>{if(live.current)setError(message);},
   text:(role,text)=>{if(!live.current)return;const speaker=role==='user'?'you':'copilot';if(speaker==='you')setTranscript(text);setHistory(old=>old[old.length-1]?.role===speaker&&old[old.length-1]?.text===text?old:[...old,{role:speaker,text}].slice(-12));},
   ended:()=>{if(dg.current===connection)dg.current=null;if(live.current){setDgConnected(false);setMicActive(false);setLevel(0);setStatus('idle');}cancelAnimationFrame(frame.current);},
  });
  dg.current=connection;connection.setSound(soundRef.current);await connection.connect(capture);
  if(!live.current){connection.stop();return null;}if(!connection.connected)return null;
  setDgConnected(true);setMicActive(connection.microphoneActive);
  const meter=()=>{if(!live.current||dg.current!==connection)return;setLevel(connection.getVolume());frame.current=requestAnimationFrame(meter);};meter();return connection;
 }
 async function listen(){
  if(provider==='browser'){await listenBrowser();return;}
  if(dg.current?.connected&&micActive){stop();return;}
  try{await connectDeepgram(true);}catch(e){setError(e instanceof Error?e.message:'Could not start the microphone.');stop();}
 }
 async function submit(text:string){
  if(!text.trim())return;setInput('');
  if(provider==='browser'){submitBrowser(text);return;}
  try{const connection=await connectDeepgram(false);if(connection)connection.send(text);}catch(e){setError(e instanceof Error?e.message:'Could not send the command.');}
 }
 function chooseProvider(value:'deepgram'|'browser'){stop();setProvider(value);setHistory([]);setTranscript('');setError('');}
 const answer=[...history].reverse().find(item=>item.role==='copilot')?.text||response;
 return <aside className="voice-copilot glass" aria-label="Voice copilot">
  <div className="voice-header"><div className="voice-symbol"><AudioLines size={20}/></div><div><strong>Trabecular Copilot</strong><span>{status==='connecting'?'Connecting to Deepgram':status==='listening'?(provider==='deepgram'&&!micActive?'Ready for your next move':'Listening to you'):status==='speaking'?'Speaking':status==='thinking'?'Working on it':'Your next move, spoken.'}</span></div><button className="icon" aria-label="Close voice copilot" onClick={()=>{stop();onClose();}}><X size={16}/></button></div>
  <div className={`voice-orb ${status}`}><div className="orb-a"/><div className="orb-b"/><div className="orb-c"/><div className="orb-center"><AudioLines size={30} strokeWidth={1}/></div></div>
  <div className="voice-caption" aria-live="polite">{transcript?<><span>YOU</span><p>“{transcript}”</p></>:<><span>{status==='listening'?'GO AHEAD':'READY WHEN YOU ARE'}</span><p>{status==='listening'?'Tell me what you want to change.':'“Make the plate two millimeters thick.”'}</p></>}</div>
  <div className="voice-meter" aria-hidden="true">{Array.from({length:23},(_,i)=><i key={i} style={{height:(status==='listening'||status==='speaking')?`${3+Math.min(1,level*2.5)*25*(.35+Math.sin(i*1.7)**2*.65)}px`:'3px',opacity:(status==='listening'||status==='speaking')?.4+Math.min(1,level):.2}}/>)}</div>
  <div className="voice-actions"><button className={`voice-mic ${(provider==='deepgram'?micActive:status==='listening')?'active':''}`} disabled={status==='connecting'} onClick={listen} aria-label={(provider==='deepgram'?micActive:status==='listening')?'End voice session':'Start voice input'}>{(provider==='deepgram'?micActive:status==='listening')?<Square size={16} fill="currentColor"/>:<Mic size={19}/>}</button><button className="icon" onClick={()=>{setSound(!sound);dg.current?.setSound(!sound);if(sound){window.speechSynthesis?.cancel();if(status==='speaking')setStatus('idle');}}} aria-label={sound?'Mute spoken replies':'Enable spoken replies'}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>{status==='speaking'&&<button className="icon" aria-label="Stop speaking" onClick={()=>{if(provider==='deepgram')dg.current?.interrupt();else stop();}}><Square size={14}/></button>}</div>
  {error&&<p className="voice-error" role="alert">{error}</p>}
  <div className="voice-reply" aria-live="polite"><Sparkles size={13}/><p>{answer}</p></div>
  <div className="voice-prompts">{['Inspect the response','Make the plate thicker','Show the left view','Run a cohort study'].map(text=><button key={text} onClick={()=>submit(text)}>{text}<ArrowUpRight size={11}/></button>)}</div>
  {provider==='deepgram'&&configuration?.requires_access_code&&<input className="voice-access-code" type="password" autoComplete="off" aria-label="Voice access code" placeholder="Voice access code" value={accessCode} onChange={e=>setAccessCode(e.target.value)}/>}
  <form className="voice-input" onSubmit={e=>{e.preventDefault();submit(input);setInput('');}}><input aria-label="Copilot command" placeholder="Or type your next move…" value={input} onChange={e=>setInput(e.target.value)}/><button className="icon" type="submit" aria-label="Send copilot command"><Send size={15}/></button></form>
  <div className="voice-provider" role="group" aria-label="Voice provider"><button aria-pressed={provider==='deepgram'} onClick={()=>chooseProvider('deepgram')}>Deepgram{provider==='deepgram'&&dgConnected&&<i/>}</button><button aria-pressed={provider==='browser'} onClick={()=>chooseProvider('browser')}>Browser</button>{dgConnected&&<button className="voice-end" onClick={stop}>End session</button>}<button className="voice-brief" onClick={()=>{onBriefing();submit('Brief me on the current design. Inspect the workspace first.');}}><Play size={10}/>Brief me</button></div>
 </aside>;
}
