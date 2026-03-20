import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createStripeCustomer, createCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await req.json();
  const orgId = session.user.organizationId!;

  const plan = await prisma.orgSubscriptionPlan.findUnique({
    where: { id: planId },
    include: { organization: true },
  });

  if (!plan || plan.organizationId !== orgId || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (!plan.stripePriceId) {
    return NextResponse.json({ error: "This plan is not configured for payment" }, { status: 400 });
  }

  // Get or create Stripe customer for this client
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  let customerId: string;

  // For simplicity, create a new customer each time (in prod, store per-client)
  customerId = await createStripeCustomer(user!.email, user!.name);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutUrl = await createCheckoutSession({
    priceId: plan.stripePriceId,
    customerId,
    clientId: session.user.id,
    organizationId: orgId,
    successUrl: `${appUrl}/client/payments?success=true`,
    cancelUrl: `${appUrl}/client/payments?cancelled=true`,
  });

  return NextResponse.json({ url: checkoutUrl });
}
