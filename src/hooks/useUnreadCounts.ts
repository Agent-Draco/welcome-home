import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UnreadCounts {
  totalChat: number;
  groups: number;
  privateMessages: number;
}

export function useUnreadCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<UnreadCounts>({ totalChat: 0, groups: 0, privateMessages: 0 });

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    // Unread private messages
    const { count: pmCount } = await supabase
      .from('private_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null);

    setCounts({
      totalChat: 0, // Total chat has no "unread" concept
      groups: 0,
      privateMessages: pmCount || 0,
    });
  }, [user]);

  useEffect(() => {
    fetchCounts();

    if (!user) return;

    const channel = supabase
      .channel('unread-counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, () => fetchCounts())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'private_messages' }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCounts]);

  return counts;
}
