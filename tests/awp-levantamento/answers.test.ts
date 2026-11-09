import { describe, expect, it } from "vitest";
import { questionByKey } from "../../src/app/awp/levantamento/_content/questionario";
import {
  emptyAnswer,
  individualStatus,
  missingParts,
  normalizeAnswer,
  type AnswerValue,
} from "../../src/app/awp/levantamento/_lib/answers";

const q = (k: string) => questionByKey.get(k)!;
const answer = (patch: Partial<AnswerValue>): AnswerValue => ({ ...emptyAnswer(), ...patch });

describe("normalizeAnswer", () => {
  it("descarta alternativas que não pertencem à pergunta e limita escolha única", () => {
    const v = normalizeAnswer(q("m2.q3"), { selected: ["proprias", "ambas", "inventada"] });
    expect(v.selected).toEqual(["proprias"]);
  });

  it("mantém várias alternativas na múltipla escolha, sem repetição", () => {
    const v = normalizeAnswer(q("m1.q1"), { selected: ["talhao", "safra", "talhao", "x"] });
    expect(v.selected).toEqual(["talhao", "safra"]);
  });

  it("só guarda o texto de Outro quando Outro está marcado", () => {
    expect(normalizeAnswer(q("m1.q1"), { selected: ["talhao"], other_text: "abc" }).other_text).toBe("");
    expect(normalizeAnswer(q("m1.q1"), { selected: ["outro"], other_text: "Gleba" }).other_text).toBe("Gleba");
  });

  it("filtra linhas, critérios e campos extras desconhecidos", () => {
    const v = normalizeAnswer(q("m3.q4"), {
      matrix: {
        insumos: { criterion: "area", other: "ignorado", label: "ignorado" },
        combustivel: { criterion: "outro", other: "Por litro" },
        outro_tipo: { label: "Energia", criterion: "manual" },
        inexistente: { criterion: "area" },
        transporte: { criterion: "invalido" },
      },
      extra: { responsible: "x" },
    });
    expect(v.matrix).toEqual({
      insumos: { criterion: "area" },
      combustivel: { criterion: "outro", other: "Por litro" },
      outro_tipo: { criterion: "manual", label: "Energia" },
    });
    expect(v.extra).toEqual({});
  });

  it("aceita só true como 'Preciso discutir isso'", () => {
    expect(normalizeAnswer(q("m4.q1"), { needs_discussion: "true" }).needs_discussion).toBe(false);
    expect(normalizeAnswer(q("m4.q1"), { needs_discussion: true }).needs_discussion).toBe(true);
  });
});

describe("situação individual", () => {
  it("vazia é não iniciada", () => {
    expect(individualStatus(q("m1.q2"), undefined)).toBe("nao_iniciada");
    expect(individualStatus(q("m1.q2"), emptyAnswer())).toBe("nao_iniciada");
  });

  it("'Depende' exige explicação", () => {
    expect(individualStatus(q("m1.q2"), answer({ selected: ["sim"] }))).toBe("respondida");
    expect(individualStatus(q("m1.q2"), answer({ selected: ["depende"] }))).toBe("em_andamento");
    expect(individualStatus(q("m1.q2"), answer({ selected: ["depende"], explanation: "Conforme a área" }))).toBe(
      "respondida",
    );
  });

  it("'Outro' exige descrição", () => {
    expect(individualStatus(q("m1.q1"), answer({ selected: ["outro"] }))).toBe("em_andamento");
    expect(individualStatus(q("m1.q1"), answer({ selected: ["outro"], other_text: "Gleba" }))).toBe("respondida");
  });

  it("explicação comum é opcional; pergunta de texto exige texto", () => {
    expect(individualStatus(q("m3.q1"), answer({ selected: ["nota_fiscal"] }))).toBe("respondida");
    expect(individualStatus(q("m5.q1"), answer({ complement: "algo" }))).toBe("em_andamento");
    expect(individualStatus(q("m5.q1"), answer({ explanation: "Amostragem" }))).toBe("respondida");
  });

  it("resposta parcial com 'Preciso discutir' continua em andamento", () => {
    const v = answer({ selected: ["depende"], needs_discussion: true });
    expect(individualStatus(q("m1.q2"), v)).toBe("em_andamento");
  });

  it("tabela exige critério em todas as linhas, exceto 'Outro tipo' vazio", () => {
    const rows = q("m3.q4").rows!.filter((r) => !r.other);
    const full = Object.fromEntries(rows.map((r) => [r.key, { criterion: "area" }]));
    expect(individualStatus(q("m3.q4"), answer({ matrix: full }))).toBe("respondida");

    const missingOne = { ...full };
    delete missingOne.transporte;
    expect(missingParts(q("m3.q4"), answer({ matrix: missingOne }))).toEqual(['Escolha o critério de "Transporte".']);

    expect(
      missingParts(q("m3.q4"), answer({ matrix: { ...full, outro_tipo: { label: "Energia" } } })),
    ).toEqual(['Escolha o critério de "Energia".']);
    expect(
      missingParts(q("m3.q4"), answer({ matrix: { ...full, insumos: { criterion: "outro" } } })),
    ).toEqual(['Descreva o outro critério de "Insumos agrícolas".']);
  });
});
