import { socialLinks } from "@/lib/content";

export default function Footer() {
  const activeLinks = socialLinks.filter((link) => link.href);

  return (
    <footer className="border-t border-border/70 bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Thiago — página profissional pessoal, dentro do ecossistema{" "}
          <span className="text-foreground">Valion Sistemas</span>.
        </p>

        {activeLinks.length > 0 && (
          <div className="flex gap-4">
            {activeLinks.map((link) => (
              <a
                key={link.label}
                href={link.href ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
