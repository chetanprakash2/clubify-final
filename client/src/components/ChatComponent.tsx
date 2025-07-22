import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Users } from 'lucide-react';

interface ChatMessage {
  _id: string;
  content: string;
  senderId: string;
  clubId: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: Date;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    profileImageUrl?: string;
  };
}

interface ChatComponentProps {
  clubId: string;
  members: any[];
}

export function ChatComponent({ clubId, members }: ChatComponentProps) {
  const { user } = useAuth();
  const { socket, isConnected, sendMessage } = useSocket(clubId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  const { data: initialMessages, refetch } = useQuery({
    queryKey: ['/api/clubs', clubId, 'messages'],
    enabled: !!clubId,
    staleTime: 0, // Always refetch to get latest messages
  });

  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages)) {
      const sortedMessages = [...initialMessages].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
    }
  }, [initialMessages]);

  // Refetch messages when component mounts
  useEffect(() => {
    refetch();
  }, [clubId, refetch]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };



    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);

    };
  }, [socket]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessage(newMessage);
    setNewMessage('');
  };



  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (senderId: string) => {
    return senderId === user?.id;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Club Chat</h1>
        <p className="text-gray-600">Real-time communication with club members.</p>
      </div>

      <Card className="h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium text-gray-900">
                {members?.length || 0} members {isConnected ? 'online' : 'offline'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${isMyMessage(message.senderId) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${
                  isMyMessage(message.senderId) ? 'order-2' : 'order-1'
                }`}>
                  <div className={`px-4 py-2 rounded-lg ${
                    isMyMessage(message.senderId)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                    {!isMyMessage(message.senderId) && (
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {message.sender?.firstName || message.sender?.email}
                      </div>
                    )}
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      isMyMessage(message.senderId) ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
                
                {!isMyMessage(message.senderId) && (
                  <div className="order-1 mr-3">
                    {message.sender?.profileImageUrl ? (
                      <img 
                        src={message.sender.profileImageUrl} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              disabled={!isConnected}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                disabled={!isConnected}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button 
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}