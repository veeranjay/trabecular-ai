"""Sequential, checkpointed reliability experiments. No service/cloud calls."""
import argparse,ctypes,json,os,subprocess,sys,time
from datetime import datetime,timezone
from pathlib import Path
from process_control import stop_process_tree

ROOT=Path(__file__).resolve().parent
JOBS={'female':'664bc539-b0b1-4075-93a7-ce6850f2e110','male':'74b1a7ec-d15c-441f-8ecc-f860aa545d28'}

def available_memory():
    if os.name=='nt':
        class MemoryStatus(ctypes.Structure):
            _fields_=[('length',ctypes.c_ulong),('load',ctypes.c_ulong)]+[(key,ctypes.c_ulonglong) for key in ('total_physical','available_physical','total_page','available_page','total_virtual','available_virtual','extended')]
        record=MemoryStatus();record.length=ctypes.sizeof(record)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(record)):return record.available_physical
    return None

def execute(source,directory,quality,scale,timeout,attachment):
    directory.mkdir(parents=True,exist_ok=True)
    command=[sys.executable,str(ROOT/'verification_case.py'),str(source),str(directory),'--quality',quality,'--bond-scale',str(scale),'--attachment',attachment]
    started=time.monotonic();reason=None;minimum_available=None
    with (directory/'worker.log').open('w',encoding='utf-8') as log:
        process=subprocess.Popen(command,stdout=log,stderr=subprocess.STDOUT,start_new_session=os.name!='nt',
            creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
        try:
            while process.poll() is None:
                free=available_memory()
                if free is not None:minimum_available=free if minimum_available is None else min(minimum_available,free)
                if time.monotonic()-started>timeout:reason=f'Verification exceeded {timeout:g} seconds.'
                if free is not None and free<750*1024**2:reason='Stopped to preserve 750 MiB of available system memory.'
                if reason:stop_process_tree(process);break
                time.sleep(2)
        finally:
            if process.poll() is None:stop_process_tree(process)
    result_path=directory/'result.json';error_path=directory/'error.json'
    if error_path.exists():reason=json.loads(error_path.read_text())['error']
    if process.returncode and not reason:reason=f'Worker exited with code {process.returncode}; inspect retained log.'
    audit_path=directory/'independent-audit.json'
    return {'state':'failed' if reason or not result_path.exists() or not audit_path.exists() else 'completed','error':reason,'quality':quality,'attachment_formulation':attachment,
        'bond_penalty_scale':scale,'directory':str(directory.relative_to(ROOT.parent)),
        'elapsed_seconds':time.monotonic()-started,'minimum_system_memory_available_bytes':minimum_available}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--anatomy',choices=('male','female','both'),default='both')
    parser.add_argument('--mode',choices=('penalty','mesh'),required=True);parser.add_argument('--timeout',type=float,default=600)
    parser.add_argument('--scales',nargs='+',type=float,default=[30.,100.,300.])
    parser.add_argument('--qualities',nargs='+',choices=('preview','standard','refined'),default=['preview','standard','refined'])
    parser.add_argument('--attachment',choices=('penalty','exact'),default='penalty');args=parser.parse_args()
    stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    root=ROOT/'data'/'reliability'/f'{stamp}-{args.mode}-{args.attachment}';root.mkdir(parents=True)
    report={'schema':'trab-reliability-study-v1','mode':args.mode,'attachment_formulation':args.attachment,'created_at_utc':stamp,'scope':'Local engineering numerical verification; unchanged saved case inputs. No physical qualification claim.',
        'source_jobs':JOBS,'runs':[],'state':'running'}
    output=ROOT.parent/'docs'/'verification'/f'{stamp}-{args.mode}-{args.attachment}-study.json'
    def save():output.write_text(json.dumps(report,indent=2))
    save()
    for anatomy in (('female','male') if args.anatomy=='both' else (args.anatomy,)):
        source=ROOT/'data'/'artifacts'/JOBS[anatomy]/'input.json'
        choices=[('preview',scale) for scale in args.scales] if args.mode=='penalty' else [(quality,100.) for quality in args.qualities]
        for quality,scale in choices:
            directory=root/f'{anatomy}-{quality}-{scale:g}'
            print(f'START {anatomy} {quality} penalty={scale:g}',flush=True)
            row={'anatomy':anatomy,**execute(source,directory,quality,scale,args.timeout,args.attachment)}
            if row['state']=='completed':
                result=json.loads((directory/'result.json').read_text());audit=json.loads((directory/'independent-audit.json').read_text())
                row['result']={key:result[key] for key in ('geometry_hash','nodes','tetrahedra','dofs','peak_titanium_stress_mpa','max_displacement_mm',
                    'max_bond_slip_mm','max_locking_slip_mm','relative_residual','force_balance_error','moment_balance_error','solve_seconds','qualified','numerically_resolved','mesh')}
                row['audit']=audit
            report['runs'].append(row);save();print(f"END {anatomy} {quality} penalty={scale:g}: {row['state']} {row.get('error') or ''}",flush=True)
            # A larger mesh is not attempted after an observed memory/meshing failure.
            if args.mode=='mesh' and row['state']!='completed':break
    report['state']='completed';save();print(str(output),flush=True)

if __name__=='__main__':
    from verification_lease import lease
    from storage import Repository
    if any(job['state'] in ('queued','running') for job in Repository().list('local','job',limit=1000)):
        raise SystemExit('Finish or cancel active app jobs before verification.')
    with lease(ROOT/'data'):main()
