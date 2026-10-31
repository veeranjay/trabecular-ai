"""One bounded, cancellable child process per study/search calculation."""
import json,os,subprocess,sys,threading
from pathlib import Path
from process_control import stop_process_tree

def run(parent,assembly,source,identifier,progress,folder='calculations'):
    directory=Path(parent['partial_path']).parent/folder/identifier;directory.mkdir(parents=True,exist_ok=True)
    child_input={**source,'action':'solve','geometry_hash':assembly.geometry_hash,'job_id':identifier,
        'numerical_signature':parent['numerical_signature'],'device':parent['device'],'include_surface_fields':False,
        'solver_version':parent.get('solver_version','jaw-locking-tet-v3'),
        'result_path':str(directory/'result.json'),'fields_path':str(directory/'fields.npz')}
    input_path=directory/'input.json';input_path.write_text(json.dumps(child_input,allow_nan=False))
    process=subprocess.Popen([sys.executable,str(Path(__file__).resolve().parent/'worker.py'),str(input_path)],
        stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace',
        start_new_session=os.name!='nt',creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
    expired=threading.Event()
    def terminate():
        if process.poll() is None:expired.set();stop_process_tree(process)
    timer=threading.Timer(360,terminate);timer.daemon=True;timer.start()
    try:
        with (directory/'worker.log').open('w',encoding='utf-8') as log:
            for line in process.stdout:
                log.write(line);log.flush()
                if line.startswith('TRAB_EVENT '):
                    event=json.loads(line[11:]);progress(event['stage'],event['progress'])
        code=process.wait()
        if expired.is_set():raise RuntimeError('Calculation exceeded its 360 second local limit. Inputs and logs are retained.')
        result_path=directory/'result.json'
        if not result_path.exists():raise RuntimeError('Calculation worker exited without a result. Inputs and logs are retained.')
        result=json.loads(result_path.read_text())
        if code or result.get('error'):raise RuntimeError(result.get('error','Calculation worker failed.'))
        return result
    finally:
        timer.cancel()
        if process.poll() is None:stop_process_tree(process)
