import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, Users, ArrowLeft, Check } from "lucide-react";

export default function JoinClub() {
  const { inviteCode } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to join clubs",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/auth/google";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const joinClubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clubs/join/${inviteCode}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to join club");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setClub(data.club);
      setJoined(true);
      toast({ title: "Success", description: "You have successfully joined the club!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if invite code is valid when component loads
  useEffect(() => {
    if (!inviteCode || !isAuthenticated) return;

    const checkInviteCode = async () => {
      try {
        setLoading(true);
        // First try to join (this will also return club info if successful)
        joinClubMutation.mutate();
      } catch (error) {
        console.error("Error checking invite code:", error);
      } finally {
        setLoading(false);
      }
    };

    checkInviteCode();
  }, [inviteCode, isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteCode) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or malformed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joined && club) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Successfully Joined!
            </CardTitle>
            <CardDescription>
              Welcome to {club.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {club.displayPictureUrl && (
              <img 
                src={club.displayPictureUrl} 
                alt={club.name}
                className="w-16 h-16 rounded-lg object-cover mx-auto"
              />
            )}
            <div className="text-center">
              <h3 className="font-semibold">{club.name}</h3>
              {club.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {club.description}
                </p>
              )}
            </div>
            <Button 
              onClick={() => setLocation(`/clubs/${club._id}`)} 
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              Enter Club
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Unable to Join</CardTitle>
          <CardDescription>
            {joinClubMutation.error?.message || "There was an issue joining this club."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => joinClubMutation.mutate()} 
            disabled={joinClubMutation.isPending}
            className="w-full"
          >
            {joinClubMutation.isPending ? "Joining..." : "Try Again"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")} 
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}