// Reconhecimento de voz do próprio navegador (Web Speech API). Gratuito, mas:
// - Chrome (Android e computador) envia o áudio aos servidores do Google e
//   precisa de internet; Edge usa o serviço da Microsoft; Safari usa a Apple.
// - Firefox e navegadores internos de apps (Instagram, Facebook, WebView)
//   normalmente não oferecem o recurso.
// Sem suporte, a tela orienta a usar o ditado do teclado do celular.

type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function speechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/** Navegador interno de outro app (onde o microfone costuma não funcionar). */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)/i.test(navigator.userAgent);
}

export type SpeechSupport = "supported" | "in_app" | "insecure" | "unsupported";

export function speechSupport(): SpeechSupport {
  if (typeof window === "undefined") return "unsupported";
  if (isInAppBrowser()) return "in_app";
  if (!window.isSecureContext) return "insecure";
  return speechRecognitionCtor() ? "supported" : "unsupported";
}

export const SPEECH_ERROR_MESSAGE: Record<string, string> = {
  "not-allowed": "O microfone foi bloqueado. Libere a permissão do microfone nas configurações do navegador.",
  "service-not-allowed": "O navegador não permitiu o reconhecimento de voz. Use o microfone do teclado.",
  "no-speech": "Não ouvi nada. Toque no microfone e fale de novo.",
  "audio-capture": "Nenhum microfone encontrado neste aparelho.",
  network: "Sem internet: o reconhecimento de voz precisa de conexão.",
  "language-not-supported": "O reconhecimento em português não está disponível neste navegador.",
};

export const PRIVACY_NOTE =
  "Ao usar o microfone, o áudio é enviado ao serviço de reconhecimento do navegador (Google no Chrome, Microsoft no Edge, Apple no Safari) para virar texto. O áudio não é gravado pela ferramenta: só o texto que você revisar é salvo.";

export const KEYBOARD_TIP =
  "Para falar em vez de digitar, toque no campo e use o botão de microfone do teclado do celular.";
