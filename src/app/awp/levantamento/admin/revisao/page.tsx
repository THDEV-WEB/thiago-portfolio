import type { Metadata } from "next";
import { connection } from "next/server";
import Review from "../../_components/Review";
import { loadAdminData } from "../../_lib/data";
import { loadSharedAnswers } from "../../_lib/review-data";
import { isAdmin } from "../../_lib/session";
import AdminLogin from "../AdminLogin";

export const metadata: Metadata = {
  title: { absolute: "AWP — Prévia da revisão" },
  robots: { index: false, follow: false },
};

// Prévia do administrador: a revisão como o Manoel ou o Cadene vê, só leitura.
export default async function ReviewPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  if (!process.env.AWP_DATABASE_URL || !process.env.AWP_ADMIN_PASSWORD) return null;
  if (!(await isAdmin())) return <AdminLogin />;

  const slot = (await searchParams).como === "cadene" ? "cadene" : "manoel";
  const [data, shared] = await Promise.all([loadAdminData(), loadSharedAnswers()]);
  const ids = new Set(
    data.participants.filter((p) => p.kind === "participant" && p.slot === slot).map((p) => p.id),
  );
  const person = data.participants.find((p) => ids.has(p.id) && data.answers.some((a) => a.participantId === p.id));
  // Mesmo slot em mais de um aparelho: vale a resposta mais recente de cada item.
  const latest = new Map<string, (typeof data.reviews)[number]>();
  for (const r of data.reviews.filter((r) => ids.has(r.participantId))) {
    const prev = latest.get(r.itemKey);
    if (!prev || prev.updatedAt < r.updatedAt) latest.set(r.itemKey, r);
  }

  return (
    <Review
      participant={{ id: `previa-${slot}`, name: person?.declaredName ?? (slot === "manoel" ? "Manoel" : "Cadene"), slot }}
      shared={shared}
      initial={Object.fromEntries([...latest].map(([k, r]) => [k, { value: r.value, updatedAt: r.updatedAt }]))}
      preview
    />
  );
}
