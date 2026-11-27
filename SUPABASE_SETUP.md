# Supabase Setup for Beginners

Follow these steps once to connect the Haven Hostel Maintenance app to a real database.

## Part 1: Open the project

1. Download and extract `hostel-maintenance-project.zip`.
2. In VS Code, choose **File → Open Folder** and select the extracted `hostel-maintenance-project` folder.
3. Open **Terminal → New Terminal**. The terminal should be in the folder that contains `package.json`.

## Part 2: Create the Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and choose **New project**.
2. Enter a project name and create a strong database password. Save that password somewhere safe.
3. Choose the closest region, then create the project. Wait until Supabase says the project is ready.

## Part 3: Create the database tables

1. In Supabase, open **SQL Editor** and click **New query**.
2. In VS Code, open `supabase/schema.sql`.
3. Copy all the text in `schema.sql`, paste it into Supabase's SQL Editor, and click **Run**.
4. Look for a success message. This creates the hostel, room, account, student, technician, request, assignment, feedback, and history tables, plus their access rules.
5. In **SQL Editor → New query**, open `supabase/student_signup.sql`, copy all of it, paste it, and click **Run**. This adds the Student sign-up form behavior. If you already ran `schema.sql`, do not run it again; run only `student_signup.sql`.

If Supabase shows an error, stop there and copy the error text. Don't try random SQL changes.

## Part 4: Connect the app to Supabase

1. In Supabase, open your project's **Connect** panel. Copy the **Project URL** and **Publishable key**.
2. Back in the VS Code terminal, run:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. In VS Code, open the new `.env.local` file. Replace the example values:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```

4. Save the file. Only use the **Publishable** key here. Never paste a Secret or service-role key into a browser app.
5. In Supabase, open **Authentication → URL Configuration**. Set **Site URL** to `http://localhost:5173` and add `http://localhost:5173` under **Redirect URLs** so confirmation emails return to your local app.

## Part 5: Create the Admin login

1. In Supabase, open **Authentication → Users → Add user**.
2. Create an Admin email and password. Write down the email so you can use it to sign into the app.
3. Open **SQL Editor → New query**. Replace `admin@example.com` and `Hostel Warden` with your account details, then click **Run**:

   ```sql
   insert into public.app_user (auth_subject, email, role, display_name)
   select id, email, 'Admin', 'Hostel Warden'
   from auth.users
   where email = 'admin@example.com';

   insert into public.hostel (hostel_name, hostel_type, warden_name)
   values ('Haven House', 'Other', 'Hostel Warden');
   ```

The first query links the Auth login to the app's Admin role. The second creates the first hostel. Run this setup only once for each account and hostel.

## Part 6: Start the app and add a room

In the VS Code terminal, run:

```powershell
npm install
npm run dev
```

Open the web address printed by Vite, usually `http://localhost:5173`.

If the demo screen is already signed in, click the account/profile control and sign out. Then sign in with the Admin email and password you created in Supabase.

Open **People & rooms → Add room**. Enter a room number such as `204`, choose Haven House, and save.

## Part 7: Let Students create their own accounts

1. Make sure you have already added rooms in **People & rooms**.
2. Sign out of the Admin account. On the login page, choose **New student? Create an account**.
3. Students enter their name, any email address they can open, password, and hostel room. Course and year are optional.
4. With Supabase email confirmation enabled, they must open the confirmation email and then sign in. Their role is always Student; they cannot choose Admin or Technician.

The trigger in `student_signup.sql` creates each new Student's account mapping and profile automatically. Students should use an email they can verify. This checks email ownership, not whether a person is enrolled at your college; verify student eligibility separately if the portal will be used by real residents.

## Part 8: Create a Technician login and profile

1. In Supabase, add a Technician account under **Authentication → Users → Add user**.
2. Replace the sample email and name below in the SQL Editor, then run this once:

   ```sql
   with new_user as (
     insert into public.app_user (auth_subject, email, role, display_name)
     select id, email, 'Technician', 'Technician Name'
     from auth.users
     where email = 'technician@example.com'
     returning app_user_id, email
   )
   insert into public.technician
     (app_user_id, technician_code, full_name, email, specialization)
   select
     new_user.app_user_id,
     'TECH-001',
     'Technician Name',
     new_user.email,
     'General maintenance'
   from new_user;
   ```

## Part 9: Restart and sign in

If the app was already running when you edited `.env.local`, go to the VS Code terminal and press **Ctrl+C**. Then run:

```powershell
npm run dev
```

Sign in with the Admin or Technician account you created. Students use the self-sign-up link from Part 7. Technician accounts still need an Authentication account and matching profile created through the SQL in Part 8.

## Important notes

- The public sign-up page creates Student accounts only. Create Admin and Technician accounts yourself in Supabase.
- Use the Publishable key in `.env.local`; do not use the Secret/service-role key in frontend code.
- Students need to use an email they can verify and select a room that the Admin has added.
- Demo accounts work only when Supabase is not connected.

