"""Retain an allowlisted numerical source snapshot without any environment files."""
import hashlib,json,zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent
EXTRA=('verification3d.py','verification_tet.py','verification_plate.py','engine.py')
def create(directory,signature):
    sources={name:(ROOT/name).read_bytes() for name in set(signature['sources'])|set(EXTRA)}
    for name,expected in signature['sources'].items():
        if hashlib.sha256(sources[name]).hexdigest()!=expected:
            raise ValueError('Numerical source changed. Restart the analysis service before queuing this job.')
    path=Path(directory)/'numerical-source.zip'
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as archive:
        for name,content in sources.items():archive.writestr('backend/'+name,content)
        archive.writestr('numerical-signature.json',json.dumps(signature,indent=2))
        archive.write(ROOT/'requirements.txt','backend/requirements.txt')
    return path
