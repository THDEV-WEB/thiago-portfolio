import type { Metadata } from "next";
import { connection } from "next/server";
import { loadAdminData } from "../_lib/data";
import { buildReport } from "../_lib/report";
import { buildReviewReport } from "../_lib/review";
import { isAdmin } from "../_lib/session";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export const metadata: Metadata = {
  title: { absolute: "AWP — Painel do levantamento" },
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Sempre por requisição: nunca pré-gerar o painel no build.
  await connection();
  if (!process.env.AWP_DATABASE_URL || !process.env.AWP_ADMIN_PASSWORD) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          O painel ainda não foi configurado neste ambiente.
        </p>
      </main>
    );
  }
  if (!(await isAdmin())) return <AdminLogin />;
  const data = await loadAdminData();
  return <AdminDashboard report={buildReport(data)} review={buildReviewReport(data)} />;
}
