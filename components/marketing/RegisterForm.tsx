"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createOrgSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, Dumbbell } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import Link from "next/link";

type FormData = z.infer<typeof createOrgSchema>;

export function RegisterForm({ defaultPlan }: { defaultPlan?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [orgName, setSubmittedName] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      plan: (defaultPlan as "STARTER" | "GROWTH" | "PRO") ?? "STARTER",
    },
  });

  const nameValue = watch("name");

  const onNameBlur = () => {
    if (nameValue) setValue("slug", generateSlug(nameValue));
  };

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/public/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      toast({ variant: "destructive", title: "Registration failed", description: json.error });
      return;
    }

    setSubmittedName(data.name);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Received!</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Thanks for registering <strong>{orgName}</strong> on FitPR. Our team will review your
          application and send an invite to your admin email within{" "}
          <strong>24 hours</strong>.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 max-w-sm mx-auto mb-8 text-sm text-emerald-800">
          Keep an eye on your inbox — the invite link will let you set your password and access
          the dashboard.
        </div>
        <Link href="/" className="text-sm text-emerald-600 hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organisation Details */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="h-5 w-5 text-emerald-500" />
            <h2 className="font-semibold text-gray-900">Organisation Details</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Organisation Name *</Label>
              <Input
                id="name"
                placeholder="FitZone Delhi"
                {...register("name")}
                onBlur={onNameBlur}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">URL Slug *</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 whitespace-nowrap">fitpr.app/</span>
                <Input
                  id="slug"
                  placeholder="fitzone-delhi"
                  {...register("slug")}
                  className="flex-1"
                />
              </div>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Organisation Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@fitzone.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan">Plan *</Label>
              <Select
                defaultValue={defaultPlan ?? "STARTER"}
                onValueChange={(v) => setValue("plan", v as "STARTER" | "GROWTH" | "PRO")}
              >
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Starter — $49/mo (3 trainers, 30 clients)</SelectItem>
                  <SelectItem value="GROWTH">Growth — $99/mo (10 trainers, 100 clients)</SelectItem>
                  <SelectItem value="PRO">Pro — $199/mo (Unlimited)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Main St, City" {...register("address")} />
          </div>
        </CardContent>
      </Card>

      {/* Admin Contact */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Admin Contact</h2>
            <p className="text-sm text-gray-500">
              This person will receive the invite to set up the admin account.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="adminName">Full Name *</Label>
              <Input id="adminName" placeholder="John Doe" {...register("adminName")} />
              {errors.adminName && (
                <p className="text-xs text-destructive">{errors.adminName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminEmail">Email Address *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@fitzone.com"
                {...register("adminEmail")}
              />
              {errors.adminEmail && (
                <p className="text-xs text-destructive">{errors.adminEmail.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 sm:flex-none sm:px-8"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Application
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Cancel</Link>
        </Button>
      </div>

      <p className="text-xs text-gray-400">
        By submitting, you agree to our Terms of Service. Your application will be reviewed by
        our team and you will receive an email once approved.
      </p>
    </form>
  );
}
