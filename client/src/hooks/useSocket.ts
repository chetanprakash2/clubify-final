import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export function useSocket(clubId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Create socket connection
    socketRef.current = io(window.location.origin, {
      path: '/ws'
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    if (clubId && socketRef.current && isConnected) {
      socketRef.current.emit('join-club', clubId);
      
      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave-club', clubId);
        }
      };
    }
  }, [clubId, isConnected]);

  const sendMessage = (message: string) => {
    if (socketRef.current && user && clubId) {
      socketRef.current.emit('send-message', {
        clubId,
        message,
        userId: user.id
      });
    }
  };

  const startVideoCall = (meetingId: string) => {
    if (socketRef.current && clubId) {
      socketRef.current.emit('start-meeting', {
        clubId,
        meetingId
      });
    }
  };

  const joinVideoCall = (meetingId: string) => {
    if (socketRef.current && clubId) {
      socketRef.current.emit('join-meeting', {
        clubId,
        meetingId
      });
    }
  };

  const leaveVideoCall = (meetingId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-meeting', {
        meetingId
      });
    }
  };

  // WebRTC signaling methods
  const sendWebRTCOffer = (offer: RTCSessionDescriptionInit, targetUserId?: string) => {
    if (socketRef.current && clubId) {
      socketRef.current.emit('webrtc-offer', {
        clubId,
        offer,
        targetUserId
      });
    }
  };

  const sendWebRTCAnswer = (answer: RTCSessionDescriptionInit, targetUserId: string) => {
    if (socketRef.current && clubId) {
      socketRef.current.emit('webrtc-answer', {
        clubId,
        answer,
        targetUserId
      });
    }
  };

  const sendICECandidate = (candidate: RTCIceCandidate, targetUserId?: string) => {
    if (socketRef.current && clubId) {
      socketRef.current.emit('webrtc-ice-candidate', {
        clubId,
        candidate: candidate.toJSON(),
        targetUserId
      });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    startVideoCall,
    joinVideoCall,
    leaveVideoCall,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate
  };
}