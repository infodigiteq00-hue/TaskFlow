-- RPC to get display names for auth user ids (e.g. for "Seen by" in chat). Uses SECURITY DEFINER so any caller can resolve names.
create or replace function public.get_display_names(user_ids uuid[])
returns table (id uuid, full_name text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.full_name
  from public.profiles p
  where p.id = any(user_ids);
$$;
