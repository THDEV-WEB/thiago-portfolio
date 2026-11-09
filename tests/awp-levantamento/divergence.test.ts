import { describe, expect, it } from "vitest";
import { questionByKey } from "../../src/app/awp/levantamento/_content/questionario";
import { emptyAnswer, type AnswerValue } from "../../src/app/awp/levantamento/_lib/answers";
import { autoValidationStatus, coverage, divergence } from "../../src/app/awp/levantamento/_lib/divergence";

const q = (k: string) => questionByKey.get(k)!;
const answer = (patch: Partial<AnswerValue>): AnswerValue => ({ ...emptyAnswer(), ...patch });

describe("divergência entre Manoel e Cadene", () => {
  it("aguarda as duas respostas completas", () => {
    expect(divergence(q("m1.q2"), answer({ selected: ["sim"] }), undefined).state).toBe("aguardando");
    expect(divergence(q("m1.q2"), answer({ selected: ["sim"] }), answer({ selected: ["depende"] })).state).toBe(
      "aguardando",
    );
  });

  it("mesmas alternativas: sem divergência", () => {
    const d = divergence(q("m1.q1"), answer({ selected: ["talhao", "safra"] }), answer({ selected: ["safra", "talhao"] }));
    expect(d.state).toBe("sem_divergencia");
  });

  it("alternativas diferentes: possível divergência, com detalhes, sem escolher a correta", () => {
    const d = divergence(q("m1.q1"), answer({ selected: ["talhao"] }), answer({ selected: ["talhao", "variedade"] }));
    expect(d).toEqual({ state: "possivel", details: ["Só Cadene marcou: Variedade dentro do talhão"] });
  });

  it("'Outro' descrito de forma diferente é possível divergência", () => {
    const d = divergence(
      q("m1.q1"),
      answer({ selected: ["outro"], other_text: "Gleba" }),
      answer({ selected: ["outro"], other_text: "Quadra" }),
    );
    expect(d.state).toBe("possivel");
  });

  it("respostas em texto ficam para comparação manual", () => {
    const d = divergence(q("m5.q1"), answer({ explanation: "a" }), answer({ explanation: "b" }));
    expect(d.state).toBe("texto");
  });

  it("tabela compara linha a linha", () => {
    const rows = q("m3.q4").rows!.filter((r) => !r.other);
    const base = Object.fromEntries(rows.map((r) => [r.key, { criterion: "area" }]));
    const d = divergence(
      q("m3.q4"),
      answer({ matrix: base }),
      answer({ matrix: { ...base, combustivel: { criterion: "horas" } } }),
    );
    expect(d).toEqual({
      state: "possivel",
      details: ["Combustível: Manoel Proporcional à área, Cadene Conforme horas de utilização"],
    });
  });
});

describe("cobertura e situação automática", () => {
  it("separa quem respondeu", () => {
    expect(coverage({ manoel: "respondida", cadene: "em_andamento" })).toBe("so_manoel");
    expect(coverage({ manoel: "nao_iniciada", cadene: "respondida" })).toBe("so_cadene");
    expect(coverage({ manoel: "respondida", cadene: "respondida" })).toBe("ambos");
    expect(coverage({ manoel: "em_andamento", cadene: "nao_iniciada" })).toBe("ninguem");
  });

  it("automática: respondida só quando ambos responderam", () => {
    expect(autoValidationStatus("ambos")).toBe("respondida");
    expect(autoValidationStatus("so_manoel")).toBe("pendente");
  });
});
