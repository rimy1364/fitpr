"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getInitials } from "@/lib/utils";
import { Camera, Loader2, User } from "lucide-react";

// Client-side image resize using Canvas — returns base64 data URL
function resizeImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface Props {
  trigger: React.ReactNode;
}

export function ProfileDialog({ trigger }: Props) {
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentAvatar = preview ?? session?.user?.avatar ?? undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please select an image file." });
      return;
    }

    try {
      const resized = await resizeImage(file, 300);
      setPreview(resized);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not process image." });
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setIsUploading(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: preview }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      // Update the session so the new avatar shows immediately
      await update({ avatar: preview });
      toast({ title: "Profile picture updated!" });
      setPreview(null);
      setOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPreview(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {/* Avatar preview */}
          <div className="relative group">
            <Avatar className="h-28 w-28">
              <AvatarImage src={currentAvatar} alt={session?.user?.name ?? ""} />
              <AvatarFallback className="text-2xl">
                {session?.user?.name ? getInitials(session.user.name) : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-col items-center gap-2 w-full">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Choose Photo
            </Button>

            {preview && (
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isUploading}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Picture
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            JPG, PNG or GIF. Max 300KB. Will be resized to 300×300.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
