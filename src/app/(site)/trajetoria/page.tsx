import type { Metadata } from "next";
import Link from "next/link";
import Timeline from "@/components/Timeline";
import { positioningStatement, timeline } from "@/lib/content";

export const metadata: Metadata = {
  title: "Trajetória profissional",
  description:
    "Como Thiago chegou até aqui: do primeiro contato com trabalho, ainda criança, até a decisão consciente de construir uma carreira em tecnologia.",
};

export default function TrajetoriaPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-20 sm:pt-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Página 03
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Minha trajetória profissional
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Minha relação com trabalho começou muito antes da tecnologia. Cresci numa
          cidade pequena, onde as oportunidades eram mais escassas — e foi ali que
          aprendi, cedo, sobre responsabilidade, atendimento e confiança. Cada etapa
          abaixo abriu caminho para a seguinte.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        <Timeline entries={timeline} />
      </section>

      <section className="border-t border-border/70 bg-surface">
        <div className="reveal mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-lg leading-relaxed text-foreground">
            Minha trajetória profissional foi construída por diferentes experiências
            que me ajudaram a desenvolver maturidade, responsabilidade e clareza sobre
            o profissional que quero me tornar.
          </p>
          <p className="mt-6 text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            &ldquo;{positioningStatement}&rdquo;
          </p>
          <Link
            href="/projetos"
            className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            Conheça meus projetos →
          </Link>
        </div>
      </section>
    </>
  );
}
