"""Supabase repository. Workspace IDs are verified auth user IDs from service.py.

The service key is server-only. Every query explicitly filters owner_id as well
as workspace_id because the service key bypasses RLS.
"""
import os
from uuid import UUID
from storage import uid,timestamp

def client():
    from supabase import create_client
    return create_client(os.environ['SUPABASE_URL'],os.getenv('SUPABASE_SECRET_KEY') or os.environ['SUPABASE_SERVICE_ROLE_KEY'])

class HostedRepository:
    def __init__(self):self.client=client()
    def query(self,workspace,table='trab_objects'):
        UUID(workspace)
        return self.client.table(table).select('*').eq('owner_id',workspace).eq('workspace_id',workspace)
    def put(self,workspace,kind,body,*,case_id=None):
        UUID(workspace);now=timestamp();body={**body};body.setdefault('id',uid());body.setdefault('created_at',now);body['updated_at']=now
        self.client.table('trab_objects').upsert({'workspace_id':workspace,'owner_id':workspace,'kind':kind,
            'id':body['id'],'case_id':case_id,'created_at':body['created_at'],'updated_at':now,'body':body},
            on_conflict='workspace_id,kind,id').execute()
        return body
    def get(self,workspace,kind,identifier):
        rows=self.query(workspace).eq('kind',kind).eq('id',identifier).limit(1).execute().data
        if not rows:raise KeyError(f'{kind} not found in this workspace.')
        return rows[0]['body']
    def list(self,workspace,kind,case_id=None,limit=100):
        q=self.query(workspace).eq('kind',kind)
        if case_id is not None:q=q.eq('case_id',case_id)
        return [r['body'] for r in q.order('created_at',desc=True).limit(min(max(limit,1),1000)).execute().data]
    def event(self,workspace,event):
        row=self.client.table('trab_events').insert({'workspace_id':workspace,'owner_id':workspace,'body':event}).execute().data[0]
        return {'seq':row['seq'],'created_at':row['created_at'],**event}
    def events(self,workspace,after=0):
        return [{'seq':r['seq'],'created_at':r['created_at'],**r['body']} for r in
                self.query(workspace,'trab_events').gt('seq',after).order('seq').limit(200).execute().data]
    def recover(self):
        # Recovery is per authenticated workspace; do not enumerate other owners.
        pass
    def recover_workspace(self,workspace):
        for job in self.list(workspace,'job',limit=1000):
            if job['state'] in ('queued','running','cancelling'):
                job.update(state='failed',error='Analysis service restarted. Inputs are preserved; retry this job.',stage='Interrupted')
                self.put(workspace,'job',job,case_id=job['case_id'])
