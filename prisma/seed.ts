import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("SuperAdmin@123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@fitos.com" },
    update: {},
    create: {
      email: "superadmin@fitos.com",
      password: hashedPassword,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      organizationId: null,
      isActive: true,
    },
  });

  // Seed platform plans
  await prisma.platformPlan.upsert({
    where: { name: "STARTER" },
    update: {},
    create: {
      name: "STARTER",
      price: 4900, // $49/month
      maxTrainers: 3,
      maxClients: 30,
      features: ["Basic analytics", "Email support", "Up to 3 trainers"],
    },
  });

  await prisma.platformPlan.upsert({
    where: { name: "GROWTH" },
    update: {},
    create: {
      name: "GROWTH",
      price: 9900, // $99/month
      maxTrainers: 10,
      maxClients: 100,
      features: [
        "Advanced analytics",
        "Priority support",
        "Up to 10 trainers",
        "Custom branding",
      ],
    },
  });

  await prisma.platformPlan.upsert({
    where: { name: "PRO" },
    update: {},
    create: {
      name: "PRO",
      price: 19900, // $199/month
      maxTrainers: -1, // unlimited
      maxClients: -1, // unlimited
      features: [
        "Full analytics suite",
        "Dedicated support",
        "Unlimited trainers",
        "Unlimited clients",
        "White-label option",
        "API access",
      ],
    },
  });

  console.log("✅ Seeded Super Admin:", superAdmin.email);
  console.log("✅ Seeded platform plans: STARTER, GROWTH, PRO");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
