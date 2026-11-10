import { connection } from "next/server";
import { questionnaire } from "./_content/questionario";
import { answersOfParticipant } from "./_lib/data";
import { currentParticipant } from "./_lib/session";
import EntryForm from "./_components/EntryForm";
import Questionnaire from "./_components/Questionnaire";

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
  const answers = await answersOfParticipant(participant.id);
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
