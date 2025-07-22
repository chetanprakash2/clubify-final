import { Schema, Document } from "mongoose";
import { z } from "zod";

// Base interface for all documents
export interface BaseDocument extends Document {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User interfaces
export interface IUser extends BaseDocument {
  id: string; // Replit user ID
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Club interfaces
export interface IClub extends BaseDocument {
  name: string;
  description?: string;
  createdBy: string; // User ID
  displayPictureUrl?: string;
  isPublic: boolean; // Whether club is visible in explore page
  inviteCode?: string; // Unique code for private club invites
}

// Club Membership interfaces
export interface IClubMembership extends BaseDocument {
  userId: string;
  clubId: string;
  role: "admin" | "member";
  status: "active" | "pending" | "rejected";
  joinedAt?: Date;
}

// Join Request interfaces
export interface IJoinRequest extends BaseDocument {
  userId: string;
  clubId: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
}

// Announcement interfaces
export interface IAnnouncement extends BaseDocument {
  clubId: string;
  authorId: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
}

// Event interfaces
export interface IEvent extends BaseDocument {
  clubId: string;
  createdBy: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isRecurring: boolean;
  status: "draft" | "published" | "cancelled";
}

// Task interfaces
export interface ITask extends BaseDocument {
  clubId: string;
  createdBy: string;
  assignedTo?: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  progress: number; // 0-100
}

// Chat Message interfaces
export interface IChatMessage extends BaseDocument {
  clubId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "file";
}

// Photo interfaces
export interface IPhoto extends BaseDocument {
  clubId: string;
  uploadedBy: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: "events" | "activities" | "members" | "general";
}

// Report interfaces  
export interface IReport extends BaseDocument {
  clubId: string;
  uploadedBy: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: "meeting_minutes" | "financial" | "proposals" | "general";
}

// Session interfaces for authentication
export interface ISession extends BaseDocument {
  sid: string;
  sess: any;
  expire: Date;
}

// Mongoose Schemas
export const userSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
}, {
  timestamps: true,
  collection: 'users'
});

export const clubSchema = new Schema<IClub>({
  name: { type: String, required: true },
  description: String,
  createdBy: { type: String, required: true, ref: 'User' },
  displayPictureUrl: String,
  isPublic: { type: Boolean, default: true },
  inviteCode: { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
  collection: 'clubs'
});

export const clubMembershipSchema = new Schema<IClubMembership>({
  userId: { type: String, required: true, ref: 'User' },
  clubId: { type: String, required: true, ref: 'Club' },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'club_memberships'
});

export const joinRequestSchema = new Schema<IJoinRequest>({
  userId: { type: String, required: true, ref: 'User' },
  clubId: { type: String, required: true, ref: 'Club' },
  message: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {
  timestamps: true,
  collection: 'join_requests'
});

export const announcementSchema = new Schema<IAnnouncement>({
  clubId: { type: String, required: true, ref: 'Club' },
  authorId: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
}, {
  timestamps: true,
  collection: 'announcements'
});

export const eventSchema = new Schema<IEvent>({
  clubId: { type: String, required: true, ref: 'Club' },
  createdBy: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: String,
  isRecurring: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'published' },
}, {
  timestamps: true,
  collection: 'events'
});

export const taskSchema = new Schema<ITask>({
  clubId: { type: String, required: true, ref: 'Club' },
  createdBy: { type: String, required: true, ref: 'User' },
  assignedTo: { type: String, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: Date,
  progress: { type: Number, default: 0, min: 0, max: 100 },
}, {
  timestamps: true,
  collection: 'tasks'
});

export const chatMessageSchema = new Schema<IChatMessage>({
  clubId: { type: String, required: true, ref: 'Club' },
  senderId: { type: String, required: true, ref: 'User' },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
}, {
  timestamps: true,
  collection: 'chat_messages'
});

export const photoSchema = new Schema<IPhoto>({
  clubId: { type: String, required: true, ref: 'Club' },
  uploadedBy: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  imageUrl: { type: String, required: true },
  category: { type: String, enum: ['events', 'activities', 'members', 'general'], default: 'general' },
}, {
  timestamps: true,
  collection: 'photos'
});

export const reportSchema = new Schema<IReport>({
  clubId: { type: String, required: true, ref: 'Club' },
  uploadedBy: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  category: { type: String, enum: ['meeting_minutes', 'financial', 'proposals', 'general'], default: 'general' },
}, {
  timestamps: true,
  collection: 'reports'
});

export const sessionSchema = new Schema<ISession>({
  sid: { type: String, required: true, unique: true },
  sess: { type: Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true },
}, {
  collection: 'sessions'
});

// Create indexes
sessionSchema.index({ expire: 1 }, { expireAfterSeconds: 0 });
clubMembershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });
joinRequestSchema.index({ userId: 1, clubId: 1 });

// Zod validation schemas for API endpoints
export const insertClubSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  description: z.string().optional(),
  createdBy: z.string(),
  displayPictureUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const updateClubSchema = z.object({
  name: z.string().min(1, "Club name is required").optional(),
  description: z.string().optional(),
  displayPictureUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export const insertJoinRequestSchema = z.object({
  userId: z.string(),
  clubId: z.string(),
  message: z.string().optional(),
});

export const insertAnnouncementSchema = z.object({
  clubId: z.string(),
  authorId: z.string(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

export const insertEventSchema = z.object({
  clubId: z.string(),
  createdBy: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().optional(),
  isRecurring: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
});

export const insertTaskSchema = z.object({
  clubId: z.string(),
  createdBy: z.string(),
  assignedTo: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.date().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const insertChatMessageSchema = z.object({
  clubId: z.string(),
  senderId: z.string(),
  content: z.string().min(1, "Content is required"),
  messageType: z.enum(['text', 'image', 'file']).optional(),
});

export const insertPhotoSchema = z.object({
  clubId: z.string(),
  uploadedBy: z.string(),
  title: z.string().min(1, "Photo title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Valid image URL is required"),
  category: z.enum(['events', 'activities', 'members', 'general']).optional(),
});

export const insertReportSchema = z.object({
  clubId: z.string(),
  uploadedBy: z.string(),
  title: z.string().min(1, "Report title is required"),
  description: z.string().optional(),
  fileUrl: z.string().url("Valid file URL is required"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  fileSize: z.number().positive("File size must be positive"),
  category: z.enum(['meeting_minutes', 'financial', 'proposals', 'general']).optional(),
});

// Type exports for use in other files
export type UpsertUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
};

export type User = IUser;
export type Club = IClub;
export type ClubMembership = IClubMembership;
export type JoinRequest = IJoinRequest;
export type Announcement = IAnnouncement;
export type Event = IEvent;
export type Task = ITask;
export type ChatMessage = IChatMessage;
export type Photo = IPhoto;
export type Report = IReport;

export type InsertClub = z.infer<typeof insertClubSchema>;
export type UpdateClub = z.infer<typeof updateClubSchema>;
export type InsertJoinRequest = z.infer<typeof insertJoinRequestSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;