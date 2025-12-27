import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  audioElement: HTMLAudioElement;
}

export function useWebRTCVoice(roomId: string | null, userId: string | null) {
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(config);
    const audioElement = new Audio();
    audioElement.autoplay = true;

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming audio
    pc.ontrack = (event) => {
      console.log('Received remote track from', peerId);
      audioElement.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            to: peerId,
            from: userId,
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
    };

    return { peerId, connection: pc, audioElement };
  }, [userId]);

  const startCall = useCallback(async (peerId: string) => {
    if (!channelRef.current || !userId) return;

    const peerConn = createPeerConnection(peerId, true);
    setPeers(prev => new Map(prev).set(peerId, peerConn));

    try {
      const offer = await peerConn.connection.createOffer();
      await peerConn.connection.setLocalDescription(offer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          offer,
          to: peerId,
          from: userId,
        },
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createPeerConnection, userId]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromId: string) => {
    if (!channelRef.current || !userId) return;

    const peerConn = createPeerConnection(fromId, false);
    setPeers(prev => new Map(prev).set(fromId, peerConn));

    try {
      await peerConn.connection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConn.connection.createAnswer();
      await peerConn.connection.setLocalDescription(answer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          to: fromId,
          from: userId,
        },
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, userId]);

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

  const connect = useCallback(async (stream: MediaStream) => {
    if (!roomId || !userId) return;

    localStreamRef.current = stream;

    // Set up signaling channel
    const channel = supabase.channel(`voice-signaling-${roomId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        if (payload.to === userId) {
          handleOffer(payload.offer, payload.from);
        }
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        if (payload.to === userId) {
          handleAnswer(payload.answer, payload.from);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.to === userId) {
          handleIceCandidate(payload.candidate, payload.from);
        }
      })
      .on('broadcast', { event: 'peer-joined' }, ({ payload }) => {
        if (payload.peerId !== userId) {
          console.log('New peer joined:', payload.peerId);
          startCall(payload.peerId);
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
          setIsConnected(true);
          // Announce our presence
          channel.send({
            type: 'broadcast',
            event: 'peer-joined',
            payload: { peerId: userId },
          });
        }
      });
  }, [roomId, userId, handleOffer, handleAnswer, handleIceCandidate, startCall, peers]);

  const disconnect = useCallback(() => {
    // Close all peer connections
    peers.forEach(peer => {
      peer.connection.close();
      peer.audioElement.srcObject = null;
    });
    setPeers(new Map());

    // Notify others we're leaving
    if (channelRef.current && userId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'peer-left',
        payload: { peerId: userId },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setIsConnected(false);
  }, [peers, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    peers,
    isConnected,
    connect,
    disconnect,
  };
}
