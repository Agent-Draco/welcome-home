ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_uid(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.admin_emails ae ON ae.email = u.email
    WHERE u.id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_uid(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.group_members gm
      WHERE gm.group_id = _group_id
        AND gm.user_id = _user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_group(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_uid(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.groups g
      WHERE g.id = _group_id
        AND g.created_by = _user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_channel(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.channels c
    WHERE c.id = _channel_id
      AND public.is_group_member(c.group_id, _user_id)
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group creator or admin can delete groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators can delete groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can view groups" ON public.groups;

CREATE POLICY "Members can view groups"
ON public.groups
FOR SELECT
TO authenticated
USING (public.is_group_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Managers can update groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (public.can_manage_group(id, auth.uid()))
WITH CHECK (public.can_manage_group(id, auth.uid()));

CREATE POLICY "Managers can delete groups"
ON public.groups
FOR DELETE
TO authenticated
USING (public.can_manage_group(id, auth.uid()));

DROP POLICY IF EXISTS "Members can view group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Managers can add group members" ON public.group_members;
DROP POLICY IF EXISTS "Managers can update group members" ON public.group_members;
DROP POLICY IF EXISTS "Managers or users can remove group members" ON public.group_members;

CREATE POLICY "Members can view group memberships"
ON public.group_members
FOR SELECT
TO authenticated
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Managers can add group members"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Managers can update group members"
ON public.group_members
FOR UPDATE
TO authenticated
USING (public.can_manage_group(group_id, auth.uid()))
WITH CHECK (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Managers or users can remove group members"
ON public.group_members
FOR DELETE
TO authenticated
USING (public.can_manage_group(group_id, auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Channel creators can delete channels" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can update channels" ON public.channels;
DROP POLICY IF EXISTS "Group creator can delete channels" ON public.channels;
DROP POLICY IF EXISTS "Group members can create channels" ON public.channels;
DROP POLICY IF EXISTS "Group members can view channels" ON public.channels;

CREATE POLICY "Members can view channels"
ON public.channels
FOR SELECT
TO authenticated
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can create channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_group_member(group_id, auth.uid())
  AND (created_by IS NULL OR created_by = auth.uid())
);

CREATE POLICY "Managers can update channels"
ON public.channels
FOR UPDATE
TO authenticated
USING ((auth.uid() = created_by) OR public.can_manage_group(group_id, auth.uid()))
WITH CHECK ((auth.uid() = created_by) OR public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Managers can delete channels"
ON public.channels
FOR DELETE
TO authenticated
USING ((auth.uid() = created_by) OR public.can_manage_group(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group members can send channel messages" ON public.channel_messages;
DROP POLICY IF EXISTS "Group members can view channel messages" ON public.channel_messages;
DROP POLICY IF EXISTS "Senders and admins can delete channel messages" ON public.channel_messages;

CREATE POLICY "Members can view channel messages"
ON public.channel_messages
FOR SELECT
TO authenticated
USING (public.can_access_channel(channel_id, auth.uid()));

CREATE POLICY "Members can send channel messages"
ON public.channel_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.can_access_channel(channel_id, auth.uid())
);

CREATE POLICY "Senders and admins can delete channel messages"
ON public.channel_messages
FOR DELETE
TO authenticated
USING ((auth.uid() = sender_id) OR public.is_admin_uid(auth.uid()));

DROP POLICY IF EXISTS "Users can send private messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.private_messages;
DROP POLICY IF EXISTS "Participants can delete their private messages" ON public.private_messages;

CREATE POLICY "Participants can view private messages"
ON public.private_messages
FOR SELECT
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

CREATE POLICY "Participants can send private messages"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Participants can update private messages"
ON public.private_messages
FOR UPDATE
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id))
WITH CHECK ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));