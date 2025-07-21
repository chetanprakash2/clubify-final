import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAnnouncementSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
}

export function CreateAnnouncementModal({ open, onOpenChange, clubId }: CreateAnnouncementModalProps) {
  const { toast } = useToast();
  
  // Create a form schema that only includes user-fillable fields
  const formSchema = insertAnnouncementSchema.omit({ clubId: true, authorId: true });
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      priority: "normal" as const,
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/clubs/${clubId}/announcements`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "announcements"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Announcement creation error:", error);
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
      toast({
        title: "Error",
        description: error?.message || "Failed to create announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    // Add clubId and authorId on the frontend side before sending
    const fullData = {
      ...data,
      clubId,
      // authorId will be set by the server from the authenticated user
    };
    console.log("Sending data:", fullData);
    createAnnouncementMutation.mutate(fullData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>
            Share important updates and news with your club members.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your announcement content here..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide clear and detailed information for your members.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Higher priority announcements will be highlighted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createAnnouncementMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createAnnouncementMutation.isPending}
              >
                {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
