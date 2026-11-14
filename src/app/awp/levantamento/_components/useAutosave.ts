"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerValue } from "../_lib/answers";
import type { ReviewValue } from "../_lib/review";
import { BASE_PATH_CLIENT, readStored, removeStored, writeStored } from "./client-storage";

export type InitialAnswers = Record<string, { value: AnswerValue; updatedAt: string }>;
export type InitialReviews = Record<string, { value: ReviewValue; updatedAt: string }>;

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "offline" }
  | { kind: "error"; message: string };

type Pending<V> = { value: V; version: number };

const DEBOUNCE_MS = 1500;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

type StoreOptions<V> = {
  storageKey: string;
  api: string;
  initial: Record<string, { value: V; updatedAt: string }>;
  /** Item enviado à API para a chave e o valor. */
  toItem: (key: string, value: V) => Record<string, unknown>;
};

/**
 * Salvamento automático no banco:
 * - grava 1,5 s depois da última alteração e imediatamente ao sair do campo;
 * - ao esconder a página (bloquear o celular, trocar de app, fechar) envia o
 *   que estiver pendente por navigator.sendBeacon;
 * - o que ainda não foi confirmado pelo servidor fica numa cópia local e é
 *   reenviado na próxima abertura. O banco continua sendo a referência;
 * - se o servidor recusar por fase (409: questionário fechado ou revisão
 *   fechada), mostra a mensagem e descarta o pendente, sem insistir.
 */
function useAutosaveStore<V>({ storageKey, api, initial, toItem }: StoreOptions<V>) {
  const [values, setValues] = useState<Record<string, V>>(() =>
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, v.value])),
  );
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [pendingCount, setPendingCount] = useState(0);

  const pending = useRef(new Map<string, Pending<V>>());
  const version = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const retryDelay = useRef(5000);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const toItemRef = useRef(toItem);

  useEffect(() => {
    toItemRef.current = toItem;
  }, [toItem]);

  const persist = useCallback(() => {
    setPendingCount(pending.current.size);
    if (pending.current.size === 0) return removeStored(storageKey);
    writeStored(
      storageKey,
      JSON.stringify(Object.fromEntries([...pending.current].map(([k, p]) => [k, p.value]))),
    );
  }, [storageKey]);

  const schedule = useCallback((ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), ms);
  }, []);

  const flush = useCallback(async () => {
    if (inFlight.current || pending.current.size === 0) return;
    if (timer.current) clearTimeout(timer.current);
    inFlight.current = true;
    const batch = [...pending.current].map(([key, p]) => ({ key, value: p.value, version: p.version }));
    setState({ kind: "saving" });
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: batch.map((b) => toItemRef.current(b.key, b.value)) }),
        keepalive: true,
      });
      if (res.status === 401) {
        setState({ kind: "error", message: "Sessão encerrada neste aparelho. Recarregue a página e informe seu nome." });
        return;
      }
      if (res.status === 409) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        pending.current.clear();
        persist();
        setState({ kind: "error", message: data.error ?? "Não é possível salvar nesta fase. Recarregue a página." });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      for (const b of batch) {
        if (pending.current.get(b.key)?.version === b.version) pending.current.delete(b.key);
      }
      persist();
      retryDelay.current = 5000;
      setState({ kind: "saved", at: new Date() });
      if (pending.current.size > 0) schedule(300);
    } catch {
      setState(
        typeof navigator !== "undefined" && navigator.onLine === false
          ? { kind: "offline" }
          : { kind: "error", message: "Não foi possível salvar agora. Tentando de novo…" },
      );
      schedule(retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, 60_000);
    } finally {
      inFlight.current = false;
    }
  }, [api, persist, schedule]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const update = useCallback(
    (key: string, value: V) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      pending.current.set(key, { value, version: ++version.current });
      persist();
      schedule(DEBOUNCE_MS);
    },
    [persist, schedule],
  );

  // Pendências de uma visita anterior que o servidor não confirmou.
  useEffect(() => {
    const raw = readStored(storageKey);
    if (!raw) return;
    let saved: Record<string, V>;
    try {
      saved = JSON.parse(raw) as Record<string, V>;
    } catch {
      return removeStored(storageKey);
    }
    const restored: Record<string, V> = {};
    for (const [key, value] of Object.entries(saved)) {
      if (initial[key] && stable(initial[key].value) === stable(value)) continue;
      restored[key] = value;
      pending.current.set(key, { value, version: ++version.current });
    }
    persist();
    if (Object.keys(restored).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura respostas locais não confirmadas, uma única vez
      setValues((prev) => ({ ...prev, ...restored }));
      schedule(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- executa só na montagem
  }, []);

  useEffect(() => {
    const sendBeacon = () => {
      if (pending.current.size === 0 || typeof navigator.sendBeacon !== "function") return;
      const items = [...pending.current].map(([key, p]) => toItemRef.current(key, p.value));
      navigator.sendBeacon(api, new Blob([JSON.stringify({ items })], { type: "application/json" }));
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") sendBeacon();
      else void flushRef.current();
    };
    const onOnline = () => void flushRef.current();
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0 && navigator.onLine === false) e.preventDefault();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", sendBeacon);
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", sendBeacon);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [api]);

  return { values, update, flush, state, pendingCount };
}

const answerItem = (questionKey: string, answer: AnswerValue) => ({ questionKey, answer });
const reviewItem = (itemKey: string, value: ReviewValue) => ({ itemKey, value });

/** Respostas do questionário. */
export function useAutosave(participantId: string, initial: InitialAnswers) {
  const { values, ...rest } = useAutosaveStore({
    storageKey: `awp-lv-pendentes:${participantId}`,
    api: `${BASE_PATH_CLIENT}/api/answers`,
    initial,
    toItem: answerItem,
  });
  return { answers: values, ...rest };
}

/** Respostas da revisão (segunda rodada). */
export function useReviewAutosave(participantId: string, initial: InitialReviews) {
  return useAutosaveStore({
    storageKey: `awp-lv-revisao:${participantId}`,
    api: `${BASE_PATH_CLIENT}/api/review`,
    initial,
    toItem: reviewItem,
  });
}
