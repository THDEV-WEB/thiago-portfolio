import Link from "next/link";
import type { Project } from "@/lib/content";

type ProjectCardProps = {
  project: Project;
  tagline?: string;
  description?: string;
  showAuthorship?: boolean;
};

export default function ProjectCard({
  project,
  tagline,
  description,
  showAuthorship = false,
}: ProjectCardProps) {
  return (
    <Link
      href={project.href}
      className="reveal group block rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {project.status}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-muted">{tagline ?? project.tagline}</p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        {description ?? project.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <span
            key={tech}
            className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted"
          >
            {tech}
          </span>
        ))}
      </div>
      {showAuthorship && (
        <p className="mt-5 text-xs font-medium text-muted/70">
          Projeto autoral · Arquitetura, desenvolvimento e manutenção
        </p>
      )}
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Ver case completo
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
