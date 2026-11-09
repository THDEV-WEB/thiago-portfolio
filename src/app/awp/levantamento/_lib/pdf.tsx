// PDF consolidado do levantamento (@react-pdf/renderer, gerado no servidor).
// Fonte Helvetica embutida: só caracteres Latin-1 (nada de ★, ✓ ou →).
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { describeAnswer } from "./answers";
import {
  COVERAGE_LABEL,
  DIVERGENCE_LABEL,
  INDIVIDUAL_LABEL,
  SLOTS,
  SLOT_LABEL,
  VALIDATION_LABEL,
} from "./divergence";
import { formatDateTime } from "./format";
import { otherAnswerTitle, type Report, type ReportAnswer, type ReportQuestion } from "./report";

const colors = {
  text: "#0f1b2d",
  muted: "#52667e",
  border: "#dbe6f2",
  primary: "#1d4ed8",
  surface: "#f5f9fd",
  warn: "#92400e",
  warnBg: "#fef3c7",
};

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 56, fontSize: 9.5, color: colors.text, fontFamily: "Helvetica", lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: colors.muted, flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { fontSize: 8, color: colors.primary, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "Helvetica-Bold" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 6 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h3: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  muted: { color: colors.muted },
  small: { fontSize: 8, color: colors.muted },
  section: { marginTop: 18 },
  box: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 8, marginTop: 6 },
  question: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 10, marginTop: 10 },
  badges: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  badge: { fontSize: 7.5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5, marginRight: 4, marginTop: 2 },
  warn: { fontSize: 7.5, backgroundColor: colors.warnBg, color: colors.warn, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5, marginRight: 4, marginTop: 2 },
  label: { fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 3 },
  cell: { flex: 1, paddingRight: 6 },
});

