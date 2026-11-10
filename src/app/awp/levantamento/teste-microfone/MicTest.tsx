"use client";

import { useState, useSyncExternalStore } from "react";
import VoiceField, { useSpeechSupport } from "../_components/VoiceField";
import { isAndroid, isIOS } from "../_components/speech";

const SUPPORT_TEXT = {
  supported: "Este navegador oferece reconhecimento de voz. Toque em “Responder falando” e fale uma frase.",
  in_app:
    "Este link foi aberto dentro de outro aplicativo. Abra no Chrome (menu ⋮ → “Abrir no navegador”) para usar o microfone.",
  insecure: "O microfone só funciona em endereço seguro (https).",
  unsupported:
    "Este navegador não oferece reconhecimento de voz. Use o Chrome (no iPhone, o Safari) ou o microfone do teclado do celular.",
} as const;

const noopSubscribe = () => () => {};

export default function MicTest() {
  const support = useSpeechSupport();
  const userAgent = useSyncExternalStore(noopSubscribe, () => navigator.userAgent, () => "");
  const [text, setText] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const addLog = (event: string) => {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog((l) => [...l.slice(-19), `${time} ${event}`]);
  };

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm leading-relaxed">
        <strong className="font-semibold">Resultado da verificação: </strong>
        {support ? SUPPORT_TEXT[support] : "verificando…"}
      </p>
      {support === "supported" && isAndroid() && (
        <p className="text-sm text-muted">No Android a gravação para sozinha depois de uma pausa; toque de novo para continuar.</p>
      )}
      {support === "supported" && isIOS() && (
        <p className="text-sm text-muted">
          No iPhone o reconhecimento depende da Siri ou do Ditado ativados em Ajustes. Toque uma vez e fale; não precisa
          segurar o botão.
        </p>
      )}
      <VoiceField id="teste-microfone" label="Campo de teste" value={text} onChange={setText} rows={4} onDebug={addLog} />
      {log.length > 0 && (
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-xs font-semibold text-muted">Registro do microfone (se não funcionar, envie um print desta tela)</p>
          <ol className="mt-1 font-mono text-xs leading-relaxed">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}
      <p className="text-xs text-muted">
        Navegador: <span className="break-all">{userAgent}</span>
      </p>
    </div>
  );
}
