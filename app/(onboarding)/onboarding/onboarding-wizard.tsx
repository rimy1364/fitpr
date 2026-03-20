"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Dumbbell } from "lucide-react";

type Step1Data = z.infer<typeof onboardingStep1Schema>;
type Step2Data = z.infer<typeof onboardingStep2Schema>;

interface Props { userName: string }

export function OnboardingWizard({ userName }: Props) {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form1 = useForm<Step1Data>({ resolver: zodResolver(onboardingStep1Schema), defaultValues: { name: userName } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(onboardingStep2Schema) });

  const onStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2 = async (data: Step2Data) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/client/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...step1Data, ...data }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Welcome to FitOS!", description: "Your profile is all set." });
      router.push("/client/dashboard");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const TOTAL_STEPS = 2;
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-4">
          <Dumbbell className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Welcome to FitOS!</h1>
        <p className="text-muted-foreground">Let's set up your profile. Step {step} of {TOTAL_STEPS}</p>
      </div>

      <Progress value={progress} className="mb-6 h-2" />

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input id="name" {...form1.register("name")} />
                {form1.formState.errors.name && <p className="text-sm text-destructive">{form1.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" {...form1.register("phone")} />
              </div>
              <Button type="submit" className="w-full">Next →</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Your Fitness Goals</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Goal *</Label>
                <Select onValueChange={(v) => form2.setValue("goal", v as Step2Data["goal"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEIGHT_LOSS">Weight Loss</SelectItem>
                    <SelectItem value="MUSCLE_GAIN">Muscle Gain</SelectItem>
                    <SelectItem value="TRANSFORMATION">Body Transformation</SelectItem>
                    <SelectItem value="FITNESS">General Fitness</SelectItem>
                  </SelectContent>
                </Select>
                {form2.formState.errors.goal && <p className="text-sm text-destructive">{form2.formState.errors.goal.message}</p>}
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Current Weight (kg) *</Label>
                  <Input type="number" step="0.1" placeholder="75" {...form2.register("startWeight", { valueAsNumber: true })} />
                  {form2.formState.errors.startWeight && <p className="text-sm text-destructive">{form2.formState.errors.startWeight.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Target Weight (kg) *</Label>
                  <Input type="number" step="0.1" placeholder="65" {...form2.register("targetWeight", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Height (cm) *</Label>
                <Input type="number" step="1" placeholder="170" {...form2.register("height", { valueAsNumber: true })} />
                {form2.formState.errors.height && <p className="text-sm text-destructive">{form2.formState.errors.height.message}</p>}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
