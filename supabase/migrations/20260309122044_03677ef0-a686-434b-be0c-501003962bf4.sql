
-- Groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Group members table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Channels table
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Channel messages table
CREATE TABLE public.channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  pinned_at timestamptz,
  pinned_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

-- AI Tools bookmarks table
CREATE TABLE public.ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text,
  description text,
  category text DEFAULT 'general',
  added_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

-- Enable realtime for channel_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;

-- =====================
-- RLS POLICIES
-- =====================

-- Groups: members can see their groups, admin sees all
CREATE POLICY "Group members can view groups" ON public.groups
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = groups.id AND user_id = auth.uid())
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update groups" ON public.groups
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Group creators can delete groups" ON public.groups
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Group members: viewable by group members
CREATE POLICY "Group members can view members" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Group admins can add members" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'creator'))
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.created_by = auth.uid())
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Group admins can remove members" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role IN ('admin', 'creator'))
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Channels: viewable by group members
CREATE POLICY "Group members can view channels" ON public.channels
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = channels.group_id AND gm.user_id = auth.uid())
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Group members can create channels" ON public.channels
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = channels.group_id AND gm.user_id = auth.uid())
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Channel creators can update channels" ON public.channels
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Channel creators can delete channels" ON public.channels
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Channel messages: viewable by group members
CREATE POLICY "Group members can view channel messages" ON public.channel_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.channels c
      JOIN public.group_members gm ON gm.group_id = c.group_id
      WHERE c.id = channel_messages.channel_id AND gm.user_id = auth.uid()
    )
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Group members can send channel messages" ON public.channel_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      EXISTS (
        SELECT 1 FROM public.channels c
        JOIN public.group_members gm ON gm.group_id = c.group_id
        WHERE c.id = channel_messages.channel_id AND gm.user_id = auth.uid()
      )
      OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Senders and admins can delete channel messages" ON public.channel_messages
  FOR DELETE TO authenticated
  USING (
    auth.uid() = sender_id
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- AI Tools: viewable by all authenticated, anyone can add
CREATE POLICY "AI tools viewable by authenticated" ON public.ai_tools
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add tools" ON public.ai_tools
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Creators and admins can update tools" ON public.ai_tools
  FOR UPDATE TO authenticated
  USING (auth.uid() = added_by OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Creators and admins can delete tools" ON public.ai_tools
  FOR DELETE TO authenticated
  USING (auth.uid() = added_by OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid())));

-- Update messages table: allow admin to delete any message
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Senders and admins can delete messages" ON public.messages
  FOR DELETE TO authenticated
  USING (
    auth.uid() = sender_id
    OR public.is_admin_user((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Auto-add admin to every group via trigger
CREATE OR REPLACE FUNCTION public.auto_add_admin_to_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  SELECT NEW.id, p.id, 'admin'
  FROM public.admin_emails ae
  JOIN auth.users u ON u.email = ae.email
  JOIN public.profiles p ON p.id = u.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.group_members gm WHERE gm.group_id = NEW.id AND gm.user_id = p.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_admin_to_new_group
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_admin_to_group();
