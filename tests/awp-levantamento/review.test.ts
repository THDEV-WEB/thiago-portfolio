// Conteúdo e regras da revisão (segunda rodada).
import { describe, expect, it } from "vitest";
import { allQuestions, questionByKey } from "../../src/app/awp/levantamento/_content/questionario";
import { AGREED_QUESTIONS, reviewItemByKey, reviewItems } from "../../src/app/awp/levantamento/_content/revisao";
import { emptyAnswer } from "../../src/app/awp/levantamento/_lib/answers";
import {
  choiceLabel,
  itemsFor,
  normalizeReview,
  plainText,
  referencedNumbers,
  requiredItemsFor,
  reviewComplete,
  reviewMissing,
  ruleTextFor,
  splitRefs,
} from "../../src/app/awp/levantamento/_lib/review";

const item = (key: string) => reviewItemByKey.get(key)!;

describe("conteúdo da revisão", () => {
  it("cada pergunta do questionário aparece em exatamente um bloco", () => {
    const placed = [
      ...AGREED_QUESTIONS,
      ...reviewItems.filter((i) => ["entendimento", "alinhar", "completar"].includes(i.section)).map((i) => i.questionKey!),
    ];
    expect(placed.sort()).toEqual(allQuestions.map((q) => q.key).sort());
  });

  it("tem os blocos aprovados: 17 iguais, 10 de entendimento, 8 para alinhar, 3 novas, 1 para completar e 6 dúvidas", () => {
    const count = (section: string) => reviewItems.filter((i) => i.section === section).length;
    expect(AGREED_QUESTIONS).toHaveLength(17);
    expect(count("entendimento")).toBe(10);
    expect(count("alinhar")).toBe(8);
    expect(count("nova")).toBe(3);
    expect(count("completar")).toBe(1);
    expect(count("duvida")).toBe(6);
    expect(count("final")).toBe(4);
  });

  it("chaves únicas, no formato aceito pelo banco, com perguntas e opções válidas", () => {
    expect(new Set(reviewItems.map((i) => i.key)).size).toBe(reviewItems.length);
    for (const i of reviewItems) {
      expect(i.key).toMatch(/^[a-z][a-z0-9_.-]{0,59}$/);
      if (i.questionKey) expect(questionByKey.has(i.questionKey)).toBe(true);
      expect(new Set(i.choices.map((c) => c.key)).size).toBe(i.choices.length);
      for (const c of i.choices) expect(c.key.length).toBeLessThanOrEqual(40);
      expect(i.audience.length).toBeGreaterThan(0);
    }
  });

  it("todo link {x.y} aponta para uma pergunta que existe", () => {
    const numbers = new Set(allQuestions.map((q) => q.number));
    for (const i of reviewItems) {
      const texts = [i.why, i.text, ...(i.bullets ?? []), ...Object.values(i.summary ?? {})].filter(Boolean) as string[];
      for (const t of texts) for (const n of referencedNumbers(t)) expect(numbers.has(n), `${i.key}: ${n}`).toBe(true);
    }
  });

  it("todo item de entendimento e de alinhar tem o “Pergunto porque”", () => {
    for (const i of reviewItems.filter((x) => x.section === "entendimento" || x.section === "alinhar")) {
      expect(i.why, i.key).toBeTruthy();
      expect(i.text, i.key).toBeTruthy();
    }
  });

  it("Manoel revisa 22 itens e Cadene 29 (5.6 e as 6 dúvidas são só dele)", () => {
    expect(requiredItemsFor("manoel")).toHaveLength(22);
    expect(requiredItemsFor("cadene")).toHaveLength(29);
    expect(itemsFor("manoel").some((i) => i.section === "duvida")).toBe(false);
  });
});

describe("regras da revisão", () => {
  it("descarta opção que não existe e resposta nova fora do “Responder de novo”", () => {
    expect(normalizeReview(item("alinhar.2.4"), { choice: "inventada", comment: "x" })).toEqual({
      choice: "",
      comment: "x",
      answer: null,
    });
    expect(normalizeReview(item("alinhar.2.4"), { choice: "proposta", answer: { selected: ["hora_maquina"] } }).answer).toBeNull();
  });

  it("“Responder de novo” guarda a nova resposta já normalizada e sem “Preciso discutir isso”", () => {
    const v = normalizeReview(item("alinhar.2.4"), {
      choice: "responder",
      answer: { selected: ["custo_real", "inventada"], explanation: "Custo real", needs_discussion: true },
    });
    expect(v.answer?.selected).toEqual(["custo_real"]);
    expect(v.answer?.needs_discussion).toBe(false);
  });

  it("conta como revisado só quando completo", () => {
    const understood = item("entendimento.1.2");
    expect(reviewComplete(understood, { choice: "certo", comment: "", answer: null })).toBe(true);
    expect(reviewComplete(understood, { choice: "nao", comment: "", answer: null })).toBe(false);
    expect(reviewMissing(understood, { choice: "nao", comment: "", answer: null })).toEqual([
      "Escreva: O que não está certo?",
    ]);
    expect(reviewComplete(understood, { choice: "nao", comment: "Falta o pousio", answer: null })).toBe(true);

    const align = item("alinhar.2.4");
    expect(reviewComplete(align, { choice: "responder", comment: "", answer: emptyAnswer() })).toBe(false);
    expect(
      reviewComplete(align, {
        choice: "responder",
        comment: "",
        answer: { ...emptyAnswer(), selected: ["hora_maquina"], explanation: "Tabela da cooperativa" },
      }),
    ).toBe(true);

    const free = item("final.mais");
    expect(reviewComplete(free, { choice: "", comment: "Relatório mensal", answer: null })).toBe(true);
  });

  it("para o próprio, “Fico com a resposta do Manoel” vira “Fico com a minha resposta”", () => {
    const align = item("alinhar.7.1");
    const manoel = align.choices.find((c) => c.key === "manoel")!;
    expect(choiceLabel(align, manoel, "manoel")).toBe("Fico com a minha resposta");
    expect(choiceLabel(align, manoel, "cadene")).toBe("Fico com a resposta do Manoel");
  });

  it("links: separa o texto e gera o texto simples da regra", () => {
    expect(splitRefs("O Manoel disse o mesmo {3.6}.")).toEqual([
      { kind: "text", value: "O Manoel disse o mesmo " },
      { kind: "ref", number: "3.6", questionKey: "m3.q6" },
      { kind: "text", value: "." },
    ]);
    expect(plainText("Ver {7.2} {7.3}")).toBe("Ver (ver 7.2) (ver 7.3)");
    expect(ruleTextFor(item("entendimento.1.2"))).toMatch(/^Sim\. Cada talhão tem o próprio ciclo/);
    expect(ruleTextFor(item("alinhar.7.1"))).toContain("- Colhida: quando a colheita termina");
  });
});
