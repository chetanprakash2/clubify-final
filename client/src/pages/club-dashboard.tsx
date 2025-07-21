import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  CheckSquare, 
  MessageSquare,
  Video,
  FileText,
  Settings,
  UserPlus,
  Bell,
  Home,
  Megaphone,
  Images,
  Plus
} from "lucide-react";
import { CreateAnnouncementModal } from "@/components/modals/create-announcement-modal";
import { CreateEventModal } from "@/components/modals/create-event-modal";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { EditAnnouncementModal } from "@/components/modals/edit-announcement-modal";
import { EditEventModal } from "@/components/modals/edit-event-modal";
import { EditTaskModal } from "@/components/modals/edit-task-modal";
import { ClubSettingsModal } from "@/components/modals/club-settings-modal";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { ChatComponent } from "@/components/ChatComponent";
import { VideoMeeting } from "@/components/VideoMeeting";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReportsSection } from "@/components/ReportsSection";
import { queryClient } from "@/lib/queryClient";

export default function ClubDashboard() {
  const { id } = useParams();
  const clubId = id as string; // MongoDB uses string IDs
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUploadPhotoOpen, setIsUploadPhotoOpen] = useState(false);
  const [isUploadReportOpen, setIsUploadReportOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: club, isLoading: clubLoading } = useQuery<any>({
    queryKey: ["/api/clubs", clubId],
    enabled: !!user && !!clubId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "members"],
    enabled: !!user && !!clubId,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "announcements"],
    enabled: !!user && !!clubId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "events"],
    enabled: !!user && !!clubId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "tasks"],
    enabled: !!user && !!clubId,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "photos"],
    enabled: !!user && !!clubId,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "reports"],
    enabled: !!user && !!clubId,
  });

  const { data: joinRequests = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "join-requests"],
    enabled: !!user && !!clubId,
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/join-requests/${requestId}/approve`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve request");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Join request approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "members"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to approve request", variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/join-requests/${requestId}/reject`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reject request");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Join request rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "join-requests"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
    },
  });

  // Delete mutations
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete announcement");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Announcement deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "announcements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete event");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Event deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete task");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Task deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete photo");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Photo deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "photos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete report");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Report deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated || clubLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton className="w-32 h-8" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Club not found</h2>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is admin - fallback to club creator if members query fails
  const userMembership = members?.find((m: any) => m.user?.id === user?.id);
  const isAdmin = userMembership?.role === "admin" || club?.createdBy === user?.id;
  


  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "events", label: "Events", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "photos", label: "Photos", icon: Images },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "meetings", label: "Meetings", icon: Video },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "members", label: "Members", icon: Users },
  ];

  const adminItems = [
    { id: "requests", label: "Join Requests", icon: UserPlus, badge: joinRequests?.length || 0 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Club Overview</h1>
              <p className="text-gray-600">Get a quick overview of your club's activity and recent updates.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold text-gray-900">{members?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Events</p>
                      <p className="text-2xl font-bold text-gray-900">{events?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {tasks?.filter((t: any) => t.status === "pending").length || 0}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Join Requests</p>
                      <p className="text-2xl font-bold text-gray-900">{joinRequests?.length || 0}</p>
                    </div>
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h2>
                  <div className="space-y-4">
                    {announcements?.slice(0, 3).map((announcement: any) => (
                      <div key={announcement._id} className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{announcement.content.slice(0, 100)}...</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">No announcements yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
                  <div className="space-y-4">
                    {events?.slice(0, 3).map((event: any) => (
                      <div key={event._id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">No upcoming events</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "announcements":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Announcements</h1>
                <p className="text-gray-600">Keep your members informed with important updates and news.</p>
              </div>
              {isAdmin && (
                <Button onClick={() => setIsAnnouncementModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {Array.isArray(announcements) && announcements.length > 0 ? announcements.map((announcement: any) => (
                <Card key={announcement._id || announcement.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {announcement.author.profileImageUrl ? (
                          <img 
                            src={announcement.author.profileImageUrl} 
                            alt="Author" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {announcement.author.firstName || announcement.author.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {announcement.priority && announcement.priority !== "normal" && (
                          <Badge variant={announcement.priority === "high" ? "destructive" : "secondary"}>
                            {announcement.priority}
                          </Badge>
                        )}
                        {isAdmin && (
                          <div className="flex space-x-1">
                            <EditAnnouncementModal announcement={announcement} clubId={clubId} />
                            <DeleteConfirmationModal
                              title="Delete Announcement"
                              description="Are you sure you want to delete this announcement? This action cannot be undone."
                              onConfirm={() => deleteAnnouncementMutation.mutate(announcement._id)}
                              disabled={deleteAnnouncementMutation.isPending}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h2>
                    <p className="text-gray-700">{announcement.content}</p>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
                    <p className="text-gray-600">
                      {isAdmin ? "Create your first announcement to keep members informed." : "Check back later for updates from club admins."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case "events":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Events</h1>
                <p className="text-gray-600">Plan and manage club events, workshops, and activities.</p>
              </div>
              {isAdmin && (
                <Button onClick={() => setIsEventModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {Array.isArray(events) && events.length > 0 ? events.map((event: any) => (
                <Card key={event._id || event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(event.startDate).toLocaleDateString()}
                              </span>
                              <span>
                                <i className="fas fa-clock mr-1"></i>
                                {new Date(event.startDate).toLocaleTimeString()} - {new Date(event.endDate).toLocaleTimeString()}
                              </span>
                              {event.location && (
                                <span>
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={event.status === "published" ? "default" : "secondary"}>
                              {event.status}
                            </Badge>
                            {isAdmin && (
                              <div className="flex space-x-1">
                                <EditEventModal event={event} clubId={clubId} />
                                <DeleteConfirmationModal
                                  title="Delete Event"
                                  description="Are you sure you want to delete this event? This action cannot be undone."
                                  onConfirm={() => deleteEventMutation.mutate(event._id)}
                                  disabled={deleteEventMutation.isPending}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-gray-700 mt-3">{event.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                    <p className="text-gray-600">
                      {isAdmin ? "Create your first event to get started." : "Check back later for upcoming events."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case "tasks":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h1>
                <p className="text-gray-600">Manage daily tasks and track progress of club activities.</p>
              </div>
              {isAdmin && (
                <Button onClick={() => setIsTaskModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {Array.isArray(tasks) && tasks.length > 0 ? tasks.map((task: any) => (
                <Card key={task._id || task.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex items-center mt-1">
                          <input 
                            type="checkbox" 
                            checked={task.status === "completed"}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                            readOnly
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-semibold ${task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"}`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                task.status === "completed" ? "default" :
                                task.status === "in_progress" ? "secondary" :
                                task.dueDate && new Date(task.dueDate) < new Date() ? "destructive" :
                                "outline"
                              }>
                                {task.status === "completed" ? "Completed" :
                                 task.status === "in_progress" ? "In Progress" :
                                 task.dueDate && new Date(task.dueDate) < new Date() ? "Overdue" :
                                 "Pending"}
                              </Badge>
                              {isAdmin && (
                                <div className="flex space-x-1">
                                  <EditTaskModal task={task} clubId={clubId} />
                                  <DeleteConfirmationModal
                                    title="Delete Task"
                                    description="Are you sure you want to delete this task? This action cannot be undone."
                                    onConfirm={() => deleteTaskMutation.mutate(task._id)}
                                    disabled={deleteTaskMutation.isPending}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <p className={`mb-3 ${task.status === "completed" ? "text-gray-500" : "text-gray-700"}`}>
                            {task.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {task.dueDate && (
                              <span>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.assignee && (
                              <span>
                                <Users className="w-3 h-3 inline mr-1" />
                                Assigned to: {task.assignee.firstName || task.assignee.email}
                              </span>
                            )}
                            <span>
                              <i className="fas fa-flag mr-1"></i>
                              {task.priority} Priority
                            </span>
                          </div>
                          {task.progress > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{task.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-600">
                      {isAdmin ? "Create your first task to get organized." : "No tasks assigned yet."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case "members":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Members</h1>
                <p className="text-gray-600">Manage club members and their roles.</p>
              </div>
              {isAdmin && (
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Members ({Array.isArray(members) ? members.length : 0})
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {Array.isArray(members) ? members.map((member: any) => (
                    <div key={member._id || member.id} className="py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {member.user.profileImageUrl ? (
                            <img 
                              src={member.user.profileImageUrl} 
                              alt="Member" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">
                                {member.user.firstName || member.user.email}
                              </h3>
                              <Badge variant={member.role === "admin" ? "secondary" : "outline"}>
                                {member.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{member.user.email}</p>
                            <p className="text-xs text-gray-500">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
                      <p className="text-gray-600">Invite members to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "requests":
        if (!isAdmin) {
          return (
            <div className="p-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">Only admins can view join requests.</p>
              </div>
            </div>
          );
        }

        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Requests</h1>
              <p className="text-gray-600">Review and manage membership requests for your club.</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Pending Requests ({Array.isArray(joinRequests) ? joinRequests.length : 0})
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {Array.isArray(joinRequests) ? joinRequests.map((request: any) => (
                    <div key={request._id || request.id} className="py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {request.user.profileImageUrl ? (
                            <img 
                              src={request.user.profileImageUrl} 
                              alt="Applicant" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {request.user.firstName || request.user.email}
                            </h3>
                            <p className="text-sm text-gray-600">{request.user.email}</p>
                            <p className="text-xs text-gray-500">
                              Applied {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button 
                            size="sm"
                            onClick={() => approveRequestMutation.mutate(request._id || request.id)}
                            disabled={approveRequestMutation.isPending}
                          >
                            <i className="fas fa-check mr-1"></i>
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => rejectRequestMutation.mutate(request._id || request.id)}
                            disabled={rejectRequestMutation.isPending}
                          >
                            <i className="fas fa-times mr-1"></i>
                            Reject
                          </Button>
                        </div>
                      </div>
                      {request.message && (
                        <div className="mt-3 ml-16">
                          <p className="text-sm text-gray-700">"{request.message}"</p>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                      <p className="text-gray-600">All join requests have been processed.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "chat":
        return <ChatComponent clubId={clubId} members={members || []} />;

      case "meetings":
        return <VideoMeeting clubId={clubId} members={members || []} />;

      case "photos":
        return (
          <div className="p-6">
            <PhotoGallery clubId={clubId} isAdmin={isAdmin} />
          </div>
        );

      case "reports":
        return (
          <div className="p-6">
            <ReportsSection clubId={clubId} isAdmin={isAdmin} />
          </div>
        );

      case "settings":
        if (!isAdmin) {
          return (
            <div className="p-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">Only admins can access club settings.</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Club Settings</h1>
              <p className="text-gray-600">Manage your club's information and advanced settings.</p>
            </div>
            
            <div className="max-w-2xl">
              <ClubSettingsModal club={club} />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Coming Soon</h3>
              <p className="text-gray-600">This feature is currently under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-music text-white text-sm"></i>
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-900">{club?.name}</span>
                  <Badge variant={isAdmin ? "secondary" : "outline"} className="ml-2">
                    {isAdmin ? "Admin" : "Member"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
              {(isAdmin || userMembership) && (
                <ClubSettingsModal club={club} />
              )}
              <div className="hidden md:flex items-center space-x-3">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <span className="font-medium text-gray-900">
                  {user?.firstName || user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 hidden md:block overflow-y-auto">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Admin Section */}
          {isAdmin && (
            <div className="border-t border-gray-200 p-4 mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Admin Controls</h3>
              <div className="space-y-2">
                {adminItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                    {item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* Modals */}
      <CreateAnnouncementModal
        open={isAnnouncementModalOpen}
        onOpenChange={setIsAnnouncementModalOpen}
        clubId={clubId || ""}
      />
      <CreateEventModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        clubId={clubId || ""}
      />
      <CreateTaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        clubId={clubId || ""}
      />
    </div>
  );
}
