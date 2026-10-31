import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { download, Params, Result, CaseId } from './model';

export type ViewHandle={view:(name:string)=>void;screenshot:()=>void;exportSTL:()=>void};
type Props={caseId:CaseId;params:Params;mode:string;annotations:boolean;transparent:boolean;section:number|null;explode:boolean;baseline:Result|null;measure:boolean;lab?:boolean;grid?:boolean;hole?:number;imported:THREE.BufferGeometry|null;onMeasure:(value:number)=>void;onPick:(v:number[])=>void};
const materials={bone:0xd7d6c8,titanium:0xbccbd4};
const ramps=['#3f64c0','#38b1c1','#97d3a4','#e7d087','#f29756','#e65767'].map(x=>new THREE.Color(x));
function shade(t:number){const f=Math.max(0,Math.min(.999,t))*5;return ramps[Math.floor(f)].clone().lerp(ramps[Math.floor(f)+1],f%1);}
function dispose(group:THREE.Group){group.traverse(o=>{if(o instanceof THREE.Mesh || o instanceof THREE.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});group.clear();}
const Viewport=forwardRef<ViewHandle,Props>(function Viewport(props,ref){
 const host=useRef<HTMLDivElement>(null),rt=useRef<any>(null),latest=useRef(props),motion=useRef<any>(null),firstPick=useRef<THREE.Vector3|null>(null);
 latest.current=props;
 const [assets,setAssets]=useState<{parts:{name:string;geometry:THREE.BufferGeometry}[];meta:any;hardware:any}|null>(null),[error,setError]=useState('');
 const lastFit=useRef('');
 function view(name:string){const r=rt.current;if(!r)return;const directions:any={perspective:[.72,.35,1.15],front:[0,.05,1],left:[-1,.1,.1],right:[1,.1,.1],top:[0,1,.01]};const target=new THREE.Vector3(0,props.lab?0:1,0),direction=new THREE.Vector3(...(directions[name]||directions.perspective) as [number,number,number]).normalize();const radius=props.lab?29:91;const dist=radius/Math.sin(THREE.MathUtils.degToRad(r.camera.fov/2))*Math.max(1,1/r.camera.aspect);motion.current={at:performance.now(),from:r.camera.position.clone(),to:target.clone().addScaledVector(direction,dist),targetFrom:r.controls.target.clone(),target};}
 useImperativeHandle(ref,()=>({view,screenshot(){const r=rt.current;if(!r)return;r.renderer.render(r.scene,r.camera);r.renderer.domElement.toBlob((blob:Blob|null)=>{if(blob)download('trabecular-demo-view.png',blob);});},exportSTL(){const r=rt.current;if(!r)return;const data=new STLExporter().parse(r.objects,{binary:true});download('trabecular-demo-design.stl',new Blob([data],{type:'application/octet-stream'}));}}));
 useEffect(()=>{if(props.lab)return;let stopped=false;setError('');const loader=new STLLoader();const anatomy=props.caseId==='import'?'female':props.caseId;
 Promise.all([fetch(`/assets/cases/${anatomy}/anatomy.json`).then(r=>r.json()),fetch(`/assets/cases/${anatomy}/hardware.json`).then(r=>r.json()),...['distal','proximal_left','proximal_right'].map(async name=>{const input=await loader.loadAsync(`/assets/cases/${anatomy}/${name}.stl`);input.deleteAttribute('normal');const geometry=mergeVertices(input,.025);geometry.computeVertexNormals();input.dispose();return {name,geometry};})]).then(([meta,hardware,...parts])=>{if(stopped){parts.forEach(p=>(p as any).geometry.dispose());return;}setAssets({meta,hardware,parts:parts as any});}).catch(()=>setError('Could not load anatomy. Please reload the demo.'));return()=>{stopped=true;};},[props.caseId,props.lab]);
 useEffect(()=>{
  if(!host.current)return;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch{setError('3D requires WebGL. Try a browser with hardware acceleration.');return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.localClippingEnabled=true;host.current.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,3000);camera.position.set(115,65,260);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=25;controls.maxDistance=700;controls.target.set(0,1,0);
  const pmrem=new THREE.PMREMGenerator(renderer);const environment=new RoomEnvironment();const environmentMap=pmrem.fromScene(environment,.04).texture;scene.environment=environmentMap;environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf1eee7,0x333b39,1.6));for(const [color,intensity,position] of [[0xf2eee2,2.8,[80,130,140]],[0xdbe5eb,1.2,[-120,50,30]],[0xe9efe3,.9,[10,50,-100]]] as const){const light=new THREE.DirectionalLight(color,intensity);light.position.set(position[0],position[1],position[2]);scene.add(light);}
  const objects=new THREE.Group(),decor=new THREE.Group();scene.add(objects,decor);
  const plane=new THREE.Plane(new THREE.Vector3(1,0,0),0);
  rt.current={scene,camera,controls,renderer,objects,decor,plane};
  const resize=()=>{if(!host.current)return;const {width,height}=host.current.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host.current);resize();
  let dragging=false,downX=0,downY=0;
  const down=(e:PointerEvent)=>{motion.current=null;dragging=false;downX=e.clientX;downY=e.clientY;};
  const up=(e:PointerEvent)=>{dragging=Math.hypot(e.clientX-downX,e.clientY-downY)>5;if(dragging)return;const p=latest.current;if(!p.measure&&!p.annotations)return;const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=ray.intersectObjects(objects.children,true);if(!hits.length)return;const point=hits[0].point;if(p.measure){if(firstPick.current){p.onMeasure(firstPick.current.distanceTo(point));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([firstPick.current,point]),new THREE.LineBasicMaterial({color:0xe1ffb4,depthTest:false}));decor.add(line);firstPick.current=null;}else{firstPick.current=point.clone();p.onMeasure(-1);}}else p.onPick(point.toArray());};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  let frame=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate=()=>{const m=motion.current;if(m){const t=reduced?1:Math.min(1,(performance.now()-m.at)/750),k=1-(1-t)**3;camera.position.lerpVectors(m.from,m.to,k);controls.target.lerpVectors(m.targetFrom,m.target,k);if(t===1)motion.current=null;}controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(animate);};animate();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();dispose(objects);dispose(decor);environmentMap.dispose();renderer.dispose();renderer.domElement.remove();rt.current=null;};
 },[]);
 useEffect(()=>{const r=rt.current;if(!r)return;dispose(r.objects);dispose(r.decor);const p=props.params;
  const add=(geometry:THREE.BufferGeometry,isBone:boolean,name:string,opacity=1)=>{
   const positions=geometry.getAttribute('position');
   if(props.mode==='stress'||props.mode==='displacement'){
    const colors=new Float32Array(positions.count*3),array=positions.array as Float32Array;
    for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);const localized=Math.exp(-((Math.abs(x)-35)**2/250+(y+18)**2/700+(z-4)**2/900));const v=(isBone?.11:.42)+localized*(isBone?.7:.48);const color=shade(v);colors.set(color.toArray(),i*3);if(props.mode==='displacement'){array[i*3]+=x/65*.25;array[i*3+1]-=Math.max(0,(28-y)/80)*2;}}
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
   }
   const mat=new THREE.MeshStandardMaterial({color:props.mode==='stress'||props.mode==='displacement'?0xffffff:isBone?materials.bone:materials.titanium,roughness:props.mode!=='material'?.72:isBone?.8:.42,metalness:props.mode!=='material'?0:isBone?0:.78,envMapIntensity:isBone?.25:.8,vertexColors:props.mode==='stress'||props.mode==='displacement',transparent:opacity<1,opacity,side:THREE.DoubleSide,clippingPlanes:props.section!==null?[r.plane]:[]});
   const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;r.objects.add(mesh);return mesh;
  };
  if(props.lab){
   const width=p.width*2,rad=props.hole??1.2,shape=new THREE.Shape();shape.moveTo(-20,-width/2);shape.lineTo(20,-width/2);shape.lineTo(20,width/2);shape.lineTo(-20,width/2);shape.closePath();
   if(rad>0)for(const x of [-15,-5,5,15]){const hole=new THREE.Path();hole.absarc(x,0,rad,0,Math.PI*2,true);shape.holes.push(hole);}
   const geo=new THREE.ExtrudeGeometry(shape,{depth:p.thickness,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.08,bevelThickness:.08,curveSegments:28});geo.translate(0,0,-p.thickness/2);add(geo,false,'implicit-specimen',props.mode==='sdf'?.24:1);
   if(props.mode==='sdf'){
    const plane=new THREE.PlaneGeometry(50,24,1,1);const mat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{width:{value:width},radius:{value:rad}},vertexShader:'varying vec2 xy;void main(){xy=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 xy;uniform float width;uniform float radius;void main(){vec2 q=abs(xy)-vec2(20.,width/2.);float d=length(max(q,0.))+min(max(q.x,q.y),0.);if(radius>0.)for(int i=0;i<4;i++){float h=length(xy-vec2(-15.+float(i)*10.,0.))-radius;d=max(d,-h);}vec3 c=d<0.?vec3(.60,.86,.35):vec3(.12,.48,.47);float contour=1.-smoothstep(.04,.1,abs(fract(abs(d)*.55)-.5));float edge=1.-smoothstep(.02,.1,abs(d));gl_FragColor=vec4(mix(c,vec3(.85,1.,.68),edge*.8),.23+contour*.22+edge*.35);}' });const slice=new THREE.Mesh(plane,mat);slice.position.z=-p.thickness/2-.25;r.decor.add(slice);
   }
   if(props.grid){const grid=new THREE.GridHelper(48,24,0x9fd177,0x48634f);grid.rotation.x=Math.PI/2;grid.position.z=-p.thickness/2-.4;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.35;r.decor.add(grid);}
  }else if(props.caseId==='import'&&props.imported){add(props.imported.clone(),true,'imported',props.transparent?.3:1);}
  else if(assets){
   for(const part of assets.parts){const geo=part.geometry.clone();if(part.name==='distal')geo.translate(0,0,p.advancement);if(props.explode)geo.translate(part.name==='proximal_left'?-12:part.name==='proximal_right'?12:0,part.name==='distal'?-6:4,part.name==='distal'?14:0);add(geo,true,part.name,props.transparent?.25:1);}
   // Actual v5 contoured fixation CAD, exported from the engineering project.
   // Lightweight display morphs illustrate parameter changes; they are not analysis-ready CAD.
   for(const packet of assets.hardware.meshes){
    const side=packet.id.includes('left')?'left':'right',sign=side==='left'?-1:1;
    const screws=assets.hardware.screws.filter((item:any)=>item.id.includes(side));
    const centers=screws.map((item:any)=>{const normal=new THREE.Vector3().fromArray(item.start).sub(new THREE.Vector3().fromArray(item.end)).normalize();return new THREE.Vector3().fromArray(item.start).addScaledVector(normal,-1.05);});
    const positions=new Float32Array(packet.positions);
    for(let i=0;i<positions.length;i+=3){
     let point=new THREE.Vector3(positions[i],positions[i+1],positions[i+2]),weight=0;
     if(packet.id.startsWith('plate')){
      let nearest=Infinity,center=centers[0],tangent=new THREE.Vector3(),normal=new THREE.Vector3();
      for(let j=0;j<centers.length-1;j++){
       const delta=centers[j+1].clone().sub(centers[j]),t=THREE.MathUtils.clamp(point.clone().sub(centers[j]).dot(delta)/delta.lengthSq(),0,1),candidate=centers[j].clone().addScaledVector(delta,t),distance=candidate.distanceToSquared(point);
       if(distance<nearest){nearest=distance;center=candidate;tangent=delta.normalize();weight=THREE.MathUtils.smoothstep(j+t,.8,2.2);const a=new THREE.Vector3().fromArray(screws[j].start).sub(new THREE.Vector3().fromArray(screws[j].end)).normalize(),b=new THREE.Vector3().fromArray(screws[j+1].start).sub(new THREE.Vector3().fromArray(screws[j+1].end)).normalize();normal=a.lerp(b,t).normalize();}
      }
      const cross=tangent.clone().cross(normal).normalize(),offset=point.clone().sub(center);
      point.addScaledVector(cross,offset.dot(cross)*(p.width/3-1)).addScaledVector(normal,offset.dot(normal)*(p.thickness/1.5-1));
     }else{
      const item=screws.find((item:any)=>item.id===packet.id);if(item){const base=new THREE.Vector3().fromArray(item.start),out=base.clone().sub(new THREE.Vector3().fromArray(item.end)).normalize(),offset=point.clone().sub(base),depth=-offset.dot(out);if(depth>.8)point.addScaledVector(out,-(depth-.8)*(p.screwLength/8-1));const axis=new THREE.Vector3(0,1,0).cross(out).normalize();point.sub(base).applyAxisAngle(axis,p.angle*Math.PI/180).add(base).addScaledVector(out,p.thickness-1.5);weight=Number(packet.id.split('_').pop())>2?1:0;}
     }
     point.z+=(p.advancement-6)*weight;
     if(props.explode){point.x+=sign*12*(1-weight);point.y+=4*(1-weight)-6*weight;point.z+=14*weight;}
     positions[i]=point.x;positions[i+1]=point.y;positions[i+2]=point.z;
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setIndex(packet.indices);geo.computeVertexNormals();add(geo,false,packet.id);
   }
   if(props.annotations)for(const region of assets.meta.regions){if(region.kind==='load'&&p.loadCase!=='bilateral'&&!region.id.includes(p.loadCase))continue;const color=region.kind==='support'?0x87bdd4:region.kind==='load'?0xccf39b:0xf5b57c;const marker=new THREE.Mesh(new THREE.SphereGeometry(region.kind==='keep_out'?p.clearance:region.radius*.55,18,12),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.28,depthWrite:false}));marker.position.fromArray(region.center);r.decor.add(marker);if(region.kind==='load'){const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),marker.position.clone().add(new THREE.Vector3(0,22,0)),18*Math.pow(p.load/520,.4),color,4,2);r.decor.add(arrow);}}
   if(props.baseline){for(const part of assets.parts){if(part.name!=='distal')continue;const geo=part.geometry.clone();geo.translate(0,0,props.baseline.params.advancement);const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xb9ed99,wireframe:true,transparent:true,opacity:.055,depthWrite:false}));r.decor.add(mesh);}}
  }
  const key=`${props.caseId}-${props.lab}`;if(lastFit.current!==key){lastFit.current=key;view('perspective');}
 },[assets,props.caseId,props.params,props.mode,props.annotations,props.transparent,props.section,props.explode,props.baseline,props.lab,props.grid,props.hole,props.imported]);
 useEffect(()=>{const r=rt.current;if(r&&props.section!==null)r.plane.constant=-props.section;},[props.section]);
 return <div className="demo-view" ref={host} aria-label={props.lab?'Interactive SDF plate specimen':'Interactive CT-derived mandible and fixation design'}>{error&&<div className="viewport-message">{error}</div>}{!assets&&!props.lab&&props.caseId!=='import'&&<div className="viewport-message">Loading reference anatomy…</div>}</div>;
});
export default Viewport;
