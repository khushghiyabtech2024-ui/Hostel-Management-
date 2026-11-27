# Haven House Maintenance

Responsive hostel maintenance portal built with React and Vite. It runs in local demo mode by default and stores requests, assignments, technician updates, room changes, and feedback in the browser's local storage. Students, technicians, and admins can try the complete workflow without a paid backend. Optional Supabase integration is available for shared database storage.

## Run the demo

```sh
npm install
npm run dev
```

Sign in with any password using one of these demo accounts:

| Role | Email |
| --- | --- |
| Admin / Warden | `admin@haven.edu` |
| Student | `student@haven.edu` |
| Electrician | `tech@haven.edu` |
| Plumber | `priya@haven.edu` |
| Carpenter | `amit.carpenter@haven.edu` |
| General maintenance | `karan.general@haven.edu` |

Use `demo1234` (or any non-empty password) for these local demo accounts. The admin assignment list recommends the technician who matches the issue category. Electrical goes to the electrician, Plumbing to the plumber, Carpentry and Furniture to the carpenter, and Cleaning, Internet, and Other to general maintenance. The general technician is also available as a fallback.

The demo supports submitting and tracking requests, assigning and reassigning work, technician status updates, feedback, filtering, and CSV export. Changes remain after refresh and sync between tabs in the same browser. Local storage is specific to that browser and device, so it does not sync between different computers.

## Connect Supabase

For a beginner-friendly walkthrough, follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

To use Supabase instead of local storage, set `VITE_USE_SUPABASE=true` in `.env.local` and configure the keys below. Leave it `false` for a no-subscription classroom demonstration.

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the publishable key only; never put a secret/service role key in the frontend).
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Create accounts through Supabase Auth. For each account, insert a matching `app_user` row that maps `auth_subject` to the Auth user's UUID and sets its role. Create its `student` or `technician` profile as needed. Add the first hostel record in the SQL editor; Admins can add rooms from **People & rooms** in the app.
5. Restart the dev server. Supabase Auth is enabled only when `VITE_USE_SUPABASE=true`.

Example account mapping (replace UUIDs with real Auth user IDs):

```sql
insert into public.app_user(auth_subject, email, role, display_name)
values ('AUTH-USER-UUID', 'admin@your-college.edu', 'Admin', 'Hostel Warden');

insert into public.hostel(hostel_name,hostel_type,warden_name)
values ('Haven House','Other','Hostel Warden');
```

The schema enables RLS and provides policies and database triggers for role checks, ownership, assignment, request status history, audit entries, and feedback eligibility. Do not disable RLS in a deployed project. Configure database backups and review Supabase Auth email settings before using real resident accounts.

## Project layout

- `src/App.jsx` — responsive role-based app and workflows
- `src/components/` — reusable request table, assignment history, status chart, and KPI icon components
- `src/components/StudentDashboard.jsx` — student-focused request overview
- `src/components/StudentProfile.jsx` — resident contact, course, student ID, and room details
- `src/backend.js` — demo storage and Supabase data/auth adapters
- `src/data.js` — demo users and sample requests
- `supabase/schema.sql` — Postgres schema, triggers, and RLS policies
- `.env.example` — Supabase frontend configuration template
