import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Trash2, LogOut, Upload, Copy, Share, Eye, EyeOff, Link } from "lucide-react";

const clubSettingsSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  description: z.string().optional(),
  displayPictureUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
});

interface ClubSettingsModalProps {
  club: any;
}

export function ClubSettingsModal({ club }: ClubSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState(club.inviteCode || "");
  const [uploadedImageUrl, setUploadedImageUrl] = useState(club.displayPictureUrl || "");

  const { data: members = [] } = useQuery({
    queryKey: ["/api/clubs", club._id, "members"],
    enabled: !!club._id,
  });

  // Check if current user is admin
  const currentMember = Array.isArray(members) ? members.find((m: any) => m.userId === user?.id) : null;
  const isAdmin = currentMember?.role === "admin";
  
  // Count number of admins
  const adminCount = Array.isArray(members) ? members.filter((m: any) => m.role === "admin").length : 0;
  const isOnlyAdmin = isAdmin && adminCount <= 1;

  const form = useForm<z.infer<typeof clubSettingsSchema>>({
    resolver: zodResolver(clubSettingsSchema),
    defaultValues: {
      name: club.name,
      description: club.description || "",
      displayPictureUrl: club.displayPictureUrl || "",
      isPublic: club.isPublic !== false, // Default to true if not set
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImageUrl(result);
        form.setValue("displayPictureUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateClubMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clubSettingsSchema>) => {
      const response = await fetch(`/api/clubs/${club._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update club");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Club updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", club._id] });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/public"] });
      setUploadedImageUrl("");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clubs/${club._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete club");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Club deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/my"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const leaveClubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clubs/${club._id}/leave`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to leave club");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Left club successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/my"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateInviteCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clubs/${club._id}/invite-code`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate invite code");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setInviteCode(data.inviteCode);
      toast({ title: "Success", description: "Invite code generated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", club._id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof clubSettingsSchema>) => {
    updateClubMutation.mutate(data);
  };

  const handleDeleteClub = () => {
    deleteClubMutation.mutate();
  };

  const handleLeaveClub = () => {
    leaveClubMutation.mutate();
  };

  const handleGenerateInviteCode = () => {
    generateInviteCodeMutation.mutate();
  };

  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({ title: "Success", description: "Invite link copied to clipboard" });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to copy invite link",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin && !currentMember) {
    return null; // Don't show settings if user is not a member
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Club Settings</DialogTitle>
        </DialogHeader>
        
        {isAdmin && (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter club name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter club description" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <label className="text-sm font-medium">Club Display Picture</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="cursor-pointer mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Choose an image file from your device for the club's display picture
                  </p>
                  {uploadedImageUrl && (
                    <div className="mt-2">
                      <img 
                        src={uploadedImageUrl} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-lg object-cover border"
                      />
                    </div>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {field.value ? (
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Public Club
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <EyeOff className="h-4 w-4" />
                              Private Club
                            </div>
                          )}
                        </FormLabel>
                        <FormDescription>
                          {field.value 
                            ? "Club is visible on the explore page for anyone to find and join" 
                            : "Club is private and requires an invite link to join"
                          }
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateClubMutation.isPending}>
                    {updateClubMutation.isPending ? "Updating..." : "Update Club"}
                  </Button>
                </div>
              </form>
            </Form>

            <Separator />

            {/* Invite Code Section */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Share className="h-4 w-4" />
                Invite Link
              </h4>
              <p className="text-sm text-muted-foreground">
                Share this link to let people join your club instantly
              </p>
              
              {inviteCode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={`${window.location.origin}/join/${inviteCode}`}
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyInviteLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Code: {inviteCode}</Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateInviteCode}
                      disabled={generateInviteCodeMutation.isPending}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      {generateInviteCodeMutation.isPending ? "Generating..." : "New Code"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleGenerateInviteCode}
                  disabled={generateInviteCodeMutation.isPending}
                  className="w-full"
                >
                  <Link className="h-4 w-4 mr-2" />
                  {generateInviteCodeMutation.isPending ? "Generating..." : "Generate Invite Link"}
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-destructive">Danger Zone</h4>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Club
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Club</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this club? This action cannot be undone.
                      All club data, including members, announcements, events, and tasks will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteClub}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Club
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

        {currentMember && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium">Membership</h4>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={isOnlyAdmin}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Club
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Club</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isOnlyAdmin 
                        ? "You cannot leave this club because you are the only admin. Please add another admin first or delete the club instead."
                        : "Are you sure you want to leave this club? You will need to request to join again if you change your mind."
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {!isOnlyAdmin && (
                      <AlertDialogAction onClick={handleLeaveClub}>
                        Leave Club
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {isOnlyAdmin && (
                <p className="text-sm text-muted-foreground">
                  You cannot leave as the only admin. Add another admin first.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}