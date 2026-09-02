import type { Metadata } from "next";
import { contactInfo, socialLinks } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com Thiago — e-mail, WhatsApp, GitHub e LinkedIn.",
};

export default function ContatoPage() {
  const github = socialLinks.find((link) => link.label === "GitHub");
  const linkedin = socialLinks.find((link) => link.label === "LinkedIn");

  const channels = [
    {
      label: "E-mail",
      value: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
    },
    {
      label: "WhatsApp",
      value: contactInfo.whatsappDisplay,
      href: `https://wa.me/${contactInfo.whatsappNumber}`,
    },
    github?.href && {
      label: "GitHub",
      value: github.href.replace("https://", ""),
      href: github.href,
    },
    linkedin?.href && {
      label: "LinkedIn",
      value: linkedin.href.replace("https://", ""),
      href: linkedin.href,
    },
  ].filter((channel): channel is { label: string; value: string; href: string } => Boolean(channel));

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-20 sm:pt-28">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        Página 04
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Contato
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
        O melhor caminho é direto — e-mail ou WhatsApp. GitHub e LinkedIn ficam
        aqui também, se preferir conhecer o trabalho antes de falar comigo.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {channels.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target={channel.href.startsWith("http") ? "_blank" : undefined}
            rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
            className="reveal rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {channel.label}
            </p>
            <p className="mt-2 text-base font-medium text-foreground">
              {channel.value}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
