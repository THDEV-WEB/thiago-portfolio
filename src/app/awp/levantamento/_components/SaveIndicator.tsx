"use client";

import { formatTime } from "../_lib/format";
import type { SaveState } from "./useAutosave";

export default function SaveIndicator({ state, pendingCount }: { state: SaveState; pendingCount: number }) {
  let text = "Respostas salvas automaticamente";
  let tone = "border-border bg-surface text-muted";
  if (state.kind === "saving") text = "Salvando…";
  if (state.kind === "saved") {
    text = `Salvo às ${formatTime(state.at)}`;
    tone = "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (state.kind === "offline") {
    text = "Sem internet: as respostas estão guardadas neste aparelho e serão enviadas quando a conexão voltar";
    tone = "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (state.kind === "error") {
    text = state.message;
    tone = "border-red-200 bg-red-50 text-red-800";
  }
  if (state.kind !== "saving" && state.kind !== "offline" && state.kind !== "error" && pendingCount > 0) {
    text = "Alterações aguardando envio…";
    tone = "border-border bg-surface text-muted";
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <p role="status" aria-live="polite" className={`pointer-events-auto max-w-md rounded-full border px-4 py-2 text-center text-sm font-medium shadow-lg ${tone}`}>
        {text}
      </p>
    </div>
  );
}
