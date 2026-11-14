"use client";

import { useRouter } from "next/navigation";
import { BASE_PATH_CLIENT } from "./client-storage";

/**
 * Fora da fase de questionário, para quem entrou sem respostas (outro
 * aparelho, aba anônima, cookie apagado) ou não foi identificado.
 */
export default function ReviewUnavailable({ name }: { name: string }) {
  const router = useRouter();

  async function switchParticipant() {
    await fetch(`${BASE_PATH_CLIENT}/api/participant`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight">Olá, {name}</h1>
        <p className="mt-3 text-base leading-relaxed">
          O questionário já foi respondido e agora está em revisão. Não encontramos respostas suas neste aparelho.
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Se você já respondeu em outro celular ou navegador, fale com o Thiago para recuperar o seu acesso. Suas
          respostas continuam guardadas.
        </p>
        <button
          type="button"
          onClick={switchParticipant}
          className="mt-4 min-h-11 text-sm font-medium text-primary hover:underline"
        >
          Entrar com outro nome
        </button>
      </section>
    </main>
  );
}
