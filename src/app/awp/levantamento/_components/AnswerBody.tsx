import type { QuestionDef } from "../_content/questionario";
import { describeAnswer, isEmptyAnswer, type AnswerValue } from "../_lib/answers";

/** Resposta do questionário em modo leitura (revisão e "Minhas respostas"). */
export default function AnswerBody({ question, value }: { question: QuestionDef; value: AnswerValue | undefined }) {
  if (!value || isEmptyAnswer(value)) return <p className="text-sm text-muted">Sem resposta.</p>;
  const lines = describeAnswer(question, value);
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {value.needs_discussion && (
        <p className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
          Marcou “Preciso discutir isso”
        </p>
      )}
      {question.kind === "matrix" ? (
        <ul className="space-y-0.5">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        lines.map((line) => (
          <p key={line} className="font-medium">
            {line}
          </p>
        ))
      )}
      {value.explanation.trim() && (
        <p className="whitespace-pre-wrap">
          <span className="font-semibold">{question.kind === "text" ? "Resposta" : (question.explanation?.label ?? "Explicação")}: </span>
          {value.explanation.trim()}
        </p>
      )}
      {question.extraFields?.map((f) =>
        value.extra[f.key]?.trim() ? (
          <p key={f.key} className="whitespace-pre-wrap">
            <span className="font-semibold">{f.label}: </span>
            {value.extra[f.key]}
          </p>
        ) : null,
      )}
      {value.complement.trim() && (
        <p className="whitespace-pre-wrap">
          <span className="font-semibold">Complemento: </span>
          {value.complement.trim()}
        </p>
      )}
    </div>
  );
}
