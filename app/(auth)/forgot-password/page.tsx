import { Dumbbell } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white">FitPR</h1>
          <p className="text-gray-400 mt-2">Reset your password</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
