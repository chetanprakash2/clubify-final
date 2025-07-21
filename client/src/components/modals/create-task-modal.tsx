import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
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

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
}

export function CreateTaskModal({ open, onOpenChange, clubId }: CreateTaskModalProps) {
  const { toast } = useToast();
  
  // Create a form schema that only includes user-fillable fields
  const formSchema = insertTaskSchema
    .omit({ clubId: true, createdBy: true })
    .extend({
      dueDate: z.date().optional(),
    });
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: "unassigned",
      priority: "medium" as const,
      status: "pending" as const,
      dueDate: undefined,
      progress: 0,
    },
  });

  // Get club members for assignment
  const { data: members = [] } = useQuery({
    queryKey: ["/api/clubs", clubId, "members"],
    enabled: !!clubId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/clubs/${clubId}/tasks`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "tasks"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Task creation error:", error);
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
        description: error?.message || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    console.log("Task form data:", data);
    console.log("Task form errors:", form.formState.errors);
    
    // Clean up the data before sending
    const cleanData = { ...data };
    
    // Remove empty assignedTo to avoid validation issues
    if (!cleanData.assignedTo || cleanData.assignedTo === "" || cleanData.assignedTo === "unassigned") {
      delete cleanData.assignedTo;
    }
    
    // Add clubId (createdBy will be set by the server from the authenticated user)
    const fullData = {
      ...cleanData,
      clubId,
    };
    
    console.log("Sending task data:", fullData);
    createTaskMutation.mutate(fullData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create and assign tasks to organize club activities and track progress.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
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
                      placeholder="Describe the task details and requirements..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide clear instructions and expectations for this task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {(members as any[])?.map((member: any) => (
                          <SelectItem key={member.user?.id || member.id} value={member.user?.id || member.id}>
                            {member.user?.firstName || member.user?.email || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a member to assign this task to.
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
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local"
                        {...field}
                        value={field.value ? 
                          (new Date(field.value)).toISOString().slice(0, 16)
                          : ""
                        }
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Set a deadline for task completion.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Progress (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Set the initial progress percentage (0-100).
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
                disabled={createTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
