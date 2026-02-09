-- Shared data: allow any authenticated user to read/write all rows.
-- Profiles stay per-user; companies, team_members, tasks, chat_messages, custom_categories become shared.

-- Drop per-user policies
drop policy if exists "Users can manage own companies" on public.companies;
drop policy if exists "Users can manage own team_members" on public.team_members;
drop policy if exists "Users can manage own custom_categories" on public.custom_categories;
drop policy if exists "Users can manage own tasks" on public.tasks;
drop policy if exists "Users can manage own chat_messages" on public.chat_messages;

-- Companies: any authenticated user can do everything
create policy "Authenticated users can manage companies"
  on public.companies for all
  to authenticated
  using (true)
  with check (true);

-- Team members: any authenticated user can do everything
create policy "Authenticated users can manage team_members"
  on public.team_members for all
  to authenticated
  using (true)
  with check (true);

-- Custom categories: any authenticated user can do everything
create policy "Authenticated users can manage custom_categories"
  on public.custom_categories for all
  to authenticated
  using (true)
  with check (true);

-- Tasks: any authenticated user can do everything
create policy "Authenticated users can manage tasks"
  on public.tasks for all
  to authenticated
  using (true)
  with check (true);

-- Chat messages: any authenticated user can do everything
create policy "Authenticated users can manage chat_messages"
  on public.chat_messages for all
  to authenticated
  using (true)
  with check (true);
