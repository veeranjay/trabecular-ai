"""Transactional local development storage. Hosted deployments use Supabase.

Local storage is explicitly named in capability reports; it is not an automatic
fallback for a failed cloud connection. Records are scoped by workspace.
"""
from __future__ import annotations
import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime,timezone
from pathlib import Path

DATA=Path(__file__).resolve().parent/'data'
def timestamp():return datetime.now(timezone.utc).isoformat()
def uid():return str(uuid.uuid4())

class Repository:
    def __init__(self,path=None):
        self.path=Path(path) if path else DATA/'workspace.sqlite3'
        self.path.parent.mkdir(parents=True,exist_ok=True)
        with self.connection() as db:
            db.executescript('''
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS objects (
              workspace TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,
              case_id TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,body TEXT NOT NULL,
              PRIMARY KEY(workspace,kind,id));
            CREATE INDEX IF NOT EXISTS objects_case ON objects(workspace,kind,case_id,created_at);
            CREATE TABLE IF NOT EXISTS events (
              seq INTEGER PRIMARY KEY AUTOINCREMENT,workspace TEXT NOT NULL,
              created_at TEXT NOT NULL,body TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS events_workspace ON events(workspace,seq);
            ''')
    @contextmanager
    def connection(self):
        db=sqlite3.connect(self.path,timeout=20)
        db.row_factory=sqlite3.Row
        try:
            with db:yield db
        finally:db.close()
    def put(self,workspace,kind,body,*,case_id=None):
        body={**body}
        now=timestamp();body.setdefault('id',uid());body.setdefault('created_at',now);body['updated_at']=now
        with self.connection() as db:
            db.execute('INSERT INTO objects VALUES(?,?,?,?,?,?,?) ON CONFLICT(workspace,kind,id) DO UPDATE SET updated_at=excluded.updated_at,body=excluded.body',
                (workspace,kind,body['id'],case_id,body['created_at'],now,json.dumps(body,allow_nan=False)))
        return body
    def get(self,workspace,kind,identifier):
        with self.connection() as db:
            row=db.execute('SELECT body FROM objects WHERE workspace=? AND kind=? AND id=?',(workspace,kind,identifier)).fetchone()
        if row is None:raise KeyError(f'{kind} not found in this workspace.')
        return json.loads(row['body'])
    def list(self,workspace,kind,case_id=None,limit=100):
        query='SELECT body FROM objects WHERE workspace=? AND kind=?'
        args=[workspace,kind]
        if case_id is not None:query+=' AND case_id=?';args.append(case_id)
        query+=' ORDER BY created_at DESC LIMIT ?';args.append(min(max(limit,1),1000))
        with self.connection() as db:rows=db.execute(query,args).fetchall()
        return [json.loads(r['body']) for r in rows]
    def event(self,workspace,event):
        now=timestamp()
        with self.connection() as db:
            cur=db.execute('INSERT INTO events(workspace,created_at,body) VALUES(?,?,?)',(workspace,now,json.dumps(event,allow_nan=False)))
        return {'seq':cur.lastrowid,'created_at':now,**event}
    def events(self,workspace,after=0):
        with self.connection() as db:rows=db.execute('SELECT seq,created_at,body FROM events WHERE workspace=? AND seq>? ORDER BY seq LIMIT 200',(workspace,after)).fetchall()
        return [{'seq':r['seq'],'created_at':r['created_at'],**json.loads(r['body'])} for r in rows]
    def recover(self):
        with self.connection() as db:rows=db.execute("SELECT workspace,body FROM objects WHERE kind='job'").fetchall()
        for row in rows:
            job=json.loads(row['body'])
            if job['state'] in ('queued','running','cancelling'):
                job.update(state='failed',error='The analysis service restarted. Inputs are preserved; retry this job.',stage='Interrupted')
                self.put(row['workspace'],'job',job,case_id=job['case_id'])
