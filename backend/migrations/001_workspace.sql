-- Trabecular workspace state. Execute once in your Supabase project's SQL Editor.
-- Idempotent migration; no rows or existing tables are deleted.
create table if not exists public.trab_objects (
 workspace_id text not null,
 owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null,
 id text not null,
 case_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 body jsonb not null,
 primary key(workspace_id,kind,id)
);
create index if not exists trab_objects_cases on public.trab_objects(workspace_id,kind,case_id,created_at);
alter table public.trab_objects enable row level security;
drop policy if exists trab_objects_owner on public.trab_objects;
create policy trab_objects_owner on public.trab_objects for select to authenticated
 using(owner_id=auth.uid() and workspace_id=auth.uid()::text);
-- All mutations go through the validated server API. Browser users must not
-- forge completed jobs, artifact identities or immutable revision bodies.
revoke insert,update,delete on public.trab_objects from authenticated,anon;
grant select on public.trab_objects to authenticated;
grant select,insert,update,delete on public.trab_objects to service_role;

create table if not exists public.trab_events (
 seq bigint generated always as identity primary key,
 workspace_id text not null,
 owner_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 body jsonb not null
);
create index if not exists trab_events_workspace on public.trab_events(workspace_id,seq);
alter table public.trab_events enable row level security;
drop policy if exists trab_events_owner on public.trab_events;
create policy trab_events_owner on public.trab_events for select to authenticated
 using(owner_id=auth.uid() and workspace_id=auth.uid()::text);
grant select on public.trab_events to authenticated;
grant select,insert on public.trab_events to service_role;
grant usage,select on sequence public.trab_events_seq_seq to service_role;

insert into storage.buckets(id,name,public) values('trab-artifacts','trab-artifacts',false) on conflict(id) do nothing;
drop policy if exists trab_artifacts_owner_read on storage.objects;
create policy trab_artifacts_owner_read on storage.objects for select to authenticated
 using(bucket_id='trab-artifacts' and (storage.foldername(name))[1]=auth.uid()::text);
