"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getInitials } from "@/lib/utils";
import { Camera, Eye, EyeOff, KeyRound, Loader2, User } from "lucide-react";

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
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
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
  const [tab, setTab] = useState<"photo" | "password">("photo");

  // Photo state
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const { toast } = useToast();

  const currentAvatar = preview ?? session?.user?.avatar ?? undefined;

  const handleClose = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setPreview(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

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

  const handleSavePhoto = async () => {
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Password too short", description: "Minimum 8 characters." });
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      toast({ title: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b mb-2">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "photo" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("photo")}
          >
            <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Photo</span>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "password" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("password")}
          >
            <span className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Password</span>
          </button>
        </div>

        {tab === "photo" && (
          <div className="flex flex-col items-center gap-5 py-2">
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

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="flex flex-col items-center gap-2 w-full">
              <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" /> Choose Photo
              </Button>
              {preview && (
                <Button className="w-full" onClick={handleSavePhoto} disabled={isUploading}>
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Picture
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              JPG, PNG or GIF. Max 300KB. Will be resized to 300×300.
            </p>
          </div>
        )}

        {tab === "password" && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleChangePassword}
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
