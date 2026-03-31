"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pencil } from "lucide-react";

interface Profile {
  assignedTrainerId?: string | null;
  quarterlyFee?: number | null;
  status?: string;
  goal?: string | null;
}

interface Props {
  clientId: string;
  profile: Profile | null;
  trainers: { id: string; name: string }[];
}

export function ClientDetailActions({ clientId, profile, trainers }: Props) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [trainerId, setTrainerId] = useState(profile?.assignedTrainerId ?? "");
  const [status, setStatus] = useState(profile?.status ?? "ACTIVE");
  const [quarterlyFee, setQuarterlyFee] = useState(String(profile?.quarterlyFee ?? ""));
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTrainerId: trainerId || null,
          status,
          quarterlyFee: quarterlyFee ? parseInt(quarterlyFee) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      toast({ title: "Client updated" });
      setOpen(false);
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Assign Trainer</Label>
            <Select value={trainerId} onValueChange={setTrainerId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {trainers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">Quarterly Fee (₹)</Label>
            <Input
              id="fee"
              type="number"
              placeholder="e.g. 15000"
              value={quarterlyFee}
              onChange={(e) => setQuarterlyFee(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
