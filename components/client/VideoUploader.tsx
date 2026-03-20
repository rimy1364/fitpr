"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { videoUploadSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof videoUploadSchema>;

export function VideoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(videoUploadSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!file) {
      toast({ variant: "destructive", title: "Please select a video file" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Get presigned URL
      const res = await fetch("/api/client/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          fileName: file.name,
          fileType: file.type,
        }),
      });

      const { uploadUrl } = await res.json();
      setUploadProgress(30);

      // Upload directly to S3
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setUploadProgress(100);
      toast({ title: "Video uploaded!", description: "Your trainer will review it soon." });
      reset();
      setFile(null);
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Please try again." });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload Form Video</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exerciseName">Exercise Name *</Label>
            <Input id="exerciseName" placeholder="e.g. Barbell Squat" {...register("exerciseName")} />
            {errors.exerciseName && <p className="text-sm text-destructive">{errors.exerciseName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" placeholder="Any specific concerns or context for your trainer..."
              rows={2} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Video File *</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
            <p className="text-xs text-muted-foreground">Supported: MP4, MOV, AVI. Max 500MB.</p>
          </div>

          {isUploading && (
            <div className="space-y-1">
              <Progress value={uploadProgress} />
              <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          )}

          <Button type="submit" disabled={isUploading || !file}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
