import { describe, expect, it } from "vitest";
import { allQuestions, questionByKey, questionnaire } from "../../src/app/awp/levantamento/_content/questionario";

describe("conteúdo do questionário aprovado", () => {
  it("tem 7 módulos e 36 perguntas", () => {
    expect(questionnaire).toHaveLength(7);
    expect(allQuestions).toHaveLength(36);
    expect(questionnaire.map((m) => m.questions.length)).toEqual([4, 5, 6, 4, 6, 5, 6]);
  });

  it("chaves e números são únicos e seguem o módulo", () => {
    expect(new Set(allQuestions.map((q) => q.key)).size).toBe(36);
    for (const m of questionnaire) {
      m.questions.forEach((q, i) => {
        expect(q.number).toBe(`${m.number}.${i + 1}`);
        expect(q.key).toBe(`m${m.number}.q${i + 1}`);
      });
    }
  });

  it("alternativas são únicas por pergunta e perguntas de escolha têm alternativas", () => {
    for (const q of allQuestions) {
      for (const list of [q.options, q.rows, q.criteria]) {
        if (list) expect(new Set(list.map((o) => o.key)).size).toBe(list.length);
      }
      if (q.kind === "single" || q.kind === "multi") expect(q.options?.length).toBeGreaterThan(1);
    }
  });

  it("decisões aprovadas", () => {
    const q = (k: string) => questionByKey.get(k)!;
    expect(q("m1.q1").kind).toBe("multi");
    expect(q("m1.q1").options?.map((o) => o.key)).toEqual(["fazenda", "talhao", "safra", "variedade", "outro"]);
    expect(q("m2.q3").kind).toBe("single");
    expect(q("m2.q3").options?.map((o) => o.label)).toEqual(["Próprias", "Terceirizadas", "Ambas"]);
    expect(q("m5.q2").prompt).toContain("atualmente na fazenda");
    expect(q("m6.q2").prompt).toContain("recomendada pelos protocolos");
    expect(q("m6.q2").kind).toBe("multi");
    expect(q("m6.q2").explanation?.help).toContain("cada avaliação");
    expect(q("m5.q6").extraFields?.map((f) => f.key)).toEqual(["reference_doc"]);
    const matrix = q("m3.q4");
    expect(matrix.kind).toBe("matrix");
    expect(matrix.rows).toHaveLength(13);
    expect(matrix.criteria?.map((c) => c.label)).toEqual([
      "Proporcional à área",
      "Conforme horas de utilização",
      "Conforme quantidade utilizada",
      "Distribuição manual",
      "Outro",
      "Ainda não definido",
    ]);
  });

  it("alternativas vindas do material aprovado não estão marcadas como sugestão", () => {
    const labels = (k: string) => questionByKey.get(k)!.options!.filter((o) => o.proposed).map((o) => o.key);
    expect(labels("m2.q2")).toEqual([]);
    expect(labels("m2.q5")).toEqual([]);
    expect(labels("m3.q2")).toEqual(["depende"]);
    expect(questionByKey.get("m3.q4")!.rows!.some((r) => r.proposed)).toBe(false);
  });

  it("todo texto cabe na fonte do PDF (Latin-1)", () => {
    const texts = questionnaire.flatMap((m) => [
      m.title,
      m.objective,
      m.guidance ?? "",
      m.internalNote ?? "",
      ...m.questions.flatMap((q) => [
        q.prompt,
        q.explanation?.label ?? "",
        q.explanation?.help ?? "",
        q.hints?.text ?? "",
        ...(q.extraFields ?? []).flatMap((f) => [f.label, f.help ?? ""]),
        ...[...(q.options ?? []), ...(q.rows ?? []), ...(q.criteria ?? [])].map((o) => o.label),
      ]),
    ]);
    // WinAnsi: Latin-1 mais travessão e aspas tipográficas.
    const outside = texts.join("").match(/[^\u0000-ÿ–—‘’“”•…]/g);
    expect(outside).toBeNull();
  });
});
