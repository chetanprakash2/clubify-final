import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateClubModal } from "@/components/modals/create-club-modal";
import { useState } from "react";
import { Users, Search, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);

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

  const { data: userClubs, isLoading: clubsLoading } = useQuery({
    queryKey: ["/api/clubs/my"],
    enabled: !!user,
  });

  const handleLogout = () => {
    window.location.href = "/api/auth/google/logout";
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-8 h-8 rounded-full mx-auto mb-4" />
          <Skeleton className="w-32 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  const getClubIcon = (index: number) => {
    const icons = ["fas fa-music", "fas fa-code", "fas fa-leaf", "fas fa-camera", "fas fa-book"];
    return icons[index % icons.length];
  };

  const getClubGradient = (index: number) => {
    const gradients = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500", 
      "from-green-500 to-emerald-500",
      "from-red-500 to-pink-500",
      "from-yellow-500 to-orange-500"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Clubify</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <i className="fas fa-bell text-lg"></i>
              </Button>
              <div className="flex items-center space-x-3">
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="text-gray-600">Manage your clubs and stay connected with your community.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Create New Club</h2>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-plus text-primary"></i>
                </div>
              </div>
              <p className="text-gray-600 mb-4">Start your own club and become an admin. Invite members and manage activities.</p>
              <Button 
                className="w-full bg-primary hover:bg-blue-700"
                onClick={() => setIsCreateClubOpen(true)}
              >
                Create Club
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Find Clubs</h2>
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <p className="text-gray-600 mb-4">Discover and request to join clubs that match your interests.</p>
              <Link href="/explore">
                <Button className="w-full bg-secondary hover:bg-green-600">
                  Browse Clubs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* My Clubs Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Clubs</h2>
              <span className="text-sm text-gray-500">
                {Array.isArray(userClubs) ? userClubs.length : 0} clubs
              </span>
            </div>

            {clubsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-3/4 h-3 mb-3" />
                    <Skeleton className="w-full h-3" />
                  </div>
                ))}
              </div>
            ) : userClubs && Array.isArray(userClubs) && userClubs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userClubs.map((club: any, index: number) => (
                  <Link key={club._id || club.id || index} href={`/club/${club._id || club.id}`}>
                    <div className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        {club.displayPictureUrl ? (
                          <img 
                            src={club.displayPictureUrl} 
                            alt={club.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 bg-gradient-to-r ${getClubGradient(index)} rounded-lg flex items-center justify-center`}>
                            <i className={`${getClubIcon(index)} text-white`}></i>
                          </div>
                        )}
                        <Badge variant={club.membership.role === "admin" ? "secondary" : "outline"}>
                          {club.membership.role === "admin" ? "Admin" : "Member"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{club.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{club.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        <span>Click to enter</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs yet</h3>
                <p className="text-gray-600 mb-4">Create your first club or browse available clubs to join.</p>
                <Button onClick={() => setIsCreateClubOpen(true)}>
                  Create Your First Club
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateClubModal 
        open={isCreateClubOpen} 
        onOpenChange={setIsCreateClubOpen}
      />
    </div>
  );
}
