import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface VoiceRoom {
  id: string;
  name: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  is_muted: boolean;
  joined_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  audioElement: HTMLAudioElement;
}

export function useVoiceRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [participants, setParticipants] = useState<Record<string, RoomParticipant[]>>({});
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('voice_rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRooms(data);
      for (const room of data) {
        await fetchParticipants(room.id);
      }
    }
    setLoading(false);
  };

  const fetchParticipants = async (roomId: string) => {
    const { data, error } = await supabase
      .from('voice_room_participants')
      .select(`
        *,
        profiles:user_id (id, display_name, username, avatar_url)
      `)
      .eq('room_id', roomId);

    if (!error && data) {
      setParticipants(prev => ({ ...prev, [roomId]: data as RoomParticipant[] }));
    }
  };

  const createRoom = async (name: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('voice_rooms')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (!error && data) {
      setRooms(prev => [data, ...prev]);
    }

    return { data, error };
  };

  const createPeerConnection = useCallback((peerId: string, stream: MediaStream) => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(config);
    const audioElement = new Audio();
    audioElement.autoplay = true;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      console.log('Received remote track from', peerId);
      audioElement.srcObject = event.streams[0];
      audioElement.play().catch(console.error);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            to: peerId,
            from: user?.id,
          },
        });
      }
    };

    return { peerId, connection: pc, audioElement };
  }, [user]);

  const startCall = useCallback(async (peerId: string, stream: MediaStream) => {
    if (!channelRef.current || !user) return;

    const peerConn = createPeerConnection(peerId, stream);
    setPeers(prev => new Map(prev).set(peerId, peerConn));

    try {
      const offer = await peerConn.connection.createOffer();
      await peerConn.connection.setLocalDescription(offer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: { offer, to: peerId, from: user.id },
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createPeerConnection, user]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromId: string, stream: MediaStream) => {
    if (!channelRef.current || !user) return;

    const peerConn = createPeerConnection(fromId, stream);
    setPeers(prev => new Map(prev).set(fromId, peerConn));

    try {
      await peerConn.connection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConn.connection.createAnswer();
      await peerConn.connection.setLocalDescription(answer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: { answer, to: fromId, from: user.id },
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, user]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, fromId: string) => {
    const peerConn = peers.get(fromId);
    if (peerConn) {
      try {
        await peerConn.connection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }, [peers]);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, fromId: string) => {
    const peerConn = peers.get(fromId);
    if (peerConn) {
      try {
        await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, [peers]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      setLocalStream(stream);

      const { error } = await supabase
        .from('voice_room_participants')
        .insert({ room_id: roomId, user_id: user.id, is_muted: false });

      if (error) {
        stream.getTracks().forEach(track => track.stop());
        return { error };
      }

      // Set up WebRTC signaling channel
      const channel = supabase.channel(`voice-signaling-${roomId}`);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'offer' }, ({ payload }) => {
          if (payload.to === user.id) {
            handleOffer(payload.offer, payload.from, stream);
          }
        })
        .on('broadcast', { event: 'answer' }, ({ payload }) => {
          if (payload.to === user.id) {
            handleAnswer(payload.answer, payload.from);
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
          if (payload.to === user.id) {
            handleIceCandidate(payload.candidate, payload.from);
          }
        })
        .on('broadcast', { event: 'peer-joined' }, ({ payload }) => {
          if (payload.peerId !== user.id) {
            console.log('New peer joined:', payload.peerId);
            startCall(payload.peerId, stream);
          }
        })
        .on('broadcast', { event: 'peer-left' }, ({ payload }) => {
          const peerConn = peers.get(payload.peerId);
          if (peerConn) {
            peerConn.connection.close();
            peerConn.audioElement.srcObject = null;
            setPeers(prev => {
              const newPeers = new Map(prev);
              newPeers.delete(payload.peerId);
              return newPeers;
            });
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'peer-joined',
              payload: { peerId: user.id },
            });
          }
        });

      setCurrentRoom(roomId);
      setIsMuted(false);
      await fetchParticipants(roomId);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user, handleOffer, handleAnswer, handleIceCandidate, startCall, peers]);

  const leaveRoom = useCallback(async () => {
    if (!user || !currentRoom) return;

    // Close all peer connections
    peers.forEach(peer => {
      peer.connection.close();
      peer.audioElement.srcObject = null;
    });
    setPeers(new Map());

    // Notify others we're leaving
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'peer-left',
        payload: { peerId: user.id },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    await supabase
      .from('voice_room_participants')
      .delete()
      .eq('room_id', currentRoom)
      .eq('user_id', user.id);

    const roomId = currentRoom;
    setCurrentRoom(null);
    await fetchParticipants(roomId);
  }, [user, currentRoom, localStream, peers]);

  const toggleMute = useCallback(async () => {
    if (!user || !currentRoom || !localStream) return;

    const newMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !newMuted;
    });

    await supabase
      .from('voice_room_participants')
      .update({ is_muted: newMuted })
      .eq('room_id', currentRoom)
      .eq('user_id', user.id);

    setIsMuted(newMuted);
  }, [user, currentRoom, isMuted, localStream]);

  useEffect(() => {
    fetchRooms();

    const roomsChannel = supabase
      .channel('voice-rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    const participantsChannel = supabase
      .channel('voice-participants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_room_participants' }, (payload) => {
        const roomId = (payload.new as any)?.room_id || (payload.old as any)?.room_id;
        if (roomId) {
          fetchParticipants(roomId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(participantsChannel);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentRoom && user) {
        navigator.sendBeacon(`/api/leave-room?room=${currentRoom}&user=${user.id}`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentRoom, user]);

  return {
    rooms,
    participants,
    currentRoom,
    isMuted,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMute,
    fetchRooms,
  };
}
