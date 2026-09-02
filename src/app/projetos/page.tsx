import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projetos",
  description: "Projetos reais desenvolvidos por Thiago.",
};

export default function ProjetosPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pt-28">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Página 02 · Projetos
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Projetos
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        Projetos reais, não maquetes. Cada um aqui foi de fato projetado e construído —
        com problema, solução, arquitetura e decisões técnicas documentadas.
      </p>

      <div className="mt-12 max-w-xl">
        {projects.map((project) =>
          project.slug === "encanto" ? (
            <ProjectCard
              key={project.slug}
              project={project}
              tagline="Sistema completo de gestão e operação para um negócio real de alimentação, multi-tenant e em produção."
              description="Plataforma completa para operação de pedidos online, com catálogo, checkout, fidelidade, cálculo de taxa por distância, área do cliente e painel administrativo — projetada e construída do zero para um negócio real."
              showAuthorship
            />
          ) : (
            <ProjectCard key={project.slug} project={project} />
          ),
        )}
      </div>
    </section>
  );
}
