"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, login } from "@/lib/api";
import { tokenService } from "@/lib/auth/tokenService";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import PhoneNumberInput from "@/components/form/PhoneNumberInput";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup({ fullName, email, password, phone });
      // Auto-login after signup for smoother UX
      const res = await login({ email, password });
      const accessToken = res?.data?.accessToken;
      const refreshToken = res?.data?.refreshToken;
      if (accessToken && refreshToken) {
        tokenService.setTokens(accessToken, refreshToken);
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#0b1020] px-6 py-8 shadow-theme-lg border border-gray-800">
        <div className="mb-6 text-center">
          <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Leadrat CRM</h1>
          <p className="mt-2 text-2xl font-semibold text-white">Create your account</p>
          <p className="mt-1 text-xs text-gray-500">Join Leadrat CRM to manage your pre-sales pipeline</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-200">Full name</label>
            <input
              className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-100 outline-none ring-0 focus:border-brand-500 focus:bg-gray-900 focus:ring-1 focus:ring-brand-500 placeholder:text-gray-500"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={3}
              required
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-200">Email (@leadrat.com)</label>
            <input
              className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-100 outline-none ring-0 focus:border-brand-500 focus:bg-gray-900 focus:ring-1 focus:ring-brand-500 placeholder:text-gray-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@leadrat.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-200">Password</label>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 pr-11 text-sm text-gray-100 outline-none ring-0 focus:border-brand-500 focus:bg-gray-900 focus:ring-1 focus:ring-brand-500 placeholder:text-gray-500"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-gray-800">
                  {showPassword ? (
                    <EyeCloseIcon className="h-4 w-4 fill-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 fill-gray-400" />
                  )}
                </span>
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Min 8 characters, including a letter and a number.</p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-300">Phone Number</label>
            <PhoneNumberInput
              value={phone}
              onChange={(value) => setPhone(value)}
              placeholder="Your phone number"
              className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-gray-100 outline-none ring-0 focus:border-brand-500 focus:bg-gray-900 focus:ring-1 focus:ring-brand-500 placeholder:text-gray-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </button>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300">
                Sign in
              </Link>
            </p>
          </form>
      </div>
    </div>
  );
}
