-- Run this once in Supabase SQL Editor after schema.sql.
-- It allows self-registration for Student accounts only; Admin and Technician roles are not selectable here.
-- These grants also update projects that ran an earlier version of schema.sql.
grant insert on public.hostel,public.room,public.app_user,public.student,public.technician to authenticated;

create or replace function public.list_signup_rooms()
returns table (room_id uuid, room_label text)
language sql
stable
security definer
set search_path = public
as $$
  select r.room_id, h.hostel_name || ' · ' || r.room_number as room_label
  from public.room r
  join public.hostel h on h.hostel_id = r.hostel_id
  order by h.hostel_name, r.room_number;
$$;
revoke all on function public.list_signup_rooms() from public;
grant execute on function public.list_signup_rooms() to anon, authenticated;

create or replace function public.handle_haven_student_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_app_user_id uuid;
  selected_room_id uuid;
  student_name text;
begin
  -- Only registrations carrying this marker are self-service. Dashboard-created Admin/Technician users are unchanged.
  if coalesce(new.raw_user_meta_data ->> 'signup_type', '') <> 'student' then
    return new;
  end if;

  student_name := trim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  if length(student_name) < 2 or new.email is null then
    raise exception 'A valid name and email are required for student registration';
  end if;

  select r.room_id into selected_room_id
  from public.room r
  where r.room_id::text = new.raw_user_meta_data ->> 'room_id';
  if selected_room_id is null then
    raise exception 'Choose an available hostel room';
  end if;

  insert into public.app_user(auth_subject, email, role, display_name)
  values(new.id, lower(new.email), 'Student', student_name)
  returning app_user_id into new_app_user_id;

  insert into public.student(app_user_id, full_name, email, phone, course, year, room_id)
  values(
    new_app_user_id,
    student_name,
    lower(new.email),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'course'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'year'), ''),
    selected_room_id
  );

  return new;
end;
$$;

drop trigger if exists haven_student_signup_profile on auth.users;
create trigger haven_student_signup_profile
after insert on auth.users
for each row execute function public.handle_haven_student_signup();
