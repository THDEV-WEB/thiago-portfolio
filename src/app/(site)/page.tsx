import Link from "next/link";
import ProfilePhoto from "@/components/ProfilePhoto";
import ProjectCard from "@/components/ProjectCard";
import {
  capabilities,
  positioningStatementHome,
  projects,
  socialLinks,
  techStack,
} from "@/lib/content";

export default function Home() {
  const activeSocialLinks = socialLinks.filter((link) => link.href);
  const featuredProject = projects[0];

  return (
    <>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Thiago
            </h1>
            <p className="mt-3 text-xl font-medium text-muted sm:text-2xl">
              Desenvolvedor de Software
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg">
              Estudante de Análise e Desenvolvimento de Sistemas, construindo uma
              carreira sólida em tecnologia com foco em desenvolvimento de software e
              aplicações reais.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/projetos"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                Ver projetos
              </Link>
              <Link
                href="/trajetoria"
                className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                Conhecer minha trajetória
              </Link>
            </div>

            {activeSocialLinks.length > 0 && (
              <div className="mt-8 flex gap-5 text-sm font-medium text-muted">
                {activeSocialLinks.map((link) =>
                  link.href?.startsWith("/") ? (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            )}
          </div>

          <ProfilePhoto className="mx-auto sm:mx-0" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="reveal max-w-3xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
            Sobre mim
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground">
            Sou estudante de Análise e Desenvolvimento de Sistemas, atualmente no
            último semestre da graduação, e desenvolvedor de software, construindo
            minha trajetória em tecnologia de forma prática e consciente. Minha
            experiência profissional começou cedo e me proporcionou contato direto com
            pessoas, atendimento, responsabilidade, operação e diferentes realidades de
            negócio — experiências que hoje influenciam a forma como penso e
            desenvolvo software.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground">
            Ao direcionar minha carreira para tecnologia, passei a aprofundar meus
            estudos e a transformar conhecimento em aplicações reais. Hoje desenvolvo
            sistemas web completos, trabalhando com frontend, dados, backend,
            autenticação, segurança, testes e infraestrutura.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-foreground">
            Meu principal projeto é o{" "}
            <a
              href="https://encanto.valionsistemas.com.br/encanto"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Encanto – Açaí &amp; Marmitas
            </a>
            , uma aplicação real construída do zero e utilizada em produção. Mais do
            que um projeto de portfólio, ele representa a forma como escolhi aprender:
            enfrentando problemas reais, tomando decisões técnicas e evoluindo
            continuamente.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="reveal text-sm font-semibold uppercase tracking-widest text-primary">
          O que eu desenvolvo
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <div
              key={capability.title}
              className="reveal rounded-2xl border border-border bg-surface p-6 transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-foreground">{capability.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {featuredProject && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="reveal text-sm font-semibold uppercase tracking-widest text-primary">
            Projeto em destaque
          </h2>
          <div className="mt-8 max-w-2xl">
            <ProjectCard project={featuredProject} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="reveal text-sm font-semibold uppercase tracking-widest text-primary">
          Tecnologias
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {Object.entries(techStack).map(([category, items]) => (
            <div key={category} className="reveal">
              <h3 className="font-semibold text-foreground">{category}</h3>
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li key={item} className="text-sm text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-10">
        <div className="reveal max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
            Formação
          </h2>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Análise e Desenvolvimento de Sistemas (ADS)
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            <span className="font-semibold text-foreground">
              Último semestre da graduação.
            </span>{" "}
            Formação voltada à análise, desenvolvimento e construção de sistemas de
            software.
          </p>
        </div>
      </section>

      <section className="border-t border-border/70 bg-surface">
        <div className="reveal mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            &ldquo;{positioningStatementHome}&rdquo;
          </p>
          <p className="mt-6 text-base leading-relaxed text-muted">
            Quero integrar uma equipe de desenvolvimento onde possa aplicar o que venho
            construindo, contribuir com problemas reais e continuar evoluindo
            profissionalmente no longo prazo.
          </p>
          <Link
            href="/trajetoria"
            className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            Conhecer minha trajetória →
          </Link>
        </div>
      </section>
    </>
  );
}
