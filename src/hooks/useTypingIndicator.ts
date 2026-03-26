import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingUser {
  userId: string;
  displayName: string;
}

export function useTypingIndicator(channelName: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || !channelName) return;

    const channel = supabase.channel(`typing-${channelName}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        for (const [key, presences] of Object.entries(state)) {
          if (key !== user.id) {
            const p = presences[0] as any;
            if (p?.typing) {
              users.push({ userId: key, displayName: p.displayName || 'Someone' });
            }
          }
        }
        setTypingUsers(users);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, channelName]);

  const startTyping = useCallback(async (displayName: string) => {
    if (!channelRef.current) return;
    
    await channelRef.current.track({ typing: true, displayName });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (channelRef.current) {
        await channelRef.current.track({ typing: false, displayName });
      }
    }, 3000);
  }, []);

  const stopTyping = useCallback(async () => {
    if (!channelRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    await channelRef.current.untrack();
  }, []);

  return { typingUsers, startTyping, stopTyping };
}
