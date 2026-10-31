"""Immutable copies of prepared reference assets, keyed by their exact content."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import threading
from uuid import uuid4
from prepare_cases import PUBLIC
from storage import DATA

PREPARED=DATA/'prepared'
NAMES=('proximal_left','proximal_right','distal')
_lock=threading.RLock()

def freeze_reference(identifier):
    if identifier not in ('male','female'):raise ValueError('Unknown prepared reference.')
    with _lock:
        folder=PUBLIC/identifier
        meta=json.loads((folder/'anatomy.json').read_text())
        hashes={name:hashlib.sha256((folder/f'{name}.stl').read_bytes()).hexdigest() for name in NAMES}
        identity=hashlib.sha256(json.dumps({'metadata':meta,'files':hashes},sort_keys=True).encode()).hexdigest()
        destination=PREPARED/identity
        if not (destination/'snapshot.json').exists():
            destination.mkdir(parents=True,exist_ok=True)
            for name in NAMES:
                temporary=destination/f'{name}.{uuid4().hex}.tmp'
                shutil.copyfile(folder/f'{name}.stl',temporary)
                temporary.replace(destination/f'{name}.stl')
            temporary=destination/f'snapshot.{uuid4().hex}.tmp'
            temporary.write_text(json.dumps({'id':identity,'anatomy_id':identifier,'metadata':meta,'files':hashes}))
            temporary.replace(destination/'snapshot.json')
        return identity

def read_snapshot(identity):
    if not re.fullmatch('[a-f0-9]{64}',identity):raise ValueError('Invalid prepared asset version.')
    folder=PREPARED/identity
    record=json.loads((folder/'snapshot.json').read_text())
    for name,expected in record['files'].items():
        if name not in NAMES or hashlib.sha256((folder/f'{name}.stl').read_bytes()).hexdigest()!=expected:
            raise ValueError('A versioned anatomy asset changed. Restore its checked source before analysis.')
    return record,folder
