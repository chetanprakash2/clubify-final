import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertClubSchema } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateClubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClubModal({ open, onOpenChange }: CreateClubModalProps) {
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(insertClubSchema.omit({ createdBy: true })),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createClubMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/clubs", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Club created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs/my"] });
      form.reset();
      onOpenChange(false);
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
      toast({
        title: "Error",
        description: "Failed to create club. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);
    createClubMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Club</DialogTitle>
          <DialogDescription>
            Start your own club and become an admin. You can invite members and manage activities.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter club name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a descriptive name for your club.
                  </FormDescription>
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
                      placeholder="Describe your club's purpose and activities"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help potential members understand what your club is about.
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
                disabled={createClubMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createClubMutation.isPending}
              >
                {createClubMutation.isPending ? "Creating..." : "Create Club"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
