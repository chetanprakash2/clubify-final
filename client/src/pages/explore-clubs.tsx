import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Search, Globe, Lock, Plus } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function ExploreClubs() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/google";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: publicClubs, isLoading: clubsLoading } = useQuery({
    queryKey: ["/api/clubs/public"],
    enabled: !!user,
  });

  const { data: userClubs } = useQuery({
    queryKey: ["/api/clubs/my"],
    enabled: !!user,
  });

  const joinRequestMutation = useMutation({
    mutationFn: async (clubId: string) => {
      const response = await fetch(`/api/clubs/${clubId}/join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: "I would like to join this club" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send join request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Join request sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/public"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Get list of clubs user is already a member of
  const userClubIds = Array.isArray(userClubs) ? userClubs.map((club: any) => club._id || club.id) : [];

  // Filter clubs based on search query
  const filteredClubs = Array.isArray(publicClubs) ? publicClubs.filter((club: any) => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (club.description && club.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

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
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold text-gray-900">Explore Clubs</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
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
                onClick={() => window.location.href = "/api/auth/google/logout"}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Clubs
          </h1>
          <p className="text-gray-600 mb-6">Find and join public clubs that match your interests.</p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clubs Grid */}
        <div className="space-y-6">
          {clubsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-3/4 h-3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="w-full h-9" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClubs && filteredClubs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club: any, index: number) => {
                const isAlreadyMember = userClubIds.includes(club._id || club.id);
                
                return (
                  <Card key={club._id || club.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
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
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{club.name}</CardTitle>
                      {club.description && (
                        <CardDescription className="line-clamp-2">
                          {club.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {isAlreadyMember ? (
                        <Link href={`/club/${club._id || club.id}`}>
                          <Button className="w-full" variant="outline">
                            <Users className="h-4 w-4 mr-2" />
                            Enter Club
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => joinRequestMutation.mutate(club._id || club.id)}
                          disabled={joinRequestMutation.isPending}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {joinRequestMutation.isPending ? "Sending..." : "Request to Join"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
              <p className="text-gray-600">No clubs match your search "{searchQuery}". Try a different term.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No public clubs available</h3>
              <p className="text-gray-600 mb-4">There are no public clubs to discover right now.</p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}