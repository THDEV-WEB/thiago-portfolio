import { splitRefs } from "../_lib/review";

/** Texto da revisão: cada {3.6} vira o botão "ver 3.6", que abre a pergunta citada. */
export default function RichText({ text, onRef }: { text: string; onRef: (questionKey: string) => void }) {
  return (
    <>
      {splitRefs(text).map((part, i) =>
        part.kind === "text" ? (
          <span key={i}>{part.value}</span>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => onRef(part.questionKey)}
            className="mx-0.5 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 align-baseline text-[0.85em] font-semibold text-primary hover:bg-primary/10"
          >
            ver {part.number}
          </button>
        ),
      )}
    </>
  );
}
