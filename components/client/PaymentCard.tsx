"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  planId: string;
  className?: string;
}

export function PaymentCheckoutButton({ planId, className }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const { url, error } = await res.json();
      if (error) {
        toast({ variant: "destructive", title: "Error", description: error });
        return;
      }
      window.location.href = url;
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={isLoading} className={className}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Subscribe Now
    </Button>
  );
}
