import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";

// Route prefix → allowed roles
const ROLE_ROUTES: Record<string, Role[]> = {
  "/superadmin": ["SUPER_ADMIN"],
  "/admin": ["ORG_ADMIN"],
  "/trainer": ["TRAINER"],
  "/client": ["CLIENT"],
  "/onboarding": ["CLIENT"],
};

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: { role?: Role; id?: string; organizationId?: string | null } | null } }) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = token.role as Role | undefined;

    // Find which route group this path belongs to
    for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(prefix)) {
        if (!userRole || !allowedRoles.includes(userRole)) {
          // Redirect to appropriate dashboard or login
          const redirectUrl = userRole
            ? getRoleHome(userRole)
            : "/login";
          return NextResponse.redirect(new URL(redirectUrl, req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // Let the middleware function above handle redirects;
        // just require a token to exist for protected routes
        return !!token;
      },
    },
  }
);

function getRoleHome(role: Role): string {
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

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*",
    "/trainer/:path*",
    "/client/:path*",
    "/onboarding/:path*",
  ],
};
