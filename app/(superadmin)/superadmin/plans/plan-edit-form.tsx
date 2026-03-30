"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Loader2 } from "lucide-react";

const schema = z.object({
  price: z.coerce.number().int().min(0, "Price must be 0 or more"),
  maxTrainers: z.coerce.number().int().min(-1, "Use -1 for unlimited"),
  maxClients: z.coerce.number().int().min(-1, "Use -1 for unlimited"),
  features: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Plan {
  id: string;
  name: string;
  price: number;
  maxTrainers: number;
  maxClients: number;
  features: unknown;
}

export function PlanEditForm({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      price: plan.price,
      maxTrainers: plan.maxTrainers,
      maxClients: plan.maxClients,
      features: Array.isArray(plan.features) ? (plan.features as string[]).join("\n") : "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: data.price,
          maxTrainers: data.maxTrainers,
          maxClients: data.maxClients,
          features: data.features.split("\n").map((f) => f.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to update plan");
      }
      toast({ title: "Plan updated", description: `${plan.name} has been updated.` });
      setOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {plan.name} Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹/month)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input id="price" type="number" step="1" min="0" className="pl-7" {...register("price")} />
            </div>
            <p className="text-xs text-muted-foreground">Enter amount in Indian Rupees (e.g. 4900)</p>
            {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxTrainers">Max Trainers</Label>
              <Input id="maxTrainers" type="number" {...register("maxTrainers")} />
              <p className="text-xs text-muted-foreground">-1 = unlimited</p>
              {errors.maxTrainers && <p className="text-xs text-destructive">{errors.maxTrainers.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxClients">Max Clients</Label>
              <Input id="maxClients" type="number" {...register("maxClients")} />
              <p className="text-xs text-muted-foreground">-1 = unlimited</p>
              {errors.maxClients && <p className="text-xs text-destructive">{errors.maxClients.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (one per line)</Label>
            <textarea
              id="features"
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder={"Workout Programs\nProgress Charts\nEmail Support"}
              {...register("features")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
