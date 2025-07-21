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
import { Upload, FileText, Calendar, Download, Trash2 } from "lucide-react";
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

interface Report {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  uploadedBy: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
}

interface ReportsSectionProps {
  clubId: string;
  isAdmin?: boolean;
}

export function ReportsSection({ clubId, isAdmin = false }: ReportsSectionProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/clubs", clubId, "reports"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/clubs/${clubId}/reports/upload`, {
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
        title: "Report uploaded successfully",
        description: "Your document has been added to the club reports.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", clubId, "reports"] });
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
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete report');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report deleted successfully",
        description: "The document has been removed from the club reports.",
      });
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
        description: "Please select a document to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('description', description);
    formData.append('category', category);

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting_minutes': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'financial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'proposals': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
    return '📎';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Club Reports</h2>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload size={16} />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Report</DialogTitle>
              <DialogDescription>
                Upload a document or report for your club members.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Document</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    {file.name} ({formatFileSize(file.size)})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this document..."
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
                    <SelectItem value="meeting_minutes">Meeting Minutes</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="proposals">Proposals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload documents and reports to share with club members
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>Upload First Document</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl mt-1">
                      {getFileTypeIcon(report.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1 pr-2">{report.title}</h3>
                        <Badge className={getCategoryColor(report.category)}>
                          {report.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      {report.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {report.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>
                            By {report.uploadedBy?.firstName} {report.uploadedBy?.lastName || report.uploadedBy?.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          <span>{formatFileSize(report.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(report.fileUrl, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Download size={14} />
                      Download
                    </Button>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="px-3"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{report.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(report._id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}