import {
  User,
  Club,
  ClubMembership,
  JoinRequest,
  Announcement,
  Event,
  Task,
  ChatMessage,
  Photo,
  Report,
  isMongoConnected,
} from "./db";
import {
  type User as UserType,
  type UpsertUser,
  type Club as ClubType,
  type ClubMembership as ClubMembershipType,
  type JoinRequest as JoinRequestType,
  type Announcement as AnnouncementType,
  type Event as EventType,
  type Task as TaskType,
  type ChatMessage as ChatMessageType,
  type Photo as PhotoType,
  type Report as ReportType,
  type InsertClub,
  type InsertJoinRequest,
  type InsertAnnouncement,
  type InsertEvent,
  type InsertTask,
  type InsertChatMessage,
  type InsertPhoto,
  type InsertReport,
} from "@shared/schema";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<UserType | undefined>;
  upsertUser(user: UpsertUser): Promise<UserType>;

  // Club operations
  createClub(club: InsertClub): Promise<ClubType>;
  getClub(id: string): Promise<ClubType | undefined>;
  updateClub(id: string, data: Partial<InsertClub>): Promise<ClubType>;
  deleteClub(id: string): Promise<void>;
  getUserClubs(userId: string): Promise<(ClubType & { membership: ClubMembershipType })[]>;
  getClubMembers(clubId: string): Promise<(ClubMembershipType & { user: UserType })[]>;
  isClubAdmin(userId: string, clubId: string): Promise<boolean>;
  getClubAdminCount(clubId: string): Promise<number>;
  
  // Membership operations
  addClubMember(userId: string, clubId: string, role: string): Promise<ClubMembershipType>;
  updateMemberRole(userId: string, clubId: string, role: string): Promise<void>;
  getClubMembership(userId: string, clubId: string): Promise<ClubMembershipType | undefined>;
  removeClubMember(userId: string, clubId: string): Promise<void>;
  
  // Join request operations
  createJoinRequest(request: InsertJoinRequest): Promise<JoinRequestType>;
  getClubJoinRequests(clubId: string): Promise<(JoinRequestType & { user: UserType })[]>;
  updateJoinRequestStatus(requestId: string, status: string): Promise<void>;
  hasActiveJoinRequest(userId: string, clubId: string): Promise<boolean>;
  getJoinRequest(requestId: string): Promise<JoinRequestType | undefined>;
  
  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<AnnouncementType>;
  getClubAnnouncements(clubId: string): Promise<(AnnouncementType & { author: UserType })[]>;
  getAnnouncement(id: string): Promise<AnnouncementType | undefined>;
  updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<AnnouncementType>;
  deleteAnnouncement(id: string): Promise<void>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<EventType>;
  getClubEvents(clubId: string): Promise<(EventType & { creator: UserType })[]>;
  getEvent(id: string): Promise<EventType | undefined>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<EventType>;
  deleteEvent(id: string): Promise<void>;
  
  // Task operations
  createTask(task: InsertTask): Promise<TaskType>;
  getClubTasks(clubId: string): Promise<(TaskType & { creator: UserType; assignee?: UserType })[]>;
  getTask(id: string): Promise<TaskType | undefined>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<TaskType>;
  deleteTask(id: string): Promise<void>;
  updateTaskProgress(taskId: string, progress: number): Promise<void>;
  updateTaskStatus(taskId: string, status: string): Promise<void>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessageType>;
  getClubChatMessages(clubId: string, limit?: number): Promise<(ChatMessageType & { sender: UserType })[]>;
  
  // Photo operations
  createPhoto(photo: any): Promise<any>;
  getClubPhotos(clubId: string): Promise<any[]>;
  getPhoto(id: string): Promise<any | undefined>;
  deletePhoto(id: string): Promise<void>;
  
  // Report operations
  createReport(report: any): Promise<any>;
  getClubReports(clubId: string): Promise<any[]>;
  getReport(id: string): Promise<any | undefined>;
  deleteReport(id: string): Promise<void>;
}

