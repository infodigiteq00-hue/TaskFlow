-- TaskFlow: initial schema with RLS
-- Run this in Supabase SQL Editor or via Supabase CLI (supabase db push)

-- Optional: profiles for display name/avatar (id = auth.uid())
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Companies (owned by user)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  logo text,
  contact_email text,
  linkedin_subscription boolean not null default false,
  created_at timestamptz not null default now()
);

-- Team members (owned by user)
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar text,
  role text not null default '',
  department text not null default ''
);

-- Custom categories (owned by user)
create table if not exists public.custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value text not null,
  label text not null,
  unique(user_id, value)
);

-- Tasks (owned by user; company_id nullable for unlinked tasks)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  company_name text,
  title text not null,
  description text not null default '',
  category text not null,
  status text not null default 'pending',
  priority text not null default 'medium',
  assigned_to text[] not null default '{}',
  assigned_by text not null default '',
  start_date date not null,
  end_date date not null,
  end_time text,
  final_file_url text,
  doc_uploaded_at timestamptz,
  linkedin_post_url text,
  linkedin_posted_on date,
  linkedin_posted_by text,
  is_core_task boolean default false,
  stage text,
  special_notes text,
  reminder jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat messages (workspace-scoped by user_id; sender stored as text for flexibility)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  sender_avatar text,
  message text not null,
  timestamp timestamptz not null default now(),
  task_id uuid references public.tasks(id) on delete set null
);

-- Indexes for common filters
create index if not exists idx_companies_user_id on public.companies(user_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);
create index if not exists idx_custom_categories_user_id on public.custom_categories(user_id);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_company_id on public.tasks(company_id);
create index if not exists idx_tasks_end_date on public.tasks(end_date);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);

-- Trigger: update tasks.updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Optional: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: enable on all tables
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.team_members enable row level security;
alter table public.custom_categories enable row level security;
alter table public.tasks enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles: own row only
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Companies: CRUD own rows
create policy "Users can manage own companies" on public.companies
  for all using (auth.uid() = user_id);

-- Team members: CRUD own rows
create policy "Users can manage own team_members" on public.team_members
  for all using (auth.uid() = user_id);

-- Custom categories: CRUD own rows
create policy "Users can manage own custom_categories" on public.custom_categories
  for all using (auth.uid() = user_id);

-- Tasks: CRUD own rows
create policy "Users can manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- Chat messages: insert own; select/delete own workspace messages
create policy "Users can manage own chat_messages" on public.chat_messages
  for all using (auth.uid() = user_id);
