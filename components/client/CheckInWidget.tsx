"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { checkInSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type FormData = z.infer<typeof checkInSchema>;

// Minimal Slider component if not included
function SliderInput({ label, value, onChange, min = 1, max = 10 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-semibold text-primary">{value}/{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

interface Props {
  existingCheckIn: { id: string; weight: number | null; energyLevel: number | null; sleepHours: number | null; dietAdherence: number | null; clientNotes: string | null } | null;
  recentCheckIns: { id: string; date: Date; weight: number | null }[];
}

export function CheckInForm({ existingCheckIn, recentCheckIns }: Props) {
  const [energy, setEnergy] = useState(existingCheckIn?.energyLevel ?? 7);
  const [diet, setDiet] = useState(existingCheckIn?.dietAdherence ?? 7);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      weight: existingCheckIn?.weight ?? undefined,
      sleepHours: existingCheckIn?.sleepHours ?? undefined,
      clientNotes: existingCheckIn?.clientNotes ?? "",
    },
  });

  if (existingCheckIn) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Already checked in today!</h3>
          <p className="text-muted-foreground">Come back tomorrow to keep your streak going.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {existingCheckIn.weight && <div className="p-3 bg-muted rounded"><p className="text-muted-foreground text-xs">Weight</p><p className="font-semibold">{existingCheckIn.weight} kg</p></div>}
            {existingCheckIn.energyLevel && <div className="p-3 bg-muted rounded"><p className="text-muted-foreground text-xs">Energy</p><p className="font-semibold">{existingCheckIn.energyLevel}/10</p></div>}
          </div>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/client/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, energyLevel: energy, dietAdherence: diet }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      toast({ title: "Check-in saved!", description: "Great job! Keep it up." });
      router.push("/client/dashboard");
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Today's Check-In</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="weight">Current Weight (kg)</Label>
            <Input id="weight" type="number" step="0.1" placeholder="75.5"
              {...register("weight", { valueAsNumber: true })} />
          </div>

          <SliderInput label="Energy Level" value={energy} onChange={setEnergy} />
          <SliderInput label="Diet Adherence" value={diet} onChange={setDiet} />

          <div className="space-y-2">
            <Label htmlFor="sleepHours">Sleep Hours</Label>
            <Input id="sleepHours" type="number" step="0.5" min="0" max="24" placeholder="7.5"
              {...register("sleepHours", { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientNotes">Notes (optional)</Label>
            <Textarea id="clientNotes" placeholder="How are you feeling? Any issues?"
              {...register("clientNotes")} rows={3} />
          </div>

          {recentCheckIns.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Last check-in: {formatDate(recentCheckIns[0].date)}
              {recentCheckIns[0].weight && ` — ${recentCheckIns[0].weight} kg`}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Check-In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
