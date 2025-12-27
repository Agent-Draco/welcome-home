-- Add pinned_at column to messages table for pin functionality
ALTER TABLE public.messages ADD COLUMN pinned_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN pinned_by uuid REFERENCES public.profiles(id) DEFAULT NULL;

-- Create user_themes table for custom themes
CREATE TABLE public.user_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  primary_color text NOT NULL,
  secondary_color text NOT NULL,
  accent_color text NOT NULL,
  background_color text NOT NULL,
  foreground_color text NOT NULL,
  font_family text NOT NULL DEFAULT 'Inter',
  is_dark boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Add theme_id to profiles for active theme
ALTER TABLE public.profiles ADD COLUMN active_theme_id uuid REFERENCES public.user_themes(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN theme_preset text DEFAULT 'default';

-- Enable RLS on user_themes
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_themes
CREATE POLICY "Users can view their own themes"
  ON public.user_themes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own themes"
  ON public.user_themes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own themes"
  ON public.user_themes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own themes"
  ON public.user_themes FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for user_themes
CREATE TRIGGER update_user_themes_updated_at
  BEFORE UPDATE ON public.user_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Policy to allow authenticated users to pin messages
CREATE POLICY "Authenticated users can pin messages"
  ON public.messages FOR UPDATE
  USING (true)
  WITH CHECK (true);