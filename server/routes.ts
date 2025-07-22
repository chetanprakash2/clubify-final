import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./googleAuth";
import {
  insertClubSchema,
  updateClubSchema,
  insertJoinRequestSchema,
  insertAnnouncementSchema,
  insertEventSchema,
  insertTaskSchema,
  insertChatMessageSchema,
  insertPhotoSchema,
  insertReportSchema
} from "@shared/schema";
import { uploadPhoto, uploadDocument, getFileUrl } from "./upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Club routes
  app.post('/api/clubs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubData = insertClubSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const club = await storage.createClub(clubData);
      res.json(club);
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(500).json({ message: "Failed to create club" });
    }
  });

  app.get('/api/clubs/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubs = await storage.getUserClubs(userId);
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching user clubs:", error);
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  app.get('/api/clubs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id; // Use string ID for MongoDB
      const club = await storage.getClub(clubId);
      
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      
      res.json(club);
    } catch (error) {
      console.error("Error fetching club:", error);
      res.status(500).json({ message: "Failed to fetch club" });
    }
  });

  app.get('/api/clubs/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id; // Use string ID for MongoDB
      const members = await storage.getClubMembers(clubId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching club members:", error);
      res.status(500).json({ message: "Failed to fetch club members" });
    }
  });

  // Club settings routes
  app.patch('/api/clubs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is admin
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can update club settings" });
      }
      
      const updateData = updateClubSchema.parse(req.body);
      const updatedClub = await storage.updateClub(clubId, updateData);
      
      res.json(updatedClub);
    } catch (error) {
      console.error("Error updating club:", error);
      res.status(500).json({ message: "Failed to update club" });
    }
  });

  // Generate invite code
  app.post('/api/clubs/:id/invite-code', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is admin
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can generate invite codes" });
      }
      
      const inviteCode = await storage.generateInviteCode(clubId);
      res.json({ inviteCode });
    } catch (error) {
      console.error("Error generating invite code:", error);
      res.status(500).json({ message: "Failed to generate invite code" });
    }
  });

  // Join club via invite code
  app.post('/api/clubs/join/:inviteCode', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { inviteCode } = req.params;
      
      // Find club by invite code
      const club = await storage.getClubByInviteCode(inviteCode);
      if (!club) {
        return res.status(404).json({ message: "Invalid invite code" });
      }
      
      // Check if user is already a member
      const existingMembership = await storage.getClubMembership(userId, club._id);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already a member of this club" });
      }
      
      // Add user as member
      await storage.addClubMember(userId, club._id, "member");
      
      res.json({ message: "Successfully joined club", club });
    } catch (error) {
      console.error("Error joining club via invite:", error);
      res.status(500).json({ message: "Failed to join club" });
    }
  });

  // Get public clubs for explore page
  app.get('/api/clubs/public', isAuthenticated, async (req: any, res) => {
    try {
      const clubs = await storage.getPublicClubs();
      res.json(clubs);
    } catch (error) {
      console.error("Error fetching public clubs:", error);
      res.status(500).json({ message: "Failed to fetch public clubs" });
    }
  });

  // Join request routes
  app.post('/api/clubs/:id/join-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id; // Use string ID for MongoDB
      
      // Check if user already has an active request
      const hasActiveRequest = await storage.hasActiveJoinRequest(userId, clubId);
      if (hasActiveRequest) {
        return res.status(400).json({ message: "You already have a pending request for this club" });
      }
      
      const requestData = insertJoinRequestSchema.parse({
        ...req.body,
        userId,
        clubId,
      });
      
      const joinRequest = await storage.createJoinRequest(requestData);
      res.json(joinRequest);
    } catch (error) {
      console.error("Error creating join request:", error);
      res.status(500).json({ message: "Failed to create join request" });
    }
  });

  app.get('/api/clubs/:id/join-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id; // Use string ID for MongoDB
      
      // Check if user is admin
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can view join requests" });
      }
      
      const requests = await storage.getClubJoinRequests(clubId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      res.status(500).json({ message: "Failed to fetch join requests" });
    }
  });

  app.patch('/api/join-requests/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestId = req.params.id;
      
      // Get the join request to check club permissions
      const joinRequest = await storage.getJoinRequest(requestId);
      if (!joinRequest) {
        return res.status(404).json({ message: "Join request not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, joinRequest.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can approve join requests" });
      }
      
      // Update request status to approved
      await storage.updateJoinRequestStatus(requestId, "approved");
      
      // Add user as member
      await storage.addClubMember(joinRequest.userId, joinRequest.clubId, "member");
      
      res.json({ message: "Join request approved" });
    } catch (error) {
      console.error("Error approving join request:", error);
      res.status(500).json({ message: "Failed to approve join request" });
    }
  });

  app.patch('/api/join-requests/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestId = req.params.id;
      
      // Get the join request to check club permissions
      const joinRequest = await storage.getJoinRequest(requestId);
      if (!joinRequest) {
        return res.status(404).json({ message: "Join request not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, joinRequest.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can reject join requests" });
      }
      
      // Update request status to rejected
      await storage.updateJoinRequestStatus(requestId, "rejected");
      
      res.json({ message: "Join request rejected" });
    } catch (error) {
      console.error("Error rejecting join request:", error);
      res.status(500).json({ message: "Failed to reject join request" });
    }
  });

  // Announcement routes
  app.post('/api/clubs/:id/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is admin
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can create announcements" });
      }
      
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        clubId,
        authorId: userId,
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.get('/api/clubs/:id/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id;
      const announcements = await storage.getClubAnnouncements(clubId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.patch('/api/announcements/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const announcementId = req.params.id;
      
      // Get announcement to check permissions
      const announcement = await storage.getAnnouncement(announcementId);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, announcement.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can edit announcements" });
      }
      
      const updatedAnnouncement = await storage.updateAnnouncement(announcementId, req.body);
      res.json(updatedAnnouncement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.delete('/api/announcements/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const announcementId = req.params.id;
      
      // Get announcement to check permissions
      const announcement = await storage.getAnnouncement(announcementId);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, announcement.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can delete announcements" });
      }
      
      await storage.deleteAnnouncement(announcementId);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Event routes
  app.post('/api/clubs/:id/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is admin
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can create events" });
      }
      
      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.startDate) {
        requestData.startDate = new Date(requestData.startDate);
      }
      if (requestData.endDate) {
        requestData.endDate = new Date(requestData.endDate);
      }
      if (requestData.dueDate) {
        requestData.dueDate = new Date(requestData.dueDate);
      }
      
      const eventData = insertEventSchema.parse({
        ...requestData,
        clubId,
        createdBy: userId,
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.get('/api/clubs/:id/events', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id;
      const events = await storage.getClubEvents(clubId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.patch('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const eventId = req.params.id;
      
      // Get event to check permissions
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, event.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can edit events" });
      }
      
      // Convert date strings to Date objects if provided
      const requestData = { ...req.body };
      if (requestData.startDate) {
        requestData.startDate = new Date(requestData.startDate);
      }
      if (requestData.endDate) {
        requestData.endDate = new Date(requestData.endDate);
      }
      
      const updatedEvent = await storage.updateEvent(eventId, requestData);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const eventId = req.params.id;
      
      // Get event to check permissions
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, event.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can delete events" });
      }
      
      await storage.deleteEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Task routes
  app.post('/api/clubs/:id/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is admin
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can create tasks" });
      }
      
      // Convert date strings to Date objects before validation
      const requestData = { ...req.body };
      if (requestData.dueDate) {
        requestData.dueDate = new Date(requestData.dueDate);
      }
      
      const taskData = insertTaskSchema.parse({
        ...requestData,
        clubId,
        createdBy: userId,
      });
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/clubs/:id/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id;
      const tasks = await storage.getClubTasks(clubId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.patch('/api/tasks/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const taskId = req.params.id; // Use string ID for MongoDB
      const { status } = req.body;
      
      await storage.updateTaskStatus(taskId, status);
      res.json({ message: "Task status updated" });
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      
      // Get task to check permissions
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, task.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can edit tasks" });
      }
      
      // Convert date strings to Date objects if provided
      const requestData = { ...req.body };
      if (requestData.dueDate) {
        requestData.dueDate = new Date(requestData.dueDate);
      }
      
      const updatedTask = await storage.updateTask(taskId, requestData);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      
      // Get task to check permissions
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, task.clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can delete tasks" });
      }
      
      await storage.deleteTask(taskId);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Chat routes
  app.post('/api/clubs/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id; // Use string ID for MongoDB
      
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        clubId,
        senderId: userId,
      });
      
      const message = await storage.createChatMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  app.get('/api/clubs/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id; // Use string ID for MongoDB
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const messages = await storage.getClubChatMessages(clubId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup Socket.io for real-time chat and WebRTC signaling
  const io = new SocketIOServer(httpServer, {
    path: '/ws',
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Join club room for real-time chat
    socket.on('join-club', (clubId: string) => {
      socket.join(`club-${clubId}`);
      console.log(`User ${socket.id} joined club ${clubId}`);
    });

    // Leave club room
    socket.on('leave-club', (clubId: string) => {
      socket.leave(`club-${clubId}`);
      console.log(`User ${socket.id} left club ${clubId}`);
    });

    // Handle new chat messages
    socket.on('send-message', async (data: { clubId: string; message: string; userId: string }) => {
      try {
        const messageData = insertChatMessageSchema.parse({
          clubId: data.clubId,
          senderId: data.userId,
          content: data.message,
          messageType: 'text'
        });
        
        const newMessage = await storage.createChatMessage(messageData);
        const user = await storage.getUser(data.userId);
        
        const messageWithUser = {
          ...newMessage,
          sender: user
        };
        
        // Emit to all users in the club room
        io.to(`club-${data.clubId}`).emit('new-message', messageWithUser);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });



    // WebRTC signaling for video meetings
    socket.on('webrtc-offer', (data: { clubId: string; offer: any; targetUserId?: string }) => {
      if (data.targetUserId) {
        // Direct message to specific user
        socket.to(`club-${data.clubId}`).emit('webrtc-offer', {
          offer: data.offer,
          fromUserId: socket.id
        });
      } else {
        // Broadcast to all users in club
        socket.to(`club-${data.clubId}`).emit('webrtc-offer', {
          offer: data.offer,
          fromUserId: socket.id
        });
      }
    });

    socket.on('webrtc-answer', (data: { clubId: string; answer: any; targetUserId: string }) => {
      socket.to(`club-${data.clubId}`).emit('webrtc-answer', {
        answer: data.answer,
        fromUserId: socket.id
      });
    });

    socket.on('webrtc-ice-candidate', (data: { clubId: string; candidate: any; targetUserId?: string }) => {
      socket.to(`club-${data.clubId}`).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        fromUserId: socket.id
      });
    });

    // Video meeting room management
    socket.on('start-meeting', (data: { clubId: string; meetingId: string }) => {
      socket.to(`club-${data.clubId}`).emit('meeting-started', {
        meetingId: data.meetingId,
        startedBy: socket.id
      });
    });

    socket.on('join-meeting', (data: { clubId: string; meetingId: string }) => {
      socket.join(`meeting-${data.meetingId}`);
      socket.to(`meeting-${data.meetingId}`).emit('user-joined-meeting', {
        userId: socket.id
      });
    });

    socket.on('leave-meeting', (data: { meetingId: string }) => {
      socket.to(`meeting-${data.meetingId}`).emit('user-left-meeting', {
        userId: socket.id
      });
      socket.leave(`meeting-${data.meetingId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Photo and Report upload routes (moved outside of Socket.io handler)
  app.post('/api/clubs/:id/photos/upload', isAuthenticated, uploadPhoto.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const { title, description, category } = req.body;
      
      const photoData = insertPhotoSchema.parse({
        clubId,
        uploadedBy: userId,
        title: title || file.originalname,
        description,
        imageUrl: getFileUrl(file),
        category: category || 'general',
      });
      
      const photo = await storage.createPhoto(photoData);
      res.json(photo);
    } catch (error) {
      console.error("Error uploading photo:", error);
      // Check if it's a validation error
      if (error && typeof error === 'object' && 'issues' in error) {
        return res.status(400).json({ 
          success: false,
          message: "Validation failed",
          error: "Invalid photo data provided"
        });
      }
      res.status(500).json({ 
        success: false,
        message: "Failed to upload photo",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get('/api/clubs/:id/photos', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id;
      const photos = await storage.getClubPhotos(clubId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.delete('/api/photos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const photoId = req.params.id;
      
      // Get photo to check permissions
      const photo = await storage.getPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Check if user is admin of the club or uploaded the photo
      const isAdmin = await storage.isClubAdmin(userId, photo.clubId);
      const isUploader = photo.uploadedBy === userId;
      
      if (!isAdmin && !isUploader) {
        return res.status(403).json({ message: "Only admins or the uploader can delete photos" });
      }
      
      await storage.deletePhoto(photoId);
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });
  
  app.post('/api/clubs/:id/reports/upload', isAuthenticated, uploadDocument.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No document file provided" });
      }
      
      const { title, description, category } = req.body;
      
      const reportData = insertReportSchema.parse({
        clubId,
        uploadedBy: userId,
        title: title || file.originalname,
        description,
        fileUrl: getFileUrl(file),
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        category: category || 'general',
      });
      
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Error uploading report:", error);
      // Check if it's a validation error
      if (error && typeof error === 'object' && 'issues' in error) {
        return res.status(400).json({ 
          success: false,
          message: "Validation failed",
          error: "Invalid report data provided"
        });
      }
      res.status(500).json({ 
        success: false,
        message: "Failed to upload report",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get('/api/clubs/:id/reports', isAuthenticated, async (req: any, res) => {
    try {
      const clubId = req.params.id;
      const reports = await storage.getClubReports(clubId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.delete('/api/reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reportId = req.params.id;
      
      // Get report to check permissions
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Check if user is admin of the club or uploaded the report
      const isAdmin = await storage.isClubAdmin(userId, report.clubId);
      const isUploader = report.uploadedBy === userId;
      
      if (!isAdmin && !isUploader) {
        return res.status(403).json({ message: "Only admins or the uploader can delete reports" });
      }
      
      await storage.deleteReport(reportId);
      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Club management routes
  app.patch('/api/clubs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can edit club details" });
      }
      
      const updatedClub = await storage.updateClub(clubId, req.body);
      res.json(updatedClub);
    } catch (error) {
      console.error("Error updating club:", error);
      res.status(500).json({ message: "Failed to update club" });
    }
  });

  app.delete('/api/clubs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is admin of the club
      const isAdmin = await storage.isClubAdmin(userId, clubId);
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can delete clubs" });
      }
      
      // Check if user is the only admin (prevent deletion if they're the only admin)
      const adminCount = await storage.getClubAdminCount(clubId);
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete club with only one admin. Add another admin first." });
      }
      
      await storage.deleteClub(clubId);
      res.json({ message: "Club deleted successfully" });
    } catch (error) {
      console.error("Error deleting club:", error);
      res.status(500).json({ message: "Failed to delete club" });
    }
  });

  app.post('/api/clubs/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clubId = req.params.id;
      
      // Check if user is a member
      const membership = await storage.getClubMembership(userId, clubId);
      if (!membership) {
        return res.status(404).json({ message: "You are not a member of this club" });
      }
      
      // If user is admin, check if they're the only admin
      if (membership.role === 'admin') {
        const adminCount = await storage.getClubAdminCount(clubId);
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot leave club as the only admin. Add another admin first." });
        }
      }
      
      await storage.removeClubMember(userId, clubId);
      res.json({ message: "Successfully left the club" });
    } catch (error) {
      console.error("Error leaving club:", error);
      res.status(500).json({ message: "Failed to leave club" });
    }
  });

  return httpServer;
}
