-- Haven House maintenance system: schema, identity mapping, and row-level security.
create extension if not exists pgcrypto;

create type public.user_role as enum ('Admin', 'Student', 'Technician');
create type public.request_status as enum ('Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected');
create type public.request_priority as enum ('Low', 'Medium', 'High', 'Emergency');
create type public.hostel_type as enum ('Boys', 'Girls', 'Other');

create table public.app_user (
  app_user_id uuid primary key default gen_random_uuid(), auth_subject uuid unique not null references auth.users(id) on delete cascade,
  email text unique not null, role public.user_role not null, display_name text not null, active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.hostel (
  hostel_id uuid primary key default gen_random_uuid(), hostel_name text not null, hostel_type public.hostel_type not null default 'Other',
  warden_name text, office_contact text, address text, created_at timestamptz not null default now()
);
create table public.room (
  room_id uuid primary key default gen_random_uuid(), hostel_id uuid not null references public.hostel on delete cascade,
  room_number text not null, floor integer, capacity integer not null default 4 check (capacity > 0),
  unique(hostel_id, room_number)
);
create table public.student (
  student_id uuid primary key default gen_random_uuid(), app_user_id uuid unique not null references public.app_user on delete cascade,
  student_number text unique, full_name text not null, email text not null, phone text, course text, year text,
  room_id uuid references public.room on delete set null, created_at timestamptz not null default now()
);
create table public.technician (
  technician_id uuid primary key default gen_random_uuid(), app_user_id uuid unique not null references public.app_user on delete cascade,
  technician_code text unique, full_name text not null, email text, phone text, specialization text not null default 'General maintenance',
  active boolean not null default true, created_at timestamptz not null default now()
);
create table public.maintenance_request (
  request_id uuid primary key default gen_random_uuid(), request_code text unique not null default ('REQ-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  student_id uuid not null references public.student on delete restrict, room_id uuid not null references public.room on delete restrict,
  category text not null check(category in ('Plumbing','Electrical','Carpentry','Cleaning','Internet','Furniture','Other')),
  description text not null check(length(trim(description)) between 8 and 1200), photo_url text,
  priority public.request_priority not null default 'Medium', status public.request_status not null default 'Pending', rejection_reason text, work_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
  , constraint rejected_request_has_reason check (status <> 'Rejected' or length(trim(coalesce(rejection_reason,''))) >= 8)
);
create table public.assignment (
  assignment_id uuid primary key default gen_random_uuid(), assignment_code text unique not null default ('ASG-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  request_id uuid not null references public.maintenance_request on delete cascade,
  technician_id uuid not null references public.technician on delete restrict,
  assigned_by uuid not null references public.app_user on delete restrict,
  remarks text, assigned_at timestamptz not null default now(), active_flag boolean not null default true
);
create unique index one_active_assignment_per_request on public.assignment(request_id) where active_flag;
create table public.feedback (
  feedback_id uuid primary key default gen_random_uuid(), feedback_code text unique not null default ('FB-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  request_id uuid not null unique references public.maintenance_request on delete cascade,
  student_id uuid not null references public.student on delete restrict, rating integer not null check(rating between 1 and 5),
  comments text check(length(comments) <= 500), submitted_at timestamptz not null default now()
);
create table public.status_history (
  history_id uuid primary key default gen_random_uuid(), request_id uuid not null references public.maintenance_request on delete cascade,
  old_status public.request_status, new_status public.request_status not null,
  changed_by uuid not null references public.app_user on delete restrict, note text, changed_at timestamptz not null default now()
);
create table public.audit_log (
  audit_id uuid primary key default gen_random_uuid(), actor_id uuid references public.app_user on delete set null,
  action text not null, entity_type text not null, entity_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index request_student_idx on public.maintenance_request(student_id);
create index request_status_idx on public.maintenance_request(status);
create index request_created_idx on public.maintenance_request(created_at desc);
create index assignment_technician_idx on public.assignment(technician_id) where active_flag;
create index assignment_request_idx on public.assignment(request_id);
create index history_request_idx on public.status_history(request_id, changed_at);

create function public.current_app_user_id() returns uuid language sql stable security definer set search_path = public
as $$ select app_user_id from public.app_user where auth_subject = auth.uid() and active $$;
create function public.current_role() returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.app_user where auth_subject = auth.uid() and active $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_role() = 'Admin', false) $$;
create function public.my_student_id() returns uuid language sql stable security definer set search_path = public
as $$ select student_id from public.student where app_user_id = public.current_app_user_id() $$;
create function public.my_technician_id() returns uuid language sql stable security definer set search_path = public
as $$ select technician_id from public.technician where app_user_id = public.current_app_user_id() $$;
create function public.can_read_request(target_request uuid) returns boolean language sql stable security definer set search_path = public
as $$ select public.is_admin() or exists(select 1 from public.maintenance_request r where r.request_id=target_request and r.student_id=public.my_student_id()) or exists(select 1 from public.assignment a where a.request_id=target_request and a.technician_id=public.my_technician_id() and a.active_flag) $$;
create function public.can_read_student(target_student uuid) returns boolean language sql stable security definer set search_path = public
as $$ select public.is_admin() or exists(select 1 from public.student s where s.student_id=target_student and s.app_user_id=public.current_app_user_id()) or exists(select 1 from public.maintenance_request r join public.assignment a on a.request_id=r.request_id where r.student_id=target_student and a.technician_id=public.my_technician_id() and a.active_flag) $$;
create function public.can_read_technician(target_technician uuid) returns boolean language sql stable security definer set search_path = public
as $$ select public.is_admin() or exists(select 1 from public.technician t where t.technician_id=target_technician and t.app_user_id=public.current_app_user_id()) or exists(select 1 from public.assignment a join public.maintenance_request r on r.request_id=a.request_id where a.technician_id=target_technician and a.active_flag and r.student_id=public.my_student_id()) $$;
create function public.can_read_app_user(target_app_user uuid) returns boolean language sql stable security definer set search_path = public
as $$ select public.is_admin() or target_app_user=public.current_app_user_id() or exists(select 1 from public.status_history h where h.changed_by=target_app_user and public.can_read_request(h.request_id)) $$;
create function public.attach_request_photo(p_request_id uuid,p_photo_url text) returns void language plpgsql security definer set search_path = public
as $$ begin
 if not exists(select 1 from public.maintenance_request r where r.request_id=p_request_id and r.student_id=public.my_student_id()) then raise exception 'You can only attach a photo to your own request'; end if;
 if p_photo_url not like p_request_id::text || '/%' then raise exception 'Invalid private photo path'; end if;
 update public.maintenance_request set photo_url=p_photo_url where request_id=p_request_id;
end $$;
grant execute on function public.attach_request_photo(uuid,text) to authenticated;
revoke all on function public.current_app_user_id() from public, anon;
revoke all on function public.current_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.my_student_id() from public, anon;
revoke all on function public.my_technician_id() from public, anon;
revoke all on function public.can_read_request(uuid) from public, anon;
revoke all on function public.can_read_student(uuid) from public, anon;
revoke all on function public.can_read_technician(uuid) from public, anon;
revoke all on function public.can_read_app_user(uuid) from public, anon;
revoke all on function public.attach_request_photo(uuid,text) from public, anon;
grant execute on function public.current_app_user_id(),public.current_role(),public.is_admin(),public.my_student_id(),public.my_technician_id(),public.can_read_request(uuid),public.can_read_student(uuid),public.can_read_technician(uuid),public.can_read_app_user(uuid) to authenticated;
grant execute on function public.attach_request_photo(uuid,text) to authenticated;

create function public.audit_row_change() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if tg_op = 'INSERT' then
    insert into public.audit_log(actor_id, action, entity_type, entity_id) values(public.current_app_user_id(), 'INSERT', tg_table_name, new.request_id);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_log(actor_id, action, entity_type, entity_id, details) values(public.current_app_user_id(), 'UPDATE', tg_table_name, new.request_id, jsonb_build_object('old_status',old.status,'new_status',new.status));
    return new;
  end if;
  return old;
end $$;
create trigger request_audit after insert or update on public.maintenance_request for each row execute function public.audit_row_change();

create function public.guard_request_update() returns trigger language plpgsql security definer set search_path = public
as $$ declare r public.user_role; tech uuid;
begin
  r := public.current_role();
  if r = 'Admin' then new.updated_at := now(); return new; end if;
  if r = 'Technician' then
    tech := public.my_technician_id();
    if not exists(select 1 from public.assignment a where a.request_id=old.request_id and a.technician_id=tech and a.active_flag) then raise exception 'You can only update requests assigned to you'; end if;
    if new.status not in ('In Progress','Resolved') or old.status not in ('Assigned','In Progress') then raise exception 'Invalid technician status transition'; end if;
    if new.student_id <> old.student_id or new.room_id <> old.room_id or new.category <> old.category or new.priority <> old.priority or new.description <> old.description or new.rejection_reason is distinct from old.rejection_reason then raise exception 'Technicians may only update status'; end if;
    new.updated_at := now(); return new;
  end if;
  raise exception 'You cannot update this request';
end $$;
create trigger request_update_guard before update on public.maintenance_request for each row execute function public.guard_request_update();
create function public.record_request_status() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if tg_op='INSERT' then insert into public.status_history(request_id,new_status,changed_by) values(new.request_id,new.status,public.current_app_user_id());
  elsif new.status is distinct from old.status then insert into public.status_history(request_id,old_status,new_status,changed_by,note) values(new.request_id,old.status,new.status,public.current_app_user_id(),new.rejection_reason); end if;
  return new;
end $$;
create trigger request_status_history after insert or update of status on public.maintenance_request for each row execute function public.record_request_status();
create function public.prepare_assignment() returns trigger language plpgsql security definer set search_path = public
as $$ declare previous public.assignment%rowtype;
begin
  if not public.is_admin() then raise exception 'Only Admin can assign technicians'; end if;
  if not exists(select 1 from public.maintenance_request r where r.request_id=new.request_id and r.status not in ('Resolved','Rejected')) then raise exception 'Request cannot be assigned in its current status'; end if;
  if not exists(select 1 from public.technician t where t.technician_id=new.technician_id and t.active) then raise exception 'Technician is not active'; end if;
  update public.assignment set active_flag=false where request_id=new.request_id and active_flag returning * into previous;
  new.assigned_by := public.current_app_user_id();
  update public.maintenance_request set status='Assigned', rejection_reason=null where request_id=new.request_id;
  return new;
end $$;
create trigger assignment_prepare before insert on public.assignment for each row execute function public.prepare_assignment();
create function public.guard_feedback() returns trigger language plpgsql security definer set search_path = public
as $$ begin
 if new.student_id is distinct from public.my_student_id() or not exists(select 1 from public.maintenance_request r where r.request_id=new.request_id and r.student_id=new.student_id and r.status='Resolved') then raise exception 'Feedback is allowed only on your resolved requests'; end if;
 return new;
end $$;
create trigger feedback_guard before insert on public.feedback for each row execute function public.guard_feedback();

alter table public.app_user enable row level security;
alter table public.hostel enable row level security;
alter table public.room enable row level security;
alter table public.student enable row level security;
alter table public.technician enable row level security;
alter table public.maintenance_request enable row level security;
alter table public.assignment enable row level security;
alter table public.feedback enable row level security;
alter table public.status_history enable row level security;
alter table public.audit_log enable row level security;

create policy app_user_read on public.app_user for select using (public.can_read_app_user(app_user_id));
create policy app_user_admin_write on public.app_user for all using (public.is_admin()) with check (public.is_admin());
create policy hostel_read on public.hostel for select using (auth.uid() is not null);
create policy hostel_admin_write on public.hostel for all using (public.is_admin()) with check (public.is_admin());
create policy room_read on public.room for select using (auth.uid() is not null);
create policy room_admin_write on public.room for all using (public.is_admin()) with check (public.is_admin());
create policy student_read on public.student for select using (public.can_read_student(student_id));
create policy student_admin_write on public.student for all using (public.is_admin()) with check (public.is_admin());
create policy technician_read on public.technician for select using (public.can_read_technician(technician_id));
create policy technician_admin_write on public.technician for all using (public.is_admin()) with check (public.is_admin());
create policy request_read on public.maintenance_request for select using (public.can_read_request(request_id));
create policy request_student_insert on public.maintenance_request for insert with check (
 public.current_role()='Student' and student_id=public.my_student_id() and room_id=(select s.room_id from public.student s where s.student_id=public.my_student_id()) and status='Pending'
);
create policy request_update_policy on public.maintenance_request for update using (public.is_admin() or exists(select 1 from public.assignment a where a.request_id=maintenance_request.request_id and a.technician_id=public.my_technician_id() and a.active_flag)) with check (public.is_admin() or exists(select 1 from public.assignment a where a.request_id=maintenance_request.request_id and a.technician_id=public.my_technician_id() and a.active_flag));
create policy assignment_read on public.assignment for select using (public.is_admin() or public.can_read_request(request_id) or technician_id=public.my_technician_id());
create policy assignment_admin_insert on public.assignment for insert with check (public.is_admin());
create policy assignment_admin_update on public.assignment for update using (public.is_admin()) with check (public.is_admin());
create policy feedback_read on public.feedback for select using (public.is_admin() or student_id=public.my_student_id());
create policy feedback_student_insert on public.feedback for insert with check (public.current_role()='Student' and student_id=public.my_student_id());
create policy history_read on public.status_history for select using (
 public.can_read_request(request_id)
);
create policy audit_admin_read on public.audit_log for select using (public.is_admin());

grant usage on schema public to authenticated;
grant select on public.app_user,public.hostel,public.room,public.student,public.technician,public.maintenance_request,public.assignment,public.feedback,public.status_history,public.audit_log to authenticated;
grant insert on public.maintenance_request,public.assignment,public.feedback to authenticated;
grant insert on public.hostel,public.room,public.app_user,public.student,public.technician to authenticated;
grant update on public.maintenance_request,public.assignment,public.hostel,public.room,public.student,public.technician,public.app_user to authenticated;
grant delete on public.hostel,public.room,public.student,public.technician,public.app_user to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('request-photos','request-photos',false,5242880,array['image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy request_photo_insert on storage.objects for insert to authenticated with check (
 bucket_id='request-photos' and exists(select 1 from public.maintenance_request r where r.request_id=((storage.foldername(name))[1])::uuid and r.student_id=public.my_student_id())
);
create policy request_photo_read on storage.objects for select to authenticated using (
 bucket_id='request-photos' and public.can_read_request(((storage.foldername(name))[1])::uuid)
);

-- Create auth users through Supabase Auth first, then map each auth UUID here. Never accept role values from the browser.
-- insert into public.app_user(auth_subject,email,role,display_name) values ('AUTH-UUID','admin@haven.edu','Admin','Aarav Mehta');
