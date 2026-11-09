"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BASE_PATH_CLIENT } from "../_components/client-storage";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_PATH_CLIENT}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return setError(data.error ?? "Não foi possível entrar.");
      setPassword("");
      router.refresh();
    } catch {
      setError("Sem conexão.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Painel do levantamento</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <label htmlFor="senha" className="block text-sm font-semibold">
            Senha do administrador
          </label>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending || !password}
          className="w-full rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground disabled:opacity-60"
        >
          {sending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
