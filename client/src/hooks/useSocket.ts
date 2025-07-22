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



  return {
    socket: socketRef.current,
    isConnected,
    sendMessage
  };
}