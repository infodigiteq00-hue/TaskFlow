-- Track who has seen each chat message (user ids array)
alter table public.chat_messages
  add column if not exists seen_by jsonb not null default '[]'::jsonb;

comment on column public.chat_messages.seen_by is 'Array of user ids who have seen this message';
