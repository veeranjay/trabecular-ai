export type Params = { thickness:number; width:number; advancement:number; screwLength:number; angle:number; load:number; modulus:number; clearance:number; loadCase:'bilateral'|'left'|'right' };
export type CaseId = 'female'|'male'|'import';
export type Result = { id:string; caseId:CaseId; params:Params; stress:number; displacement:number; mass:number; margin:number; clearance:number; created:string; source:'illustrative-demo'; label:string };
export const defaults: Params = { thickness:1.5, width:3, advancement:6, screwLength:8, angle:0, load:520, modulus:1200, clearance:4, loadCase:'bilateral' };
export const caseNames = { female:'Atlas 01', male:'Atlas 02', import:'Imported model' };
// Deliberately transparent presentation proxy. These are not FEM or patient predictions.
export function evaluate(params:Params, caseId:CaseId='female', label='Design exploration'):Result {
  const side = params.loadCase === 'bilateral' ? 1 : 1.24;
  const anatomy = caseId === 'male' ? 1.12 : 1;
  const stress = 284 * (params.load / 520) * (1.5 / params.thickness) ** 2 * (3 / params.width) ** .6 * (1 + (params.advancement - 6) * .035) * side * anatomy;
  const displacement = .42 * (params.load / 520) * (1.5 / params.thickness) ** 3 * (3 / params.width) ** .7 * (1200 / params.modulus) ** .25 * anatomy * side;
  return { id:crypto.randomUUID(),caseId,params:{...params},stress,displacement,mass:2.8*(params.thickness/1.5)*(params.width/3),margin:795/stress,clearance:6.1-Math.abs(params.angle)*.055-(params.screwLength-8)*.2,created:new Date().toISOString(),source:'illustrative-demo',label };
}
export const signature = (p:Params) => JSON.stringify(p);
export function search(params:Params, caseId:CaseId) {
  return [1.2,1.5,1.8,2.1].flatMap(thickness => [2.5,3,3.5,4].map(width => evaluate({...params,thickness,width},caseId,'Search candidate'))).sort((a,b)=>a.mass-b.mass);
}
export function cohort(params:Params) {
  return (['female','male'] as const).flatMap(caseId => (['bilateral','left','right'] as const).flatMap(loadCase => [750,1200,1800].map(modulus=>evaluate({...params,loadCase,modulus},caseId,`${caseNames[caseId]} / ${loadCase} / ${modulus} MPa`))));
}
export function download(name:string, content:string|Blob, type='application/json') {
  const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
export function csv(rows:Result[]) {
  return 'source,case,load_case,modulus_MPa,thickness_mm,width_mm,stress_MPa,displacement_mm,mass_g,margin\n'+rows.map(r=>[r.source,r.caseId,r.params.loadCase,r.params.modulus,r.params.thickness,r.params.width,r.stress.toFixed(2),r.displacement.toFixed(4),r.mass.toFixed(3),r.margin.toFixed(2)].join(',')).join('\n');
}
export function report(result:Result, revisions:Result[]) {
  const body=`<!doctype html><html><head><title>Trabecular — Demonstration report</title><style>body{font:15px system-ui;max-width:900px;margin:60px auto;color:#172318}h1{font-size:36px}table{border-collapse:collapse;width:100%;margin:30px 0}td,th{padding:13px;border-bottom:1px solid #ddd;text-align:left}small{color:#555}@media print{button{display:none}}</style></head><body><small>TRABECULAR / PRESENTATION DEMO</small><h1>Design exploration report</h1><p>Case ${caseNames[result.caseId]} · ${new Date(result.created).toLocaleString()}</p><p><b>Illustrative simulation, not validated FEM or clinical guidance.</b> Real CT-derived geometry is shown in the app. This report uses an explicit presentation proxy; simulated values do not qualify any design.</p><table><tr><th>Parameter / metric</th><th>Value</th></tr>${Object.entries(result.params).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')}<tr><td>Illustrative stress</td><td>${result.stress.toFixed(1)} MPa</td></tr><tr><td>Illustrative displacement</td><td>${result.displacement.toFixed(3)} mm</td></tr><tr><td>Illustrative margin</td><td>${result.margin.toFixed(2)}×</td></tr></table><h2>Revision history</h2><p>${revisions.length} saved demo revisions. Source: illustrative-demo.</p><h2>Evidence and next stage</h2><p>Planned primary engine: SDF-cut immersed finite elements. Retained engineering tetrahedral solver: separate reference/checker, unqualified. Grid/integration convergence, independent comparison and physical applicability remain open.</p><p>Anatomy: Visible Human / BoneHub, S. H. Alavi & M. Asseln (2026), CC BY 4.0. https://huggingface.co/datasets/BoneHub/visible-human-3d-models</p><button onclick="window.print()">Print / save PDF</button></body></html>`;
  download('trabecular-demo-report.html',body,'text/html');
}
const storagePrefix = new URLSearchParams(location.search).has('qa') ? 'trab-demo-qa-v1:' : 'trab-demo-v1:';
export function restore<T>(key:string,fallback:T):T { try {const v=localStorage.getItem(storagePrefix+key);return v?JSON.parse(v):fallback;}catch{return fallback;} }
export function persist(key:string,value:unknown) { try {localStorage.setItem(storagePrefix+key,JSON.stringify(value));} catch {/* Private browsing can disable persistence. */} }
