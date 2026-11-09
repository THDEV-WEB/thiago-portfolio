import type { Metadata } from "next";
import Link from "next/link";
import MicTest from "./MicTest";

export const metadata: Metadata = {
  title: { absolute: "AWP — Teste do microfone" },
  robots: { index: false, follow: false },
};

// Teste do reconhecimento de voz no aparelho. Nada é enviado ao banco.
export default function TesteMicrofonePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Teste do microfone</h1>
      <p className="mt-2 text-base leading-relaxed text-muted">
        Use esta página para conferir se o reconhecimento de voz funciona neste celular ou computador. O que você falar
        aqui não é salvo.
      </p>
      <MicTest />
      <p className="mt-8 text-sm">
        <Link href="/awp/levantamento" className="font-medium text-primary hover:underline">
          ← Voltar ao questionário
        </Link>
      </p>
    </main>
  );
}
