import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface Channel {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  pinned_at: string | null;
  pinned_by: string | null;
  profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setGroups(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchGroups();
  }, [user]);

  const createGroup = async (name: string, description?: string, memberIds?: string[]) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('groups')
      .insert({ name, description: description || null, created_by: user.id })
      .select()
      .single();

    if (!error && data) {
      // Add creator as member
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: user.id,
        role: 'creator',
      });

      // Add selected members
      if (memberIds && memberIds.length > 0) {
        const memberInserts = memberIds.map(id => ({
          group_id: data.id,
          user_id: id,
          role: 'member',
        }));
        await supabase.from('group_members').insert(memberInserts);
      }

      // Create default #general channel
      await supabase.from('channels').insert({
        group_id: data.id,
        name: 'general',
        description: 'General discussion',
        created_by: user.id,
      });

      await fetchGroups();
    }

    return { data, error };
  };

  const deleteGroup = async (groupId: string) => {
    // Delete channels and their messages first
    const { data: channels } = await supabase.from('channels').select('id').eq('group_id', groupId);
    if (channels) {
      for (const ch of channels) {
        await supabase.from('channel_messages').delete().eq('channel_id', ch.id);
      }
      await supabase.from('channels').delete().eq('group_id', groupId);
    }
    await supabase.from('group_members').delete().eq('group_id', groupId);
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (!error) await fetchGroups();
    return { error };
  };

  const addMember = async (groupId: string, userId: string) => {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role: 'member' });
    return { error };
  };

  const removeMember = async (groupId: string, userId: string) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    return { error };
  };

  return { groups, loading, createGroup, deleteGroup, addMember, removeMember, fetchGroups };
}

export function useGroupChannels(groupId: string | null) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (data) setChannels(data);
  };

  const fetchMembers = async () => {
    if (!groupId) return;
    const { data } = await supabase
      .from('group_members')
      .select('*, profiles:user_id (id, display_name, username, avatar_url)')
      .eq('group_id', groupId);
    if (data) setMembers(data as GroupMember[]);
  };

  useEffect(() => {
    if (groupId) {
      setLoading(true);
      Promise.all([fetchChannels(), fetchMembers()]).then(() => setLoading(false));
    }
  }, [groupId]);

  const createChannel = async (name: string, description?: string) => {
    if (!groupId) return { error: new Error('No group selected') };
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('channels')
      .insert({ group_id: groupId, name, description: description || null, created_by: userData.user?.id });
    if (!error) await fetchChannels();
    return { error };
  };

  return { channels, members, loading, createChannel, fetchChannels, fetchMembers };
}

export function useChannelMessages(channelId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('channel_messages')
        .select(`
          id, channel_id, sender_id, content, created_at, pinned_at, pinned_by,
          profiles:profiles!channel_messages_sender_id_fkey (id, display_name, username, avatar_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (data) setMessages(data as unknown as ChannelMessage[]);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`channel-messages-${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();
        const newMsg = { ...payload.new, profiles: profile } as unknown as ChannelMessage;
        setMessages(prev => [...prev, newMsg]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'channel_messages', filter: `channel_id=eq.${channelId}` }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId, user]);

  const sendMessage = async (content: string, attachments?: { url: string; type: 'image' | 'file'; name: string }[]) => {
    if (!user || !channelId) return { error: new Error('Invalid') };
    let messageContent = content.trim();
    if (attachments?.length) {
      const attachmentText = attachments.map(a =>
        a.type === 'image' ? `[image:${a.url}]` : `[file:${a.name}:${a.url}]`
      ).join(' ');
      messageContent = messageContent ? `${messageContent} ${attachmentText}` : attachmentText;
    }
    const { error } = await supabase.from('channel_messages').insert({
      channel_id: channelId,
      sender_id: user.id,
      content: messageContent,
    });
    return { error };
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase.from('channel_messages').delete().eq('id', messageId);
    return { error };
  };

  return { messages, loading, sendMessage, deleteMessage };
}
