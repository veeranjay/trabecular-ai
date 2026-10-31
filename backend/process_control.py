"""Stop only a subprocess tree owned by this application, including GPU workers."""
import os,signal,subprocess,ctypes,threading

def available_memory_bytes():
    if os.name=='nt':
        class MemoryStatus(ctypes.Structure):
            _fields_=[('length',ctypes.c_ulong),('load',ctypes.c_ulong)]+[(key,ctypes.c_ulonglong) for key in ('total_physical','available_physical','total_page','available_page','total_virtual','available_virtual','extended')]
        record=MemoryStatus();record.length=ctypes.sizeof(record)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(record)):return record.available_physical
    else:
        try:
            from pathlib import Path
            for line in Path('/proc/meminfo').read_text().splitlines():
                if line.startswith('MemAvailable:'):return int(line.split()[1])*1024
        except (OSError,ValueError):pass
    return None

class MemoryGuard:
    def __init__(self,process,minimum=750*1024**2,interval=2.):
        self.exhausted=threading.Event();self.done=threading.Event()
        def watch():
            while not self.done.wait(interval):
                if process.poll() is not None:return
                free=available_memory_bytes()
                if free is not None and free<minimum:
                    self.exhausted.set();stop_process_tree(process);return
        self.thread=threading.Thread(target=watch,daemon=True);self.thread.start()
    def close(self):self.done.set();self.thread.join(timeout=12)

def stop_process_tree(process):
    if process.poll() is not None:return
    if os.name=='nt':
        result=subprocess.run(['taskkill','/PID',str(process.pid),'/T','/F'],capture_output=True,
            timeout=10,creationflags=subprocess.CREATE_NO_WINDOW)
        if result.returncode and process.poll() is None:raise RuntimeError('Could not stop the analysis process tree.')
    else:
        try:os.killpg(process.pid,signal.SIGTERM)
        except ProcessLookupError:pass
