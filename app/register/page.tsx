import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { RegisterForm } from "@/components/marketing/RegisterForm";

export const metadata = { title: "Register Your Organisation — FitPR" };

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const { plan } = await searchParams;
  const validPlan = ["STARTER", "GROWTH", "PRO"].includes(plan ?? "") ? plan : "STARTER";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Mini navbar */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-gray-900">FitPR</span>
          </Link>
          <div className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Register Your Organisation
          </h1>
          <p className="text-gray-600">
            Fill in the details below. Our team will review your application and send your admin an
            invite within 24 hours.
          </p>
        </div>

        <RegisterForm defaultPlan={validPlan} />
      </div>
    </div>
  );
}