function Footer({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>AWP · Levantamento de regras de negócio · gerado em {generatedAt}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}

function AnswerBlock({ title, entry, q }: { title: string; entry: ReportAnswer | undefined; q: ReportQuestion }) {
  if (!entry) {
    return (
      <View style={s.box} wrap={false}>
        <Text style={s.label}>{title}</Text>
        <Text style={s.muted}>Sem resposta.</Text>
      </View>
    );
  }
  const v = entry.answer.value;
  const lines = describeAnswer(q.question, v);
  return (
    <View style={s.box}>
      <Text>
        <Text style={s.label}>{title}</Text>
        <Text style={s.muted}>
          {"  "}
          {entry.participant.declaredName} (nome declarado) · {INDIVIDUAL_LABEL[entry.status]} · atualizado em{" "}
          {formatDateTime(entry.answer.updatedAt)}
          {entry.revisions.length > 0 ? ` · ${entry.revisions.length} revisão(ões) anteriores` : ""}
        </Text>
      </Text>
      {v.needs_discussion && (
        <View style={s.badges}>
          <Text style={s.warn}>Preciso discutir isso</Text>
        </View>
      )}
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      {v.explanation.trim() !== "" && (
        <Text>
          <Text style={s.label}>{q.question.explanation?.label ?? "Explicação"}: </Text>
          {v.explanation.trim()}
        </Text>
      )}
      {q.question.extraFields?.map((f) =>
        v.extra[f.key]?.trim() ? (
          <Text key={f.key}>
            <Text style={s.label}>{f.label}: </Text>
            {v.extra[f.key]}
          </Text>
        ) : null,
      )}
      {v.complement.trim() !== "" && (
        <Text>
          <Text style={s.label}>Complemento ou exemplo: </Text>
          {v.complement.trim()}
        </Text>
      )}
    </View>
  );
}

function QuestionBlock({ q }: { q: ReportQuestion }) {
  return (
    <View style={s.question}>
      <View wrap={false}>
        <Text style={s.h3}>
          {q.question.number}. {q.question.prompt}
        </Text>
        <View style={s.badges}>
          <Text style={s.badge}>
            Regra: {VALIDATION_LABEL[q.validation]} ({q.validationSource === "manual" ? "definida pelo administrador" : "automática"})
          </Text>
          <Text style={s.badge}>Cobertura: {COVERAGE_LABEL[q.coverage]}</Text>
          <Text style={q.divergence.state === "possivel" ? s.warn : s.badge}>{DIVERGENCE_LABEL[q.divergence.state]}</Text>
          {q.needsDiscussion && <Text style={s.warn}>Marcada para discussão</Text>}
        </View>
      </View>
      {q.divergence.state === "possivel" && (
        <View style={s.box}>
          <Text style={s.label}>Divergências identificadas (nenhuma resposta é considerada correta automaticamente)</Text>
          {q.divergence.details.map((d, i) => (
            <Text key={i}>- {d}</Text>
          ))}
        </View>
      )}
      {SLOTS.map((slot) => (
        <AnswerBlock key={slot} title={SLOT_LABEL[slot]} entry={q.bySlot[slot]} q={q} />
      ))}
      {q.others.map((entry) => (
        <AnswerBlock key={entry.answer.id} title={otherAnswerTitle(entry)} entry={entry} q={q} />
      ))}
      {q.notes.length > 0 && (
        <View style={s.box}>
          <Text style={s.label}>Observações do administrador</Text>
          {q.notes.map((n) => (
            <Text key={n.id}>
              <Text style={s.small}>{formatDateTime(n.createdAt)} </Text>
              {n.body}
            </Text>
          ))}
        </View>
      )}
      {q.rule && (
        <View style={s.box}>
          <Text style={s.label}>
            {q.validation === "confirmada" ? "Regra de negócio confirmada" : "Rascunho da regra (ainda não confirmada)"} · versão {q.rule.version} de{" "}
            {formatDateTime(q.rule.createdAt)}
          </Text>
          <Text>{q.rule.body}</Text>
        </View>
      )}
    </View>
  );
}

export function ReportDocument({ report, generatedAt }: { report: Report; generatedAt: Date }) {
  const generated = formatDateTime(generatedAt.toISOString());
  const modules = [...new Map(report.questions.map((q) => [q.module.key, q.module])).values()];
  const pending = report.questions.filter((q) => q.validation !== "confirmada" && q.coverage !== "ambos");
  const divergent = report.questions.filter((q) => q.divergence.state === "possivel" || q.validation === "divergencia");
  const confirmed = report.questions.filter((q) => q.validation === "confirmada");
  const t = report.totals;

  return (
    <Document title="AWP — Levantamento de regras de negócio" author="AWP" language="pt-BR">
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>AWP — Agricultural Wealth Project</Text>
        <Text style={s.h1}>Levantamento de regras de negócio</Text>
        <Text style={s.muted}>Sistema de Custeio de Produção de Mandioca · Relatório consolidado</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>Gerado em {generated} (horário de Brasília)</Text>

        <View style={s.section}>
          <Text style={s.h2}>Participantes</Text>
          <Text style={s.small}>
            A identificação é declarada pelo próprio participante (nome informado na entrada) e não foi verificada.
          </Text>
          <View style={[s.row, { marginTop: 6 }]}>
            <Text style={[s.cell, s.label]}>Nome declarado</Text>
            <Text style={[s.cell, s.label]}>Identificado como</Text>
            <Text style={[s.cell, s.label]}>Primeiro acesso</Text>
            <Text style={[s.cell, s.label]}>Última atividade</Text>
          </View>
          {report.participants.map((p) => (
            <View key={p.id} style={s.row}>
              <Text style={s.cell}>{p.declaredName}</Text>
              <Text style={s.cell}>{p.kind === "admin" ? "Administrador" : p.slot ? SLOT_LABEL[p.slot] : "Sem identificação"}</Text>
              <Text style={s.cell}>{formatDateTime(p.createdAt)}</Text>
              <Text style={s.cell}>{formatDateTime(p.lastSeenAt)}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Resumo</Text>
          <Text>Perguntas: {t.questions}</Text>
          <Text>Respondidas por Manoel: {t.answeredBy.manoel} · por Cadene: {t.answeredBy.cadene} · por ambos: {t.coverage.ambos}</Text>
          <Text>Possíveis divergências nas alternativas: {t.possibleDivergences}</Text>
          <Text>Marcadas com &quot;Preciso discutir isso&quot;: {t.needsDiscussion}</Text>
          <Text>
            Situação das regras: {Object.entries(t.validation).map(([k, n]) => `${VALIDATION_LABEL[k as keyof typeof VALIDATION_LABEL]} ${n}`).join(" · ")}
          </Text>
        </View>
        <Footer generatedAt={generated} />
      </Page>

      {modules.map((m) => (
        <Page key={m.key} size="A4" style={s.page}>
          <Text style={s.eyebrow}>Módulo {m.number}</Text>
          <Text style={s.h2}>{m.title}</Text>
          <Text style={s.muted}>Objetivo: {m.objective}</Text>
          {m.internalNote && <Text style={s.small}>Contexto: {m.internalNote}</Text>}
          {report.questions
            .filter((q) => q.module.key === m.key)
            .map((q) => (
              <QuestionBlock key={q.question.key} q={q} />
            ))}
          <Footer generatedAt={generated} />
        </Page>
      ))}

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Regras de negócio confirmadas</Text>
        {confirmed.length === 0 && <Text style={s.muted}>Nenhuma regra confirmada até a geração deste relatório.</Text>}
        {confirmed.map((q) => (
          <View key={q.question.key} style={s.box} wrap={false}>
            <Text style={s.label}>
              {q.question.number}. {q.question.prompt}
            </Text>
            <Text>{q.rule ? q.rule.body : "Confirmada sem texto consolidado registrado."}</Text>
          </View>
        ))}

        <View style={s.section}>
          <Text style={s.h2}>Divergências para validação</Text>
          {divergent.length === 0 && <Text style={s.muted}>Nenhuma.</Text>}
          {divergent.map((q) => (
            <Text key={q.question.key}>
              - {q.question.number}. {q.question.prompt}
              {q.divergence.state === "possivel" ? ` (${q.divergence.details.join("; ")})` : ""}
            </Text>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Perguntas pendentes</Text>
          {pending.length === 0 && <Text style={s.muted}>Nenhuma.</Text>}
          {pending.map((q) => (
            <Text key={q.question.key}>
              - {q.question.number}. {q.question.prompt} — Manoel: {INDIVIDUAL_LABEL[q.statuses.manoel]}; Cadene:{" "}
              {INDIVIDUAL_LABEL[q.statuses.cadene]}
            </Text>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.h2}>Alternativas propostas a validar</Text>
          <Text style={s.small}>
            Alternativas sugeridas pelo desenvolvimento, ainda não validadas com o Manoel.
          </Text>
          {report.proposed.map((p) => (
            <Text key={`${p.question.key}:${p.optionKey}`}>
              - {p.question.number} · {p.label}: escolhida por {p.chosenBy.length ? p.chosenBy.map((x) => SLOT_LABEL[x]).join(" e ") : "ninguém"}
              {p.preferredOther.length ? ` · usaram "Outro": ${p.preferredOther.map((x) => SLOT_LABEL[x]).join(" e ")}` : ""}
            </Text>
          ))}
        </View>
        <Footer generatedAt={generated} />
      </Page>
    </Document>
  );
}

export async function renderReportPdf(report: Report, generatedAt: Date): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<ReportDocument report={report} generatedAt={generatedAt} />);
  return new Uint8Array(buffer);
}
