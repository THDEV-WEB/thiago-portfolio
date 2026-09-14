import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Encanto System",
  description:
    "Case técnico do Encanto System: sistema real de pedidos para delivery, multi-tenant, construído do zero por Thiago.",
};

const sections = [
  {
    title: "Problema",
    body: "Pequenos negócios de delivery dependem de plataformas de terceiros ou de processos manuais (WhatsApp, papel, planilhas) para receber e organizar pedidos — com pouco controle sobre dados, identidade de marca e experiência do cliente.",
  },
  {
    title: "Solução",
    body: "Um sistema de pedidos completo e próprio, pensado primeiro para resolver a operação real de um negócio: catálogo, checkout, acompanhamento de pedido, fidelidade e área do cliente na ponta do consumidor; catálogo, operação e relatórios na ponta do administrador. A partir dessa base em produção, a arquitetura evoluiu para suportar múltiplos negócios na mesma estrutura, com isolamento adequado de dados entre contas — o caminho natural de um sistema que nasce resolvendo um problema real e amadurece para atender mais de um.",
  },
  {
    title: "Arquitetura",
    body: "O frontend é construído em React com Vite; Supabase (PostgreSQL) resolve banco de dados e autenticação. A decisão central de arquitetura foi não deixar o isolamento de dados depender só da aplicação: regras de acesso sensíveis — como o isolamento entre contas em um cenário multi-tenant — são aplicadas diretamente no banco, via Row Level Security, e não apenas na interface. O deploy roda na Vercel, com integração contínua fazendo parte do fluxo normal de engenharia, não uma etapa manual.",
  },
  {
    title: "Funcionalidades",
    body: "Na experiência do cliente: catálogo por categorias com busca tolerante a acentos, carrinho e checkout, cálculo de taxa de entrega por distância real, área do cliente com histórico e recompra, e programa de fidelidade. Na operação administrativa: painel completo de gestão do catálogo e dos pedidos, com notificação automática de novos pedidos via WhatsApp.",
  },
  {
    title: "Segurança",
    body: "Em um sistema multi-tenant, o maior risco é dados vazarem entre contas diferentes — por isso o isolamento é garantido por políticas de Row Level Security no banco, não só na aplicação. Além da autenticação por e-mail e Google, o projeto usa rate limiting em endpoints públicos para conter abuso, cabeçalhos de Content Security Policy contra scripts não confiáveis, e passa por auditorias de proteção de dados de forma recorrente ao longo da evolução do sistema.",
  },
  {
    title: "Testes",
    body: "A suíte de testes end-to-end roda com Playwright e cobre os fluxos críticos do sistema — login, checkout, área do cliente e painel administrativo — em um ambiente dedicado, separado do banco de produção.",
  },
  {
    title: "Infraestrutura",
    body: "Deploy contínuo na Vercel, com Sentry capturando e monitorando erros em produção e acompanhamento de performance (Core Web Vitals) como parte da rotina de manutenção do sistema.",
  },
  {
    title: "Aprendizados",
    body: "Da primeira versão até aqui, o projeto passou por rodadas reais de otimização de performance, correção de falhas de segurança encontradas em auditoria própria e evolução de arquitetura single-tenant para multi-tenant — o tipo de decisão que só aparece quando um sistema é mantido de verdade, não apenas entregue uma vez.",
  },
];

export default function EncantoProjectPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-20 sm:pt-28">
      <Link href="/projetos" className="text-sm font-semibold text-primary hover:underline">
        ← Voltar para projetos
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
        Case técnico
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Encanto System
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Sistema real de pedidos para delivery — projetado, construído e mantido por
        Thiago, em produção.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Em produção
        </span>
        <span className="text-sm font-medium text-muted/80">
          Projeto autoral · Arquitetura, desenvolvimento, testes e evolução
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["React", "Vite", "JavaScript", "Supabase", "PostgreSQL", "Playwright", "Vercel"].map(
          (tech) => (
            <span
              key={tech}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {tech}
            </span>
          ),
        )}
      </div>

      <div className="mt-14 space-y-12">
        {sections.map((section) => (
          <section key={section.title} className="reveal">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
              {section.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-foreground">
              {section.body}
            </p>
          </section>
        ))}

        <section className="reveal border-t border-border/70 pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
            Quer ver o sistema em funcionamento?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-foreground">
            Conheça o Encanto em produção ou consulte o código do projeto.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://encanto.valionsistemas.com.br/encanto"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              Acessar sistema →
            </a>
            <a
              href="https://github.com/THDEV-WEB/Encanto-system"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              Ver GitHub →
            </a>
          </div>
        </section>
      </div>
    </article>
  );
}
