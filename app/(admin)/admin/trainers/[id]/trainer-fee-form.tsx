"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pencil, Check, X } from "lucide-react";

interface Props {
  trainerId: string;
  currentFee: number | null;
}

export function TrainerFeeForm({ trainerId, currentFee }: Props) {
  const [editing, setEditing] = useState(false);
  const [fee, setFee] = useState(String(currentFee ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/trainers/${trainerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perClientFee: fee ? parseInt(fee) : null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      toast({ title: "Fee updated" });
      setEditing(false);
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Pencil className="h-3 w-3" /> Edit fee
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-sm text-muted-foreground">₹</span>
      <Input
        type="number"
        value={fee}
        onChange={(e) => setFee(e.target.value)}
        placeholder="per client/month"
        className="h-8 w-36 text-sm"
        autoFocus
      />
      <Button size="sm" className="h-8 px-2" onClick={handleSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </Button>
      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setEditing(false); setFee(String(currentFee ?? "")); }}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
