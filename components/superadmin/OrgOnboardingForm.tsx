"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createOrgSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { generateSlug } from "@/lib/utils";

type FormData = z.infer<typeof createOrgSchema>;

export function OrgOnboardingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { plan: "STARTER" },
  });

  const orgName = watch("name");

  const onNameBlur = () => {
    if (orgName) setValue("slug", generateSlug(orgName));
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }

      toast({
        title: "Organization created!",
        description: `Invite email sent to ${data.adminEmail}`,
      });
      router.push(`/superadmin/organizations/${json.data.id}`);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Organization Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input id="name" placeholder="FitZone Delhi" {...register("name")} onBlur={onNameBlur} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input id="slug" placeholder="fitzone-delhi" {...register("slug")} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Organization Email *</Label>
            <Input id="email" type="email" placeholder="contact@fitzone.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 98765 43210" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Platform Plan *</Label>
              <Select defaultValue="STARTER" onValueChange={(v) => setValue("plan", v as "STARTER" | "GROWTH" | "PRO")}>
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Main St, City" {...register("address")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Admin Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An invite email will be sent to this person to set up their account.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Name *</Label>
              <Input id="adminName" placeholder="John Doe" {...register("adminName")} />
              {errors.adminName && <p className="text-sm text-destructive">{errors.adminName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input id="adminEmail" type="email" placeholder="admin@fitzone.com" {...register("adminEmail")} />
              {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create & Send Invite
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
