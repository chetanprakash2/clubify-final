import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Calendar, Trash2 } from "lucide-react";
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

interface Photo {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  uploadedBy: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
}

interface PhotoGalleryProps {
  clubId: string;
  isAdmin?: boolean;
}

export function PhotoGallery({ clubId, isAdmin = false }: PhotoGalleryProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ["/api/clubs", clubId, "photos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/clubs/${clubId}/photos/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.text();
      try {
        const jsonResult = JSON.parse(result);
        if (!response.ok) {
          throw new Error(jsonResult.message || `Upload failed with status ${response.status}`);
        }
        return jsonResult;
      } catch (parseError) {
        // If JSON parsing fails, likely got HTML error page
        console.error('Upload response:', result);
        throw new Error(`Upload failed: Server returned invalid response`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Photo uploaded successfully",
        description: "Your photo has been added to the club gallery.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "photos"] });
      setIsUploadOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete photo');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo deleted successfully",
        description: "The photo has been removed from the gallery.",
      });
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

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setCategory("general");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title || file.name);
    formData.append('description', description);
    formData.append('category', category);

    uploadMutation.mutate(formData);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'events': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'activities': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'members': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Club Photos</h2>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload size={16} />
              Upload Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Photo</DialogTitle>
              <DialogDescription>
                Add a new photo to your club gallery.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Photo</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Photo title (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this photo..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                    <SelectItem value="members">Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Uploading..." : "Upload Photo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload photos to share memories with club members
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>Upload First Photo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <Card key={photo._id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted group">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                {isAdmin && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{photo.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(photo._id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold line-clamp-1">{photo.title}</h3>
                  <Badge className={getCategoryColor(photo.category)}>
                    {photo.category}
                  </Badge>
                </div>
                {photo.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {photo.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    By {photo.uploadedBy?.firstName} {photo.uploadedBy?.lastName || photo.uploadedBy?.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}