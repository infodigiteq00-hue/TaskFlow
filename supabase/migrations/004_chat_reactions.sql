-- Add reactions to chat messages: { "emoji": ["userId1", "userId2"] }
alter table public.chat_messages
  add column if not exists reactions jsonb not null default '{}';
