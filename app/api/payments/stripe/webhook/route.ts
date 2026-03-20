import { NextRequest, NextResponse } from "next/server";
import { constructStripeEvent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(body, signature);
  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { clientId, organizationId } = session.metadata ?? {};

        if (clientId && organizationId && session.payment_intent) {
          await prisma.clientPayment.updateMany({
            where: { stripePaymentIntentId: session.payment_intent as string },
            data: { status: "PAID" },
          });

          // Notify org admin
          const orgAdmin = await prisma.user.findFirst({
            where: { organizationId, role: "ORG_ADMIN" },
          });
          if (orgAdmin) {
            await prisma.notification.create({
              data: {
                userId: orgAdmin.id,
                type: "PAYMENT_RECEIVED",
                title: "Payment Received",
                body: `A client payment has been received`,
                relatedId: session.payment_intent as string,
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "ACTIVE", status: "ACTIVE" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await prisma.organization.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "CANCELLED", status: "SUSPENDED" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
