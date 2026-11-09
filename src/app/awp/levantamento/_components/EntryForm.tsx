"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BASE_PATH_CLIENT, readStored, writeStored } from "./client-storage";

const NAME_KEY = "awp-lv-nome";

export default function EntryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // O navegador lembra só o nome; o código nunca é guardado.
  useEffect(() => {
    const saved = readStored(NAME_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do armazenamento local após montar
    if (saved) setName(saved);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (name.trim().replace(/\s+/g, " ").length < 2) return setError("Informe seu nome completo.");
    if (!code.trim()) return setError("Informe o código de acesso.");
    setSending(true);
    try {
      const res = await fetch(`${BASE_PATH_CLIENT}/api/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; name?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar. Tente de novo.");
        return;
      }
      writeStored(NAME_KEY, data.name ?? name);
      router.refresh();
    } catch {
      setError("Sem conexão com a internet. Verifique e tente de novo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Agricultural Wealth Project</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Questionário de regras de negócio</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        Suas respostas vão ajudar a definir como o AWP calcula o custo da produção de mandioca. São 36 perguntas em
        7 módulos. Tudo é salvo automaticamente: você pode parar e continuar depois.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div>
          <label htmlFor="nome" className="block text-base font-semibold">
            Seu nome completo
          </label>
          <input
            id="nome"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Ex.: Manoel Oliveira"
          />
        </div>
        <div>
          <label htmlFor="codigo" className="block text-base font-semibold">
            Código de acesso
          </label>
          <input
            id="codigo"
            autoComplete="off"
            autoCapitalize="none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1.5 text-sm text-muted">Recebido junto com o link do questionário.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-opacity disabled:opacity-60"
        >
          {sending ? "Entrando…" : "Começar"}
        </button>

        <p className="text-xs leading-relaxed text-muted">
          A identificação é feita pelo nome que você informar; não há senha individual. Suas respostas ficam ligadas a
          este aparelho e outros participantes não conseguem vê-las.
        </p>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href={`${BASE_PATH_CLIENT}/teste-microfone`} className="font-medium text-primary underline-offset-4 hover:underline">
          Testar o microfone deste aparelho
        </Link>
      </p>
    </main>
  );
}
