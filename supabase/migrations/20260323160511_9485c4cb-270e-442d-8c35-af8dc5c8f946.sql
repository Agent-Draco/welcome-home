
-- Update file size limit on attachments bucket (no limit effectively)
UPDATE storage.buckets SET file_size_limit = 524288000 WHERE id = 'attachments';

-- Add delete policy for groups (creator can delete)
DROP POLICY IF EXISTS "Group members can delete groups" ON public.groups;
CREATE POLICY "Group creator or admin can delete groups"
ON public.groups FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.admin_emails WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Allow group creator/admin to remove members  
DROP POLICY IF EXISTS "Members can leave or admins remove" ON public.group_members;
DROP POLICY IF EXISTS "Members can leave or creator can remove" ON public.group_members;
CREATE POLICY "Members can leave or creator can remove"
ON public.group_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.admin_emails WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Allow cascading delete of channels and messages when group is deleted
DROP POLICY IF EXISTS "Group members can delete channels" ON public.channels;
CREATE POLICY "Group creator can delete channels"
ON public.channels FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.admin_emails WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
