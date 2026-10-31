"""Expose an owned verification process so normal jobs cannot compete for VRAM."""
import ctypes,json,os,time
from contextlib import contextmanager
from pathlib import Path

def process_exists(pid):
    if pid<=0:return False
    if os.name=='nt':
        kernel=ctypes.windll.kernel32
        kernel.OpenProcess.restype=ctypes.c_void_p
        handle=kernel.OpenProcess(0x1000,False,pid)
        if not handle:return False
        try:
            code=ctypes.c_ulong()
            return bool(kernel.GetExitCodeProcess(ctypes.c_void_p(handle),ctypes.byref(code)) and code.value==259)
        finally:kernel.CloseHandle(ctypes.c_void_p(handle))
    try:os.kill(pid,0);return True
    except OSError:return False

def active(data):
    try:
        record=json.loads((Path(data)/'.verification-lease.json').read_text())
        return bool(time.time()-float(record['started_at'])<7200 and process_exists(int(record['pid'])))
    except (OSError,ValueError,TypeError,KeyError):return False

@contextmanager
def lease(data):
    data=Path(data);data.mkdir(parents=True,exist_ok=True)
    path=data/'.verification-lease.json'
    if active(data):raise RuntimeError('Another local verification study is already running.')
    path.write_text(json.dumps({'pid':os.getpid(),'started_at':time.time()}))
    try:yield
    finally:
        try:
            if json.loads(path.read_text()).get('pid')==os.getpid():path.unlink(missing_ok=True)
        except (OSError,ValueError):pass
