
-- Remove RLS from all group-related tables (private friends app)
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on other tables since it's a private friends app
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleepovers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleepover_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.traditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails DISABLE ROW LEVEL SECURITY;

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'chat',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji, message_type)
);

-- No RLS needed since it's a private app
ALTER TABLE public.message_reactions DISABLE ROW LEVEL SECURITY;

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
