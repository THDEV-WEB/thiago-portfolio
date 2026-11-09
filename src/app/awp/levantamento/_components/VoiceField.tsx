"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  KEYBOARD_TIP,
  PRIVACY_NOTE,
  SPEECH_ERROR_MESSAGE,
  isAndroid,
  speechRecognitionCtor,
  speechSupport,
  type SpeechRecognitionLike,
  type SpeechSupport,
} from "./speech";

// Só um microfone ativo por vez na página.
let activeRecognizer: SpeechRecognitionLike | null = null;

const noopSubscribe = () => () => {};

export function useSpeechSupport(): SpeechSupport | null {
  return useSyncExternalStore(noopSubscribe, speechSupport, () => null);
}

const joinText = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(" ");

type Props = {
  id: string;
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

/**
 * Campo de texto com microfone. O texto ditado vai primeiro para uma caixa de
 * revisão editável; só entra na resposta (e é salvo) quando a pessoa toca em
 * "Inserir na resposta".
 */
export default function VoiceField({ id, label, help, placeholder, required, rows = 4, value, onChange, onBlur }: Props) {
  const support = useSpeechSupport();
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const draftRef = useRef("");
  const interimRef = useRef("");

  useEffect(() => () => recRef.current?.abort(), []);

  function updateDraft(text: string) {
    draftRef.current = text;
    setDraft(text);
  }

  function start() {
    const Ctor = speechRecognitionCtor();
    if (!Ctor) return;
    activeRecognizer?.abort();
    setError(null);

    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    // No Android o modo contínuo repete trechos; lá cada toque grava uma fala.
    rec.continuous = !isAndroid();

    const base = draftRef.current;
    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      updateDraft(joinText(base, finalText));
      interimRef.current = interimText;
      setInterim(interimText);
    };
    rec.onerror = (event) => {
      if (event.error === "aborted") return;
      setError(SPEECH_ERROR_MESSAGE[event.error] ?? "Não foi possível usar o microfone agora. Você pode digitar normalmente.");
    };
    rec.onend = () => {
      if (interimRef.current) updateDraft(joinText(draftRef.current, interimRef.current));
      interimRef.current = "";
      setInterim("");
      setListening(false);
      if (activeRecognizer === rec) activeRecognizer = null;
      recRef.current = null;
    };

    try {
      rec.start();
      recRef.current = rec;
      activeRecognizer = rec;
      setListening(true);
      if (draftRef.current === "") setDraft("");
    } catch {
      setError("Não foi possível iniciar o microfone. Você pode digitar normalmente.");
    }
  }

  function stop() {
    recRef.current?.stop();
  }

  function discard() {
    recRef.current?.abort();
    updateDraft("");
    setDraft(null);
  }

  function insert() {
    const text = draftRef.current.trim();
    if (text) onChange(value.trim() ? `${value.trimEnd()} ${text}` : text);
    discard();
    onBlur?.();
  }

  const helpId = `${id}-help`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 font-normal text-muted">(obrigatório)</span>}
      </label>
      {help && (
        <p id={helpId} className="mt-1 text-sm leading-relaxed text-muted">
          {help}
        </p>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-describedby={help ? helpId : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {support === "supported" && (
        <div className="mt-2">
          <button
            type="button"
            onClick={listening ? stop : start}
            aria-pressed={listening}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              listening
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
            }`}
          >
            <MicIcon />
            {listening ? "Ouvindo… toque para parar" : draft !== null ? "Falar mais" : "Responder falando"}
          </button>
          {listening && isAndroid() && (
            <p className="mt-1 text-xs text-muted">A gravação para sozinha após uma pausa. Toque de novo para continuar.</p>
          )}
        </div>
      )}

      {draft !== null && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Texto reconhecido — revise antes de inserir</p>
          <textarea
            aria-label="Texto reconhecido pelo microfone"
            rows={3}
            value={draft}
            onChange={(e) => updateDraft(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed outline-none focus:border-primary"
          />
          {interim && <p className="mt-1 text-sm italic text-muted">{interim}…</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={insert}
              disabled={listening || !draft.trim()}
              className="min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Inserir na resposta
            </button>
            <button
              type="button"
              onClick={discard}
              className="min-h-11 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {support === "supported" && (
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer select-none">Como funciona o microfone</summary>
          <p className="mt-1 leading-relaxed">{PRIVACY_NOTE}</p>
        </details>
      )}
      {support === "in_app" && (
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Para usar o microfone, abra este link no Chrome (menu ⋮ → &quot;Abrir no navegador&quot;). {KEYBOARD_TIP}
        </p>
      )}
      {(support === "unsupported" || support === "insecure") && (
        <p className="mt-2 text-xs leading-relaxed text-muted">{KEYBOARD_TIP}</p>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
    </svg>
  );
}