// In-memory storage for development fallback
class MemoryStorage {
  public users: Map<string, UserType> = new Map();
  public clubs: Map<string, ClubType> = new Map();
  public memberships: Map<string, ClubMembershipType> = new Map();
  public joinRequests: Map<string, JoinRequestType> = new Map();
  public announcements: Map<string, AnnouncementType> = new Map();
  public events: Map<string, EventType> = new Map();
  public tasks: Map<string, TaskType> = new Map();
  public chatMessages: Map<string, ChatMessageType> = new Map();

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export class DatabaseStorage implements IStorage {
  private memoryStore = new MemoryStorage();

  private useMemory(): boolean {
    return !isMongoConnected();
  }

  // User operations
  async getUser(id: string): Promise<UserType | undefined> {
    if (this.useMemory()) {
      return this.memoryStore.users.get(id);
    }
    const user = await User.findOne({ id }).lean();
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<UserType> {
    if (this.useMemory()) {
      const user: UserType = {
        ...userData,
        _id: userData.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserType;
      this.memoryStore.users.set(userData.id, user);
      return user;
    }
    const user = await User.findOneAndUpdate(
      { id: userData.id },
      { ...userData, updatedAt: new Date() },
      { new: true, upsert: true, lean: true }
    );
    return user!;
  }

  // Club operations
  async createClub(club: InsertClub): Promise<ClubType> {
    if (this.useMemory()) {
      const clubId = this.memoryStore.generateId();
      const newClub: ClubType = {
        ...club,
        _id: clubId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ClubType;
      this.memoryStore.clubs.set(clubId, newClub);
      
      // Add creator as admin member
      const membershipId = this.memoryStore.generateId();
      const membership: ClubMembershipType = {
        _id: membershipId,
        userId: club.createdBy,
        clubId: clubId,
        role: "admin",
        status: "active",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ClubMembershipType;
      this.memoryStore.memberships.set(membershipId, membership);
      
      return newClub;
    }
    
    const newClub = await Club.create(club);
    
    // Add creator as admin member
    await ClubMembership.create({
      userId: club.createdBy,
      clubId: newClub._id.toString(),
      role: "admin",
      status: "active",
    });
    
    return newClub.toObject();
  }

  async getClub(id: string): Promise<ClubType | undefined> {
    if (this.useMemory()) {
      return this.memoryStore.clubs.get(id);
    }
    const club = await Club.findById(id).lean();
    return club || undefined;
  }

  async getUserClubs(userId: string): Promise<(ClubType & { membership: ClubMembershipType })[]> {
    if (this.useMemory()) {
      const userMemberships = Array.from(this.memoryStore.memberships.values())
        .filter(m => m.userId === userId && m.status === "active");
      
      return userMemberships.map(membership => {
        const club = this.memoryStore.clubs.get(membership.clubId);
        return club ? { ...club, membership } : null;
      }).filter(Boolean) as (ClubType & { membership: ClubMembershipType })[];
    }
    
    const memberships = await ClubMembership.find({
      userId,
      status: "active"
    }).lean();
    
    // Get clubs manually to avoid ObjectId casting issues
    const clubIds = memberships.map(m => m.clubId);
    const clubs = await Club.find({ _id: { $in: clubIds } }).lean();
    
    return memberships.map(membership => {
      const club = clubs.find(c => c._id.toString() === membership.clubId);
      return club ? { ...club, membership } : null;
    }).filter(Boolean) as (ClubType & { membership: ClubMembershipType })[];
  }

  async getClubMembers(clubId: string): Promise<(ClubMembershipType & { user: UserType })[]> {
    if (this.useMemory()) {
      const clubMemberships = Array.from(this.memoryStore.memberships.values())
        .filter(m => m.clubId === clubId && m.status === "active");
      
      return clubMemberships.map(membership => {
        const user = this.memoryStore.users.get(membership.userId);
        return user ? { ...membership, user } : null;
      }).filter(Boolean) as (ClubMembershipType & { user: UserType })[];
    }
    
    try {
      const memberships = await ClubMembership.find({
        clubId,
        status: "active"
      }).lean();
      
      // Get users manually to avoid ObjectId casting issues with refs
      const userIds = memberships.map(m => m.userId);
      const users = await User.find({ id: { $in: userIds } }).lean(); // Use 'id' field, not '_id'
      
      return memberships.map(membership => {
        const user = users.find(u => u.id === membership.userId);
        return user ? { ...membership, user } : null;
      }).filter(Boolean) as (ClubMembershipType & { user: UserType })[];
    } catch (error) {
      console.error('Error fetching club members:', error);
      return [];
    }
  }

  async isClubAdmin(userId: string, clubId: string): Promise<boolean> {
    if (this.useMemory()) {
      const membership = Array.from(this.memoryStore.memberships.values())
        .find(m => m.userId === userId && m.clubId === clubId && m.role === "admin" && m.status === "active");
      return !!membership;
    }
    
    const membership = await ClubMembership.findOne({
      userId,
      clubId,
      role: "admin",
      status: "active"
    }).lean();
    
    return !!membership;
  }

  async updateClub(id: string, data: Partial<InsertClub>): Promise<ClubType> {
    if (this.useMemory()) {
      const club = this.memoryStore.clubs.get(id);
      if (club) {
        Object.assign(club, data, { updatedAt: new Date() });
        return club;
      }
      throw new Error('Club not found');
    }
    const updatedClub = await Club.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true }).lean();
    if (!updatedClub) throw new Error('Club not found');
    return updatedClub;
  }

  async deleteClub(id: string): Promise<void> {
    if (this.useMemory()) {
      this.memoryStore.clubs.delete(id);
      // Also clean up related data
      Array.from(this.memoryStore.memberships.keys()).forEach(key => {
        const membership = this.memoryStore.memberships.get(key);
        if (membership?.clubId === id) {
          this.memoryStore.memberships.delete(key);
        }
      });
      return;
    }
    await Club.findByIdAndDelete(id);
    await ClubMembership.deleteMany({ clubId: id });
    await Announcement.deleteMany({ clubId: id });
    await Event.deleteMany({ clubId: id });
    await Task.deleteMany({ clubId: id });
    await ChatMessage.deleteMany({ clubId: id });
    await Photo.deleteMany({ clubId: id });
    await Report.deleteMany({ clubId: id });
  }

  async getClubAdminCount(clubId: string): Promise<number> {
    if (this.useMemory()) {
      return Array.from(this.memoryStore.memberships.values())
        .filter(m => m.clubId === clubId && m.role === "admin" && m.status === "active").length;
    }
    return await ClubMembership.countDocuments({
      clubId,
      role: "admin",
      status: "active"
    });
  }

  // Membership operations
  async addClubMember(userId: string, clubId: string, role: string): Promise<ClubMembershipType> {
    if (this.useMemory()) {
      const membershipId = this.memoryStore.generateId();
      const membership: ClubMembershipType = {
        _id: membershipId,
        userId,
        clubId,
        role: role as "admin" | "member",
        status: "active",
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ClubMembershipType;
      this.memoryStore.memberships.set(membershipId, membership);
      return membership;
    }
    
    const membership = await ClubMembership.create({
      userId,
      clubId,
      role,
      status: "active",
    });
    
    return membership.toObject();
  }

  async updateMemberRole(userId: string, clubId: string, role: string): Promise<void> {
    if (this.useMemory()) {
      const membership = Array.from(this.memoryStore.memberships.values())
        .find(m => m.userId === userId && m.clubId === clubId);
      if (membership) {
        membership.role = role as "admin" | "member";
        membership.updatedAt = new Date();
      }
      return;
    }
    await ClubMembership.updateOne(
      { userId, clubId },
      { role, updatedAt: new Date() }
    );
  }

  async getClubMembership(userId: string, clubId: string): Promise<ClubMembershipType | undefined> {
    if (this.useMemory()) {
      return Array.from(this.memoryStore.memberships.values())
        .find(m => m.userId === userId && m.clubId === clubId && m.status === "active");
    }
    const membership = await ClubMembership.findOne({
      userId,
      clubId,
      status: "active"
    }).lean();
    return membership || undefined;
  }

  async removeClubMember(userId: string, clubId: string): Promise<void> {
    if (this.useMemory()) {
      const membershipKey = Array.from(this.memoryStore.memberships.keys())
        .find(key => {
          const membership = this.memoryStore.memberships.get(key);
          return membership?.userId === userId && membership?.clubId === clubId;
        });
      if (membershipKey) {
        this.memoryStore.memberships.delete(membershipKey);
      }
      return;
    }
    await ClubMembership.deleteOne({ userId, clubId });
  }

  // Join request operations
  async createJoinRequest(request: InsertJoinRequest): Promise<JoinRequestType> {
    if (this.useMemory()) {
      const requestId = this.memoryStore.generateId();
      const newRequest: JoinRequestType = {
        ...request,
        _id: requestId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as JoinRequestType;
      this.memoryStore.joinRequests.set(requestId, newRequest);
      return newRequest;
    }
    const joinRequest = await JoinRequest.create(request);
    return joinRequest.toObject();
  }

  async getClubJoinRequests(clubId: string): Promise<(JoinRequestType & { user: UserType })[]> {
    if (this.useMemory()) {
      const clubRequests = Array.from(this.memoryStore.joinRequests.values())
        .filter(r => r.clubId === clubId && r.status === "pending")
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      return clubRequests.map(request => {
        const user = this.memoryStore.users.get(request.userId);
        return user ? { ...request, user } : null;
      }).filter(Boolean) as (JoinRequestType & { user: UserType })[];
    }
    
    const requests = await JoinRequest.find({
      clubId,
      status: "pending"
    })
    .sort({ createdAt: -1 })
    .lean();
    
    // Get users manually to avoid ObjectId casting issues
    const userIds = requests.map(r => r.userId);
    const users = await User.find({ id: { $in: userIds } }).lean();
    
    return requests.map(request => {
      const user = users.find(u => u.id === request.userId);
      return user ? { ...request, user } : null;
    }).filter(Boolean) as (JoinRequestType & { user: UserType })[];
  }

  async updateJoinRequestStatus(requestId: string, status: string): Promise<void> {
    if (this.useMemory()) {
      const request = this.memoryStore.joinRequests.get(requestId);
      if (request) {
        request.status = status as "pending" | "approved" | "rejected";
        request.updatedAt = new Date();
      }
      return;
    }
    await JoinRequest.updateOne(
      { _id: requestId },
      { status, updatedAt: new Date() }
    );
  }

  async hasActiveJoinRequest(userId: string, clubId: string): Promise<boolean> {
    if (this.useMemory()) {
      const request = Array.from(this.memoryStore.joinRequests.values())
        .find(r => r.userId === userId && r.clubId === clubId && r.status === "pending");
      return !!request;
    }
    
    const request = await JoinRequest.findOne({
      userId,
      clubId,
      status: "pending"
    }).lean();
    
    return !!request;
  }

  async getJoinRequest(requestId: string): Promise<JoinRequestType | undefined> {
    if (this.useMemory()) {
      return this.memoryStore.joinRequests.get(requestId);
    }
    const request = await JoinRequest.findById(requestId).lean();
    return request || undefined;
  }

  // Announcement operations
  async createAnnouncement(announcement: InsertAnnouncement): Promise<AnnouncementType> {
    if (this.useMemory()) {
      const announcementId = this.memoryStore.generateId();
      const newAnnouncement: AnnouncementType = {
        ...announcement,
        _id: announcementId,
        priority: announcement.priority || "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AnnouncementType;
      this.memoryStore.announcements.set(announcementId, newAnnouncement);
      return newAnnouncement;
    }
    const newAnnouncement = await Announcement.create(announcement);
    return newAnnouncement.toObject();
  }

  async getClubAnnouncements(clubId: string): Promise<(AnnouncementType & { author: UserType })[]> {
    if (this.useMemory()) {
      const clubAnnouncements = Array.from(this.memoryStore.announcements.values())
        .filter(a => a.clubId === clubId)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      return clubAnnouncements.map(announcement => {
        const author = this.memoryStore.users.get(announcement.authorId);
        return author ? { ...announcement, author } : null;
      }).filter(Boolean) as (AnnouncementType & { author: UserType })[];
    }
    
    const announcements = await Announcement.find({ clubId })
    .sort({ createdAt: -1 })
    .lean();
    
    // Get authors manually to avoid ObjectId casting issues
    const authorIds = announcements.map(a => a.authorId);
    const authors = await User.find({ id: { $in: authorIds } }).lean();
    
    return announcements.map(announcement => {
      const author = authors.find(u => u.id === announcement.authorId);
      return author ? { ...announcement, author } : null;
    }).filter(Boolean) as (AnnouncementType & { author: UserType })[];
  }

  async getAnnouncement(id: string): Promise<AnnouncementType | undefined> {
    if (this.useMemory()) {
      return this.memoryStore.announcements.get(id);
    }
    const announcement = await Announcement.findById(id).lean();
    return announcement || undefined;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<AnnouncementType> {
    if (this.useMemory()) {
      const announcement = this.memoryStore.announcements.get(id);
      if (announcement) {
        Object.assign(announcement, data, { updatedAt: new Date() });
        return announcement;
      }
      throw new Error('Announcement not found');
    }
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true }).lean();
    if (!updatedAnnouncement) throw new Error('Announcement not found');
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    if (this.useMemory()) {
      this.memoryStore.announcements.delete(id);
      return;
    }
    await Announcement.findByIdAndDelete(id);
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<EventType> {
    if (this.useMemory()) {
      const eventId = this.memoryStore.generateId();
      const newEvent: EventType = {
        ...event,
        _id: eventId,
        isRecurring: event.isRecurring || false,
        status: event.status || "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as EventType;
      this.memoryStore.events.set(eventId, newEvent);
      return newEvent;
    }
    const newEvent = await Event.create(event);
    return newEvent.toObject();
  }

  async getClubEvents(clubId: string): Promise<(EventType & { creator: UserType })[]> {
    if (this.useMemory()) {
      const clubEvents = Array.from(this.memoryStore.events.values())
        .filter(e => e.clubId === clubId)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      
      return clubEvents.map(event => {
        const creator = this.memoryStore.users.get(event.createdBy);
        return creator ? { ...event, creator } : null;
      }).filter(Boolean) as (EventType & { creator: UserType })[];
    }
    
    const events = await Event.find({ clubId })
    .sort({ startDate: 1 })
    .lean();
    
    // Get creators manually to avoid ObjectId casting issues
    const creatorIds = events.map(e => e.createdBy);
    const creators = await User.find({ id: { $in: creatorIds } }).lean();
    
    return events.map(event => {
      const creator = creators.find(u => u.id === event.createdBy);
      return creator ? { ...event, creator } : null;
    }).filter(Boolean) as (EventType & { creator: UserType })[];
  }

  async getEvent(id: string): Promise<EventType | undefined> {
    if (this.useMemory()) {
      return this.memoryStore.events.get(id);
    }
    const event = await Event.findById(id).lean();
    return event || undefined;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<EventType> {
    if (this.useMemory()) {
      const event = this.memoryStore.events.get(id);
      if (event) {
        Object.assign(event, data, { updatedAt: new Date() });
        return event;
      }
      throw new Error('Event not found');
    }
    const updatedEvent = await Event.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true }).lean();
    if (!updatedEvent) throw new Error('Event not found');
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    if (this.useMemory()) {
      this.memoryStore.events.delete(id);
      return;
    }
    await Event.findByIdAndDelete(id);
  }

  // Task operations
  async createTask(task: InsertTask): Promise<TaskType> {
    if (this.useMemory()) {
      const taskId = this.memoryStore.generateId();
      const newTask: TaskType = {
        ...task,
        _id: taskId,
        status: task.status || "pending",
        priority: task.priority || "medium",
        progress: task.progress || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TaskType;
      this.memoryStore.tasks.set(taskId, newTask);
      return newTask;
    }
    const newTask = await Task.create(task);
    return newTask.toObject();
  }

  async getClubTasks(clubId: string): Promise<(TaskType & { creator: UserType; assignee?: UserType })[]> {
    if (this.useMemory()) {
      const clubTasks = Array.from(this.memoryStore.tasks.values())
        .filter(t => t.clubId === clubId)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      return clubTasks.map(task => {
        const creator = this.memoryStore.users.get(task.createdBy);
        const assignee = task.assignedTo ? this.memoryStore.users.get(task.assignedTo) : undefined;
        return creator ? { ...task, creator, assignee } : null;
      }).filter(Boolean) as (TaskType & { creator: UserType; assignee?: UserType })[];
    }
    
    const tasks = await Task.find({ clubId })
    .sort({ createdAt: -1 })
    .lean();
    
    // Get creators and assignees manually to avoid ObjectId casting issues
    const creatorIds = tasks.map(t => t.createdBy);
    const assigneeIds = tasks.map(t => t.assignedTo).filter(Boolean);
    const allUserIds = Array.from(new Set([...creatorIds, ...assigneeIds]));
    const users = await User.find({ id: { $in: allUserIds } }).lean();
    
    return tasks.map(task => {
      const creator = users.find(u => u.id === task.createdBy);
      const assignee = task.assignedTo ? users.find(u => u.id === task.assignedTo) : undefined;
      return creator ? { ...task, creator, assignee } : null;
    }).filter(Boolean) as (TaskType & { creator: UserType; assignee?: UserType })[];
  }

  async getTask(id: string): Promise<TaskType | undefined> {
    if (this.useMemory()) {
      return this.memoryStore.tasks.get(id);
    }
    const task = await Task.findById(id).lean();
    return task || undefined;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<TaskType> {
    if (this.useMemory()) {
      const task = this.memoryStore.tasks.get(id);
      if (task) {
        Object.assign(task, data, { updatedAt: new Date() });
        return task;
      }
      throw new Error('Task not found');
    }
    const updatedTask = await Task.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true }).lean();
    if (!updatedTask) throw new Error('Task not found');
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    if (this.useMemory()) {
      this.memoryStore.tasks.delete(id);
      return;
    }
    await Task.findByIdAndDelete(id);
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    if (this.useMemory()) {
      const task = this.memoryStore.tasks.get(taskId);
      if (task) {
        task.progress = progress;
        task.updatedAt = new Date();
      }
      return;
    }
    await Task.updateOne(
      { _id: taskId },
      { progress, updatedAt: new Date() }
    );
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    if (this.useMemory()) {
      const task = this.memoryStore.tasks.get(taskId);
      if (task) {
        task.status = status as "pending" | "in_progress" | "completed" | "cancelled";
        task.updatedAt = new Date();
      }
      return;
    }
    await Task.updateOne(
      { _id: taskId },
      { status, updatedAt: new Date() }
    );
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessageType> {
    if (this.useMemory()) {
      const messageId = this.memoryStore.generateId();
      const newMessage: ChatMessageType = {
        ...message,
        _id: messageId,
        messageType: message.messageType || "text",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ChatMessageType;
      this.memoryStore.chatMessages.set(messageId, newMessage);
      return newMessage;
    }
    const newMessage = await ChatMessage.create(message);
    return newMessage.toObject();
  }

  async getClubChatMessages(clubId: string, limit = 50): Promise<(ChatMessageType & { sender: UserType })[]> {
    if (this.useMemory()) {
      const clubMessages = Array.from(this.memoryStore.chatMessages.values())
        .filter(m => m.clubId === clubId)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
        .slice(0, limit);
      
      return clubMessages.map(message => {
        const sender = this.memoryStore.users.get(message.senderId);
        return sender ? { ...message, sender } : null;
      }).filter(Boolean) as (ChatMessageType & { sender: UserType })[];
    }
    
    const messages = await ChatMessage.find({ clubId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
    
    // Get senders manually to avoid ObjectId casting issues
    const senderIds = messages.map(m => m.senderId);
    const senders = await User.find({ id: { $in: senderIds } }).lean();
    
    return messages.map(message => {
      const sender = senders.find(u => u.id === message.senderId);
      return sender ? { ...message, sender } : null;
    }).filter(Boolean) as (ChatMessageType & { sender: UserType })[];
  }

  // Photo operations
  async createPhoto(photo: any): Promise<any> {
    if (this.useMemory()) {
      const photoId = this.memoryStore.generateId();
      const newPhoto = {
        ...photo,
        _id: photoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return newPhoto;
    }
    const newPhoto = await Photo.create(photo);
    return newPhoto.toObject();
  }

  async getClubPhotos(clubId: string): Promise<any[]> {
    if (this.useMemory()) {
      return [];
    }
    const photos = await Photo.find({ clubId })
    .sort({ createdAt: -1 })
    .lean();
    
    // Get uploaders manually to avoid ObjectId casting issues
    const uploaderIds = photos.map(p => p.uploadedBy);
    const uploaders = await User.find({ id: { $in: uploaderIds } }).lean();
    
    return photos.map(photo => {
      const uploadedBy = uploaders.find(u => u.id === photo.uploadedBy);
      return uploadedBy ? { ...photo, uploadedBy } : { ...photo, uploadedBy: { email: 'Unknown User' } };
    });
  }

  async getPhoto(id: string): Promise<any | undefined> {
    if (this.useMemory()) {
      return undefined; // Memory storage doesn't store photos
    }
    const photo = await Photo.findById(id).lean();
    return photo || undefined;
  }

  async deletePhoto(id: string): Promise<void> {
    if (this.useMemory()) {
      return; // Memory storage doesn't store photos
    }
    await Photo.findByIdAndDelete(id);
  }

  // Report operations
  async createReport(report: any): Promise<any> {
    if (this.useMemory()) {
      const reportId = this.memoryStore.generateId();
      const newReport = {
        ...report,
        _id: reportId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return newReport;
    }
    const newReport = await Report.create(report);
    return newReport.toObject();
  }

  async getClubReports(clubId: string): Promise<any[]> {
    if (this.useMemory()) {
      return [];
    }
    const reports = await Report.find({ clubId })
    .sort({ createdAt: -1 })
    .lean();
    
    // Get uploaders manually to avoid ObjectId casting issues
    const uploaderIds = reports.map(r => r.uploadedBy);
    const uploaders = await User.find({ id: { $in: uploaderIds } }).lean();
    
    return reports.map(report => {
      const uploadedBy = uploaders.find(u => u.id === report.uploadedBy);
      return uploadedBy ? { ...report, uploadedBy } : { ...report, uploadedBy: { email: 'Unknown User' } };
    });
  }

  async getReport(id: string): Promise<any | undefined> {
    if (this.useMemory()) {
      return undefined; // Memory storage doesn't store reports
    }
    const report = await Report.findById(id).lean();
    return report || undefined;
  }

  async deleteReport(id: string): Promise<void> {
    if (this.useMemory()) {
      return; // Memory storage doesn't store reports
    }
    await Report.findByIdAndDelete(id);
  }
}

export const storage = new DatabaseStorage();