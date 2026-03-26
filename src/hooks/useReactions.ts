import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
  users: string[];
}

export interface ReactionMap {
  [messageId: string]: Reaction[];
}

export function useReactions(messageType: 'chat' | 'channel' | 'private', scopeId?: string) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionMap>({});

  const fetchReactions = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length || !user) return;

    const { data } = await supabase
      .from('message_reactions')
      .select('message_id, emoji, user_id')
      .eq('message_type', messageType)
      .in('message_id', messageIds);

    if (data) {
      const map: ReactionMap = {};
      for (const r of data) {
        if (!map[r.message_id]) map[r.message_id] = [];
        const existing = map[r.message_id].find(e => e.emoji === r.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(r.user_id);
          if (r.user_id === user.id) existing.userReacted = true;
        } else {
          map[r.message_id].push({
            emoji: r.emoji,
            count: 1,
            userReacted: r.user_id === user.id,
            users: [r.user_id],
          });
        }
      }
      setReactions(map);
    }
  }, [user, messageType]);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const existing = reactions[messageId]?.find(r => r.emoji === emoji && r.userReacted);
    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .eq('message_type', messageType);
    } else {
      await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: user.id, emoji, message_type: messageType });
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`reactions-${messageType}-${scopeId || 'global'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      }, () => {
        // Re-fetch on any change - we need the message IDs from current state
        const ids = Object.keys(reactions);
        if (ids.length) fetchReactions(ids);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, messageType, scopeId]);

  return { reactions, fetchReactions, toggleReaction };
}
