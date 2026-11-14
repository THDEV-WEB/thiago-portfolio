import { connection } from "next/server";
import { questionnaire } from "./_content/questionario";
import { answersOfParticipant, getPhase, reviewResponsesOf } from "./_lib/data";
import { loadSharedAnswers } from "./_lib/review-data";
import { currentParticipant } from "./_lib/session";
import EntryForm from "./_components/EntryForm";
import Questionnaire from "./_components/Questionnaire";
import Review from "./_components/Review";
import ReviewUnavailable from "./_components/ReviewUnavailable";

export default async function LevantamentoPage() {
  // Sempre renderizada por requisição (cookie do participante, variáveis de
  // ambiente lidas em execução), nunca pré-gerada no build.
  await connection();
  if (!process.env.AWP_DATABASE_URL) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          A ferramenta ainda não foi configurada neste ambiente.
        </p>
      </main>
    );
  }

  const participant = await currentParticipant();
  if (!participant) return <EntryForm />;

  // Só as respostas do próprio participante saem do servidor.
  const [answers, phase] = await Promise.all([answersOfParticipant(participant.id), getPhase()]);

  if (phase !== "questionario") {
    // Revisão: só para quem respondeu identificado como Manoel ou Cadene.
    const slot = participant.kind === "participant" ? participant.slot : null;
    if (!slot || answers.length === 0) return <ReviewUnavailable name={participant.declaredName} />;
    const [shared, reviews] = await Promise.all([loadSharedAnswers(), reviewResponsesOf(participant.id)]);
    return (
      <Review
        participant={{ id: participant.id, name: participant.declaredName, slot }}
        shared={shared}
        initial={Object.fromEntries(reviews.map((r) => [r.itemKey, { value: r.value, updatedAt: r.updatedAt }]))}
        closed={phase === "encerrado"}
      />
    );
  }

  return (
    <Questionnaire
      // Notas internas dos módulos ficam só no painel e no PDF.
      modules={questionnaire.map((m) => ({ ...m, internalNote: undefined }))}
      participant={{ id: participant.id, name: participant.declaredName, isAdmin: participant.kind === "admin" }}
      initialAnswers={Object.fromEntries(
        answers.map((a) => [a.questionKey, { value: a.value, updatedAt: a.updatedAt }]),
      )}
    />
  );
}
