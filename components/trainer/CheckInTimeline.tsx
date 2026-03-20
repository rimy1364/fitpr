"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CheckIn {
  id: string;
  date: Date;
  weight: number | null;
  energyLevel: number | null;
  sleepHours: number | null;
  dietAdherence: number | null;
  clientNotes: string | null;
  trainerNotes: string | null;
  trainer: { name: string } | null;
}

interface Props {
  checkIns: CheckIn[];
  clientId: string;
}

export function CheckInTimeline({ checkIns, clientId }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const saveNotes = async (checkInId: string) => {
    setSaving(checkInId);
    try {
      const res = await fetch(`/api/trainer/checkins/${checkInId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerNotes: notes[checkInId] }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Notes saved" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to save notes." });
    } finally {
      setSaving(null);
    }
  };

  if (checkIns.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No check-ins yet.</p>;
  }

  return (
    <div className="space-y-4">
      {checkIns.map((ci) => (
        <Card key={ci.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium">{formatDate(ci.date, "EEEE, MMM d yyyy")}</p>
              {ci.weight && <span className="text-sm font-medium">{ci.weight} kg</span>}
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm mb-3">
              {ci.energyLevel && (
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Energy</p>
                  <p className="font-semibold">{ci.energyLevel}/10</p>
                </div>
              )}
              {ci.sleepHours && (
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Sleep</p>
                  <p className="font-semibold">{ci.sleepHours}h</p>
                </div>
              )}
              {ci.dietAdherence && (
                <div className="text-center p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Diet</p>
                  <p className="font-semibold">{ci.dietAdherence}/10</p>
                </div>
              )}
            </div>

            {ci.clientNotes && (
              <div className="text-sm p-2 bg-blue-50 dark:bg-blue-950 rounded mb-3">
                <p className="text-xs text-muted-foreground mb-1">Client notes:</p>
                <p>{ci.clientNotes}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Your notes:</p>
              <Textarea
                defaultValue={ci.trainerNotes ?? ""}
                placeholder="Add coaching notes for this check-in..."
                className="text-sm"
                rows={2}
                onChange={(e) => setNotes((prev) => ({ ...prev, [ci.id]: e.target.value }))}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={saving === ci.id || !notes[ci.id]}
                onClick={() => saveNotes(ci.id)}
              >
                {saving === ci.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
