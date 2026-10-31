"""Traceable cross-anatomy studies with atomic, recoverable scenario evidence."""
import csv
from io import StringIO
import json
from pathlib import Path
from uuid import uuid5,NAMESPACE_URL,uuid4

SCOPE='Two registered reference anatomies, eighteen loading/material scenarios; not a population validation study.'

def atomic_json(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix(f'.{uuid4().hex}.tmp')
    temporary.write_text(json.dumps(value,allow_nan=False),encoding='utf-8');temporary.replace(path)

def summarize(scenarios):
    completed=[s for s in scenarios if s['state']=='completed']
    resolved=[s for s in completed if s['result'].get('numerically_resolved')]
    qualified=[s for s in completed if s['result'].get('qualified')]
    governing={}
    for key in ('peak_titanium_stress_mpa','max_displacement_mm','max_abs_bone_principal_strain','max_bond_slip_mm'):
        values=[s for s in completed if isinstance(s['result'].get(key),(int,float))]
        if values:
            row=max(values,key=lambda s:s['result'][key]);governing[key]={'scenario_id':row['id'],'value':row['result'][key]}
    return {'completed':len(completed),'failed':sum(s['state']=='failed' for s in scenarios),
        'resolved':len(resolved),'qualified':len(qualified),'governing':governing}

def run(payload,solve,progress,execute_scenario=None):
    from geometry import build
    references=payload.get('study_references')
    if not references or set(references)!= {'male','female'}:
        raise ValueError('A study requires reviewed, saved revisions for both reference anatomies.')
    namespace=uuid5(NAMESPACE_URL,str(payload['job_id']))
    scenarios=[]
    for anatomy,reference in references.items():
        for loading in ('bilateral','left','right'):
            for modulus in (500.,1200.,1800.):
                scenarios.append({'id':str(uuid5(namespace,f'{anatomy}/{loading}/{modulus}')),
                    'anatomy_id':anatomy,'case_id':reference['case_id'],'revision_id':reference['revision_id'],
                    'load_case':loading,'modulus':modulus,'state':'pending',
                    'input':{**reference,'params':{**reference['params'],'modulus':modulus,'load_case':loading},
                        'quality':payload['quality'],'device':payload['device'],'numerical_signature':payload['numerical_signature']}})
    def checkpoint(state='partial'):
        report={'schema':'trab-study-v2','scenarios':scenarios,'total':18,'distinct_anatomies':2,
            'state':state,'scope':SCOPE,**summarize(scenarios)}
        atomic_json(payload['partial_path'],report)
        return report
    checkpoint()
    for index,row in enumerate(scenarios):
        progress(f"Scenario {index+1}/18 · {row['anatomy_id'].title()} / {row['load_case']} / {row['modulus']:g} MPa",index/18)
        row['state']='running';checkpoint()
        source=row['input']
        try:
            assembly=build(row['anatomy_id'],source['params'],source['regions'],source['anatomy_snapshot'],source['cad_version'])
            row['geometry_hash']=assembly.geometry_hash
            result=execute_scenario(row,assembly,index) if execute_scenario else solve(assembly,source['quality'],source['device'],include_surface_fields=False)
            result.pop('fields',None)
            row.update(state='completed',result=result)
        except Exception as error:row.update(state='failed',error=str(error))
        atomic_json(Path(payload['partial_path']).parent/'scenarios'/f"{row['id']}.json",row)
        checkpoint()
    return checkpoint('completed')

def scenario_csv(report):
    columns=['scenario_id','case_id','revision_id','anatomy','load_case','core_modulus_mpa','state','numerically_resolved','qualified',
        'peak_titanium_stress_mpa','safety_factor','max_displacement_mm','max_abs_bone_principal_strain','max_bond_slip_mm','relative_residual','error']
    output=StringIO(newline='');writer=csv.writer(output);writer.writerow(columns)
    for row in report['scenarios']:
        result=row.get('result',{});diagnostics=result.get('numerical',{})
        writer.writerow([row.get('id',''),row.get('case_id',''),row.get('revision_id',''),row['anatomy_id'],row['load_case'],row['modulus'],row['state'],
            result.get('numerically_resolved',''),result.get('qualified',''),result.get('peak_titanium_stress_mpa',''),result.get('safety_factor',''),
            result.get('max_displacement_mm',''),result.get('max_abs_bone_principal_strain',''),result.get('max_bond_slip_mm',''),
            diagnostics.get('relative_residual',result.get('relative_residual','')),row.get('error','')])
    return output.getvalue()
