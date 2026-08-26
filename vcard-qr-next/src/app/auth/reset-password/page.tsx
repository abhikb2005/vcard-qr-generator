"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setComplete(true);
      setPassword("");
      setConfirmation("");
    } catch {
      setError("We could not update your password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl shadow-slate-950/50 sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-indigo-700">
          vCard QR Pro
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Choose a new password
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Make it something you have not used elsewhere.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {complete ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
              <div>
                <h2 className="font-bold">Password updated</h2>
                <p className="mt-1 text-sm leading-6">You can now sign in with your new password.</p>
              </div>
            </div>
            <Link
              href="/login"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-800">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-800">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating password…" : "Update password"}
            </button>
          </form>
        )}

        {!complete && (
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            Back to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
