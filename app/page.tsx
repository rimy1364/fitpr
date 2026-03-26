import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, getDefaultRedirect } from "@/lib/auth";
import Link from "next/link";
import {
  Dumbbell,
  Users,
  BarChart3,
  Video,
  CheckSquare,
  ShieldCheck,
  Zap,
  ChevronRight,
  Activity,
  UserCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "FitPR — The Fitness Management Platform",
  description:
    "One platform for admins, trainers, and clients. Create personalised programs, track progress, and grow your fitness business.",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(getDefaultRedirect(session.user.role));

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-emerald-500" />
            <span className="text-xl font-bold tracking-tight text-white">FitPR</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#roles" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-emerald-500/20">
            <Zap className="h-4 w-4" />
            The all-in-one fitness management platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Manage Your Fitness
            <br />
            <span className="text-emerald-500">Business Smarter</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            One platform for admins, trainers, and clients. Build personalised programs, track
            progress, review form videos, and grow your fitness business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 text-base"
              asChild
            >
              <Link href="/register">
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              asChild
            >
              <Link href="/login">Sign In to Dashboard</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-5">
            14-day free trial · No credit card required · Cancel any time
          </p>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Accounts" },
            { value: "10K+", label: "Trainers" },
            { value: "100K+", label: "Active Clients" },
            { value: "99.9%", label: "Uptime" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-emerald-500">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need to Run Your Gym
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From client onboarding to progress reporting, FitPR covers every aspect of your
              fitness business in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "Multi-Tenant Admin",
                desc: "Manage multiple fitness accounts with full isolation. Each account gets its own dashboard, trainers, and clients with role-based access.",
              },
              {
                icon: Users,
                title: "Trainer Management",
                desc: "Invite trainers, assign clients, track workloads and monitor all trainer-client activity from one admin dashboard.",
              },
              {
                icon: BarChart3,
                title: "Progress Tracking",
                desc: "Track weight, body measurements, and custom goals over time with beautiful charts, streaks, and weekly summaries.",
              },
              {
                icon: Dumbbell,
                title: "Workout Programs",
                desc: "Build day-by-day workout programs with exercises, sets, reps, and rest periods — then assign them directly to clients.",
              },
              {
                icon: Video,
                title: "Form Video Review",
                desc: "Clients upload exercise videos; trainers review and provide personalised feedback to correct technique and prevent injury.",
              },
              {
                icon: CheckSquare,
                title: "Daily Check-Ins",
                desc: "Clients log daily weight, energy levels, sleep, and diet adherence. Trainers see streaks, trends, and actionable notes.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 hover:border-emerald-800 hover:bg-gray-900 transition-all"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                  <f.icon className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ──────────────────────────────────────────── */}
      <section id="roles" className="bg-gray-900 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Built for Every Role</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Each user gets a tailored experience designed for their specific responsibilities and
              goals.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                role: "For Admins",
                color: "bg-blue-500",
                badge: "ORG_ADMIN",
                items: [
                  "Invite and manage trainers",
                  "Onboard clients with custom plans",
                  "Monitor org-wide progress",
                  "Set up subscription plans",
                  "View payments and revenue",
                ],
              },
              {
                icon: Activity,
                role: "For Trainers",
                color: "bg-emerald-500",
                badge: "TRAINER",
                items: [
                  "View all assigned clients",
                  "Build custom workout programs",
                  "Review client form videos",
                  "Add check-in notes and feedback",
                  "Track client progress charts",
                ],
              },
              {
                icon: UserCheck,
                role: "For Clients",
                color: "bg-purple-500",
                badge: "CLIENT",
                items: [
                  "Complete daily check-ins",
                  "Follow personalised workout plans",
                  "Upload exercise form videos",
                  "Track weight and measurements",
                  "View personal progress charts",
                ],
              },
            ].map((r) => (
              <div key={r.role} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 ${r.color} rounded-lg flex items-center justify-center`}>
                    <r.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{r.role}</h3>
                    <span className="text-xs text-gray-500 font-mono">{r.badge}</span>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-gray-400 text-sm">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {[
              {
                name: "Starter",
                price: 4900,
                popular: false,
                desc: "Perfect for small gyms just getting started",
                features: [
                  "Up to 3 Trainers",
                  "Up to 30 Clients",
                  "Workout Programs",
                  "Daily Check-In Tracking",
                  "Progress Charts",
                  "Email Support",
                ],
              },
              {
                name: "Growth",
                price: 9900,
                popular: true,
                desc: "For growing fitness businesses",
                features: [
                  "Up to 10 Trainers",
                  "Up to 100 Clients",
                  "Everything in Starter",
                  "Form Video Reviews",
                  "Advanced Analytics",
                  "Priority Support",
                ],
              },
              {
                name: "Pro",
                price: 19900,
                popular: false,
                desc: "Unlimited scale for large accounts",
                features: [
                  "Unlimited Trainers",
                  "Unlimited Clients",
                  "Everything in Growth",
                  "Custom Branding",
                  "API Access",
                  "Dedicated Account Manager",
                ],
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-6 relative ${
                  p.popular
                    ? "border-emerald-500 bg-gray-900 shadow-xl shadow-emerald-500/10 scale-105"
                    : "border-gray-800 bg-gray-900/50"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-xl text-white">{p.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{p.desc}</p>
                <div className="mt-5 mb-6">
                  <span className="text-4xl font-extrabold text-white">₹{p.price.toLocaleString("en-IN")}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    p.popular
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                  variant={p.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={`/register?plan=${p.name.toUpperCase()}`}>Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="bg-emerald-500 py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Fitness Business?
          </h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Join hundreds of fitness businesses already using FitPR to manage clients, trainers,
            and growth — all from one platform.
          </p>
          <Button
            size="lg"
            className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 text-base font-semibold"
            asChild
          >
            <Link href="/register">
              Register Your Business
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-emerald-200 text-sm mt-4">
            Our team reviews all applications within 24 hours.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-emerald-500" />
              <span className="text-white font-bold text-lg">FitPR</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#roles" className="hover:text-white transition-colors">How It Works</a>
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} FitPR. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
