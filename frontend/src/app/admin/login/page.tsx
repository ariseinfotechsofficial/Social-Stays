"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import logo from "@admin/assets/logo.png";
import { Button } from "@admin/components/ui/button";
import { Field, Input } from "@admin/components/ui/form";
import { ApiError, api } from "@admin/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/auth/login", { method: "POST", json: { email, password } });
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Is the backend running?");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-[16px] border border-line bg-white p-7 shadow-[0_30px_60px_-40px_rgb(42_36_27/0.45)]">
      <Image src={logo} alt="Social Stays" className="h-12 w-auto" priority />
      <h1 className="type-title mt-6">Sign in</h1>
      <p className="mt-1 text-[0.875rem] text-ink-soft">Admin panel for the team and villa owners.</p>
      <div className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
      </div>
      {error && (
        <p className="mt-4 rounded-[8px] bg-error-soft px-3 py-2 text-[0.875rem] font-medium text-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-6 w-full" loading={busy}>
        Sign in
      </Button>
      <p className="mt-4 text-[0.75rem] text-ink-soft">Forgot your password? Ask a Super Admin to reset it from Users.</p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-sand px-4 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
