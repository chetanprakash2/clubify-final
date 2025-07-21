import mongoose from 'mongoose';
import {
  userSchema,
  clubSchema,
  clubMembershipSchema,
  joinRequestSchema,
  announcementSchema,
  eventSchema,
  taskSchema,
  chatMessageSchema,
  photoSchema,
  reportSchema,
  sessionSchema,
  type IUser,
  type IClub,
  type IClubMembership,
  type IJoinRequest,
  type IAnnouncement,
  type IEvent,
  type ITask,
  type IChatMessage,
  type IPhoto,
  type IReport,
  type ISession,
} from '@shared/schema';

// MongoDB connection with fallback to in-memory for development
const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;

export async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0 && MONGODB_URI) {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB Atlas');
      isConnected = true;
    } else if (!MONGODB_URI) {
      console.log('⚠️  No MONGODB_URI provided - using in-memory storage for development');
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', (error as Error).message);
    console.log('📋 To fix this:');
    console.log('1. Go to MongoDB Atlas → Network Access');
    console.log('2. Add IP Address → Allow Access from Anywhere (0.0.0.0/0)');
    console.log('3. Ensure your database user has read/write permissions');
    console.log('🔄 App will use in-memory storage for now');
    isConnected = false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// Mongoose Models
export const User = mongoose.model<IUser>('User', userSchema);
export const Club = mongoose.model<IClub>('Club', clubSchema);
export const ClubMembership = mongoose.model<IClubMembership>('ClubMembership', clubMembershipSchema);
export const JoinRequest = mongoose.model<IJoinRequest>('JoinRequest', joinRequestSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export const Event = mongoose.model<IEvent>('Event', eventSchema);
export const Task = mongoose.model<ITask>('Task', taskSchema);
export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
export const Photo = mongoose.model<IPhoto>('Photo', photoSchema);
export const Report = mongoose.model<IReport>('Report', reportSchema);
export const Session = mongoose.model<ISession>('Session', sessionSchema);

// Initialize connection
connectDB().catch(console.error);