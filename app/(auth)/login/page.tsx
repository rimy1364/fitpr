import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, getDefaultRedirect } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { Dumbbell } from "lucide-react";

export const metadata = { title: "Sign In" };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(getDefaultRedirect(session.user.role));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FitOS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            The fitness platform for modern organizations
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
