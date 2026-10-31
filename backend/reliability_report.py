"""Summarize retained reliability experiments without promoting missing gates."""
import argparse,json
from pathlib import Path

def relative_change(first,second):return abs(second-first)/max(abs(second),1e-30)

def summarize(penalty,exact,mesh):
    report={'schema':'trab-reliability-summary-v1','tolerance':.05,'anatomies':{},'physical_validation':False,
        'scope':'Numerical checks for two frozen bilateral-load reference revisions at their recorded material settings. Strength and physical validity are separate.'}
    for anatomy in ('female','male'):
        old=[r for r in penalty['runs'] if r['anatomy']==anatomy]
        pilot=[r for r in exact['runs'] if r['anatomy']==anatomy]
        refined=[r for r in mesh['runs'] if r['anatomy']==anatomy]
        row={'penalty_sensitivity':{'passed':False},'exact_discrete_check':{'passed':False},'mesh_screen':{'passed':False,'state':mesh['state']}}
        if len(old)==3 and all(r['state']=='completed' for r in old):
            same=len({r['audit']['discrete_hash_excluding_penalty'] for r in old})==1
            changes={'peak_titanium_stress_mpa':relative_change(old[-2]['result']['peak_titanium_stress_mpa'],old[-1]['result']['peak_titanium_stress_mpa']),
                'compliance_n_mm':relative_change(old[-2]['audit']['compliance_n_mm'],old[-1]['audit']['compliance_n_mm'])}
            slip=max(old[-1]['result'][key] for key in ('max_bond_slip_mm','max_locking_slip_mm'))
            row['penalty_sensitivity']={'same_discrete_model':same,'last_changes':changes,'last_attachment_slip_mm':slip,
                'passed':same and all(v<.05 for v in changes.values()) and slip<.01}
        if len(pilot)==1 and pilot[0]['state']=='completed':
            row['exact_discrete_check']={'passed':pilot[0]['audit']['passed'],
                'maximum_constraint_error_mm':pilot[0]['audit']['metrics']['exact_attachment_slip_mm'],
                'model':pilot[0]['audit']['model'],'directory':pilot[0]['directory']}
        row['mesh_screen']['levels']=[{key:r.get(key) for key in ('quality','state','error','directory')} for r in refined]
        if len(refined)==3 and all(r['state']=='completed' for r in refined):
            series={key:[r['audit'][key] if key=='compliance_n_mm' else r['result'][key] for r in refined]
                for key in ('compliance_n_mm','max_displacement_mm','peak_titanium_stress_mpa')}
            changes={key:relative_change(values[-2],values[-1]) for key,values in series.items()}
            regular={key:bool((values[1]-values[0])*(values[2]-values[1])>=0 and abs(values[2]-values[1])<=abs(values[1]-values[0])) for key,values in series.items()}
            row['mesh_screen'].update(series=series,last_changes=changes,monotone_decreasing_increments=regular,
                passed=all(r['audit']['passed'] for r in refined) and all(v<.05 for v in changes.values()) and all(regular.values()))
        row['numerical_screen_passed']=row['exact_discrete_check']['passed'] and row['mesh_screen']['passed']
        report['anatomies'][anatomy]=row
    report['numerical_screen_passed']=all(row['numerical_screen_passed'] for row in report['anatomies'].values())
    report['qualified']=False
    report['limitations']=['Three changing tetrahedral meshes and a 5% change screen do not establish a continuum uncertainty bound.',
        'Anatomical/registration review, physical interface assumptions, mesh surface-error qualification and model applicability remain open.',
        'A failing yield or linear-strain check cannot be repaired by relabeling a numerically converged answer.']
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--penalty',type=Path,required=True);parser.add_argument('--exact',type=Path,required=True)
    parser.add_argument('--mesh',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    reports=[json.loads(path.read_text()) for path in (args.penalty,args.exact,args.mesh)]
    report=summarize(*reports);report['source_reports']=[str(path.name) for path in (args.penalty,args.exact,args.mesh)]
    args.output.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
