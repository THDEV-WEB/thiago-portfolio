import type { Metadata, Viewport } from "next";

const title = "AWP — Levantamento de regras de negócio";
const description =
  "Questionário de levantamento das regras de negócio do AWP — Sistema de Custeio de Produção de Mandioca.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  openGraph: { title, description, type: "website", siteName: "AWP" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f9fd",
};

export default function LevantamentoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex-1 bg-background text-foreground">
      <header className="border-b border-border/70 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="rounded-lg bg-primary px-2 py-1 text-xs font-bold tracking-wide text-primary-foreground">
            AWP
          </span>
          <p className="text-sm font-semibold leading-tight text-foreground">
            Levantamento de regras de negócio
          </p>
        </div>
      </header>
      {children}
    </div>
  );
}
