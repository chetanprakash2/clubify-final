import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users } from 'lucide-react';

interface VideoMeetingProps {
  clubId: string;
  members: any[];
}

export function VideoMeeting({ clubId, members }: VideoMeetingProps) {
  const { user } = useAuth();
  const { socket, isConnected, startVideoCall, joinVideoCall, leaveVideoCall, sendWebRTCOffer, sendWebRTCAnswer, sendICECandidate } = useSocket(clubId);
  
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize local media stream
  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' }, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Ensure video plays
        localVideoRef.current.play().catch(e => console.log('Video play error:', e));
      }
      
      console.log('Local stream initialized:', stream.getTracks());
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Camera access denied. Please allow camera access and try again.');
      throw error;
    }
  };

  // Create peer connection
  const createPeerConnection = (peerId: string) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const remoteVideo = remoteVideoRefs.current[peerId];
      if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendICECandidate(event.candidate, peerId);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${peerId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setConnectedPeers(prev => [...prev.filter(p => p !== peerId), peerId]);
      } else if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        setConnectedPeers(prev => prev.filter(p => p !== peerId));
      }
    };

    peerConnectionsRef.current[peerId] = peerConnection;
    return peerConnection;
  };

  // Start a new meeting
  const handleStartMeeting = async () => {
    try {
      await initializeLocalStream();
      const meetingId = `meeting-${Date.now()}-${user?.id}`;
      setCurrentMeetingId(meetingId);
      setIsInCall(true);
      startVideoCall(meetingId);
    } catch (error) {
      console.error('Failed to start meeting:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  // Join an existing meeting
  const handleJoinMeeting = async (meetingId: string) => {
    try {
      await initializeLocalStream();
      setCurrentMeetingId(meetingId);
      setIsInCall(true);
      joinVideoCall(meetingId);
    } catch (error) {
      console.error('Failed to join meeting:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  // Leave the current meeting
  const handleLeaveMeeting = () => {
    if (currentMeetingId) {
      leaveVideoCall(currentMeetingId);
    }
    
    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Clean up peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    
    setIsInCall(false);
    setCurrentMeetingId(null);
    setConnectedPeers([]);
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        // Update video element visibility
        if (localVideoRef.current) {
          localVideoRef.current.style.opacity = videoTrack.enabled ? '1' : '0.3';
        }
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Socket event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    const handleMeetingStarted = (data: { meetingId: string; startedBy: string }) => {
      if (data.startedBy !== user?.id) {
        // Show notification about new meeting
        const shouldJoin = window.confirm(`A video meeting has started. Would you like to join?`);
        if (shouldJoin) {
          handleJoinMeeting(data.meetingId);
        }
      }
    };

    const handleUserJoinedMeeting = (data: { userId: string }) => {
      console.log('User joined meeting:', data.userId);
      // Create peer connection for new user
      createPeerConnection(data.userId);
    };

    const handleUserLeftMeeting = (data: { userId: string }) => {
      console.log('User left meeting:', data.userId);
      // Clean up peer connection
      const peerConnection = peerConnectionsRef.current[data.userId];
      if (peerConnection) {
        peerConnection.close();
        delete peerConnectionsRef.current[data.userId];
      }
      setConnectedPeers(prev => prev.filter(p => p !== data.userId));
    };

    const handleWebRTCOffer = async (data: { offer: RTCSessionDescriptionInit; fromUserId: string }) => {
      const peerConnection = createPeerConnection(data.fromUserId);
      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      sendWebRTCAnswer(answer, data.fromUserId);
    };

    const handleWebRTCAnswer = async (data: { answer: RTCSessionDescriptionInit; fromUserId: string }) => {
      const peerConnection = peerConnectionsRef.current[data.fromUserId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
      }
    };

    const handleWebRTCIceCandidate = async (data: { candidate: RTCIceCandidateInit; fromUserId: string }) => {
      const peerConnection = peerConnectionsRef.current[data.fromUserId];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    socket.on('meeting-started', handleMeetingStarted);
    socket.on('user-joined-meeting', handleUserJoinedMeeting);
    socket.on('user-left-meeting', handleUserLeftMeeting);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);

    return () => {
      socket.off('meeting-started', handleMeetingStarted);
      socket.off('user-joined-meeting', handleUserJoinedMeeting);
      socket.off('user-left-meeting', handleUserLeftMeeting);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
    };
  }, [socket, user?.id]);

  if (!isInCall) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Video Meetings</h1>
            <p className="text-gray-600">Host and join video meetings with club members.</p>
          </div>
          <Button 
            onClick={handleStartMeeting}
            disabled={!isConnected}
          >
            <Video className="w-4 h-4 mr-2" />
            Start Meeting
          </Button>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Meeting</h3>
            <p className="text-gray-600 mb-4">
              Start a video meeting to collaborate with your club members in real-time.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Share your screen and collaborate on projects</p>
              <p>• Face-to-face communication with club members</p>
              <p>• Secure peer-to-peer connections</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Video Meeting</h1>
          <p className="text-gray-600">
            Meeting ID: {currentMeetingId} • {connectedPeers.length + 1} participants
          </p>
        </div>
        <Button 
          variant="destructive"
          onClick={handleLeaveMeeting}
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          Leave Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Video */}
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                <Button 
                  size="sm"
                  variant={isVideoEnabled ? "default" : "destructive"}
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button 
                  size="sm"
                  variant={isAudioEnabled ? "default" : "destructive"}
                  onClick={toggleAudio}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </div>
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                You
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remote Videos */}
        {connectedPeers.map((peerId) => (
          <Card key={peerId}>
            <CardContent className="p-4">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current[peerId] = el;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  Participant {peerId.slice(-6)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Placeholder for more participants */}
        {connectedPeers.length === 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Waiting for others to join...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}