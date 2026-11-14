import { BASE_PATH_CLIENT } from "../_components/client-storage";

export const ADMIN_API = `${BASE_PATH_CLIENT}/api/admin`;

/** Executa uma ação do painel. Devolve a mensagem de erro, ou null se deu certo. */
export async function adminAction(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(`${ADMIN_API}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? "Não foi possível salvar.";
  } catch {
    return "Sem conexão.";
  }
}
