-- Enable Realtime for chat_messages so clients can subscribe to new messages
alter publication supabase_realtime add table public.chat_messages;
