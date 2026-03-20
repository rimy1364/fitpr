import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      organizationId: string | null;
      avatar: string | null;
    };
  }

  interface User {
    id: string;
    role: Role;
    organizationId: string | null;
    avatar: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    organizationId: string | null;
    avatar: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        // For org users, verify org is active
        if (user.organizationId) {
          const org = await prisma.organization.findUnique({
            where: { id: user.organizationId },
            select: { status: true },
          });
          if (!org || org.status === "SUSPENDED" || org.status === "CANCELLED") {
            throw new Error("Organization is suspended or inactive.");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          avatar: user.avatar,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.organizationId = token.organizationId;
      session.user.avatar = token.avatar;
      return session;
    },
    async signIn({ user, account }) {
      // Google OAuth: find existing user by email (no self-registration)
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) {
          // Block Google sign-in for new users — all accounts are invite-only
          return false;
        }
        // Update avatar from Google if not set
        if (!existingUser.avatar && user.image) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { avatar: user.image },
          });
        }
        // Inject our DB user data into the token flow
        user.id = existingUser.id;
        user.role = existingUser.role;
        user.organizationId = existingUser.organizationId;
        user.avatar = existingUser.avatar ?? user.image ?? null;
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Role-based redirect helper
export function getDefaultRedirect(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/superadmin/dashboard";
    case "ORG_ADMIN":
      return "/admin/dashboard";
    case "TRAINER":
      return "/trainer/dashboard";
    case "CLIENT":
      return "/client/dashboard";
    default:
      return "/login";
  }
}
