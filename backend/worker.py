"""Isolated local analysis process. No automatic cloud invocation."""
import json
import sys
from pathlib import Path

def progress(stage,value):
    print('TRAB_EVENT '+json.dumps({'stage':stage,'progress':value}),flush=True)

def run(payload):
    from engine_fingerprint import numerical_signature
    if payload.get('numerical_signature') and payload['numerical_signature']!=numerical_signature():
        raise ValueError('Numerical code changed after this job was queued. Restart the analysis service and queue a new job.')
    action=payload['action']
    if action=='benchmark3d':
        from verification3d import qualification
        progress('Checking CPU/GPU and independent reference',.1)
        return qualification()
    if action=='benchmark_beam':
        from engine import benchmark
        return benchmark()
    from geometry import build
    assembly=build(payload['anatomy_id'],payload['params'],payload['regions'],payload.get('anatomy_snapshot'),payload.get('cad_version',3))
    if assembly.geometry_hash!=payload['geometry_hash']:
        raise ValueError('Geometry preparation changed after this revision. Save a new revision before solving.')
    if action=='solve':
        from jaw_solver import solve
        exact=payload.get('solver_version')=='jaw-exact-tet-v4'
        solve_progress=(lambda stage,value:progress(stage,value*.97)) if exact else progress
        result=solve(assembly,payload['quality'],payload['device'],solve_progress,field_destination=payload.get('fields_path'),
            include_surface_fields=payload.get('include_surface_fields',True),attachment='exact' if exact else 'penalty')
        if exact and payload.get('fields_path'):
            from verification_jaw import audit
            from studies import atomic_json
            progress('Independently checking saved forces, stresses and energy',.98)
            report=audit(payload['fields_path']);report['source_job_id']=payload['job_id']
            atomic_json(Path(payload['result_path']).parent/'independent-audit.json',report)
            if not report['passed']:
                atomic_json(Path(payload['result_path']).parent/'unverified-result.json',result)
                raise ValueError('The independent saved-field calculation check failed. Computed fields and the failed audit are retained.')
            result['independent_verification']={key:report[key] for key in ('passed','metrics','field_sha256','verifier_source_sha256','scope')}
            result['unresolved_gates']=[gate for gate in result['unresolved_gates'] if gate not in ('Exact attachment elimination verification','Independent full-jaw/bond assembly check')]
        return result
    from isolated_solver import run as isolated
    if action=='study':
        from studies import run as study
        def execute(row,candidate,index):
            return isolated(payload,candidate,{**row['input'],'anatomy_id':row['anatomy_id']},row['id'],
                lambda stage,fraction:progress(f"Scenario {index+1}/18 · {row['anatomy_id'].title()} / {row['load_case']} / {row['modulus']:g} MPa · {stage}",(index+fraction)/18),'scenarios')
        return study(payload,None,progress,execute)
    if action=='optimize':
        from remediation import run as search
        return search(payload,lambda candidate,source,identifier,callback:isolated(payload,candidate,source,identifier,callback),progress)
    raise ValueError('Unsupported worker action.')

if __name__=='__main__':
    payload=json.loads(Path(sys.argv[1]).read_text())
    try:
        result=run(payload)
        if payload.get('numerical_signature'):
            from engine_fingerprint import numerical_signature
            numerical_signature.cache_clear()
            if numerical_signature()!=payload['numerical_signature']:
                raise ValueError('Numerical source changed during the calculation. Evidence is retained; restart and replay with a stable source version.')
        Path(payload['result_path']).write_text(json.dumps(result,allow_nan=False))
        progress('Complete',1.)
    except Exception as error:
        Path(payload['result_path']).write_text(json.dumps({'error':str(error)}))
        import traceback
        traceback.print_exc()
        sys.exit(1)
