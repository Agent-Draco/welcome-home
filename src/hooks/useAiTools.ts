import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AiTool {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  category: string | null;
  added_by: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    username: string | null;
  };
}

export function useAiTools() {
  const { user } = useAuth();
  const [tools, setTools] = useState<AiTool[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTools = async () => {
    const { data } = await supabase
      .from('ai_tools')
      .select('*, profiles:added_by (display_name, username)')
      .order('created_at', { ascending: false });
    if (data) setTools(data as unknown as AiTool[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchTools();
  }, [user]);

  const addTool = async (name: string, url?: string, description?: string, category?: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase.from('ai_tools').insert({
      name,
      url: url || null,
      description: description || null,
      category: category || 'general',
      added_by: user.id,
    });
    if (!error) await fetchTools();
    return { error };
  };

  const deleteTool = async (toolId: string) => {
    const { error } = await supabase.from('ai_tools').delete().eq('id', toolId);
    if (!error) await fetchTools();
    return { error };
  };

  return { tools, loading, addTool, deleteTool, fetchTools };
}
