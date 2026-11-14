// Revisão das respostas (segunda rodada do levantamento). Textos aprovados
// pelo Thiago em 2026-11-13, escritos em nome dele para o Manoel e o Cadene.
//
// Marcadores {3.6} nos textos viram o link "ver 3.6", que abre a pergunta com
// as respostas dos dois. As respostas originais nunca são alteradas: o que
// eles responderem aqui fica em awp.review_responses.

export type ReviewSlot = "manoel" | "cadene";

export type ReviewSection = "entendimento" | "alinhar" | "nova" | "completar" | "duvida" | "final";

export type ReviewChoice = {
  key: string;
  label: string;
  /** Exige comentário para o item contar como revisado. */
  commentRequired?: boolean;
  /** Rótulo do campo de comentário quando esta opção está marcada. */
  commentLabel?: string;
  /** Abre a pergunta original, no formato do questionário, para responder de novo. */
  reanswer?: boolean;
};

export type ReviewItemDef = {
  key: string;
  section: ReviewSection;
  /** Quem responde o item. */
  audience: ReviewSlot[];
  /** Pergunta original do questionário. */
  questionKey?: string;
  /** Enunciado do item; sem ele, vale o da pergunta original. */
  title?: string;
  /** Resumo do que cada um respondeu na primeira rodada. */
  summary?: Partial<Record<ReviewSlot, string>>;
  /** "Pergunto porque…" */
  why?: string;
  /** "Entendi que…" (entendimento) ou a proposta (alinhar). */
  text?: string;
  bullets?: string[];
  /** Mostra a tabela 3.4 linha a linha: onde concordaram e onde divergiram. */
  matrixComparison?: boolean;
  /** Vazio = só campo de texto livre. */
  choices: ReviewChoice[];
  /** Não conta no progresso (campos livres do final). */
  optional?: boolean;
};

const BOTH: ReviewSlot[] = ["manoel", "cadene"];
const CADENE: ReviewSlot[] = ["cadene"];

const UNDERSTOOD: ReviewChoice[] = [
  { key: "certo", label: "Está certo" },
  { key: "nao", label: "Não é bem isso", commentRequired: true, commentLabel: "O que não está certo?" },
];

/** As opções "manoel" e "cadene" aparecem como "Fico com a minha resposta" para o próprio. */
const ALIGN: ReviewChoice[] = [
  { key: "proposta", label: "Concordo com a proposta" },
  { key: "manoel", label: "Fico com a resposta do Manoel" },
  { key: "cadene", label: "Fico com a resposta do Cadene" },
  { key: "responder", label: "Responder de novo", reanswer: true },
];

const DOUBT: ReviewChoice[] = [
  { key: "resolvida", label: "Não, pode desconsiderar" },
  { key: "continua", label: "Sim, a dúvida continua", commentRequired: true, commentLabel: "Qual é a dúvida?" },
];

/** Perguntas em que os dois responderam igual (só para consulta). */
export const AGREED_QUESTIONS: string[] = [
  "m1.q3", "m2.q3", "m2.q5", "m3.q1", "m3.q2", "m3.q3", "m3.q5", "m3.q6", "m4.q1",
  "m4.q2", "m5.q2", "m5.q5", "m6.q1", "m6.q2", "m6.q4", "m7.q3", "m7.q4",
];

export const reviewItems: ReviewItemDef[] = [
  // Responderam diferente, mas com o mesmo sentido.
  {
    key: "entendimento.1.2",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m1.q2",
    summary: {
      manoel: "Sim.",
      cadene:
        "Depende. Cada talhão tem a própria data de plantio, variedade e colheita, e talhões diferentes ficam em fases diferentes ao mesmo tempo.",
    },
    why: "As alternativas foram diferentes, mas a explicação do Cadene descreve um “sim”.",
    text: "Entendi que sim. Cada talhão tem o próprio ciclo. O custo é apurado por talhão e ciclo e somado na fazenda para a visão geral.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.1.4",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m1.q4",
    summary: {
      manoel: "Sim.",
      cadene:
        "Depende. O comum é uma variedade por talhão, mas pode haver mais de uma: por falta de maniva, para testar uma variedade nova ou para escalonar a colheita.",
    },
    why: "As alternativas foram diferentes, mas os dois dizem que pode acontecer.",
    text: "Entendi que sim. O sistema precisa permitir mais de uma variedade no mesmo ciclo, cada uma com a sua área plantada {4.3}.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.2.1",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m2.q1",
    summary: {
      manoel: "Caderno/papel, Planilha e Não são registrados.",
      cadene: "Caderno/papel, Planilha e Ordem de serviço.",
    },
    why: "Os dois marcaram papel e planilha. O Manoel acrescentou “Não são registrados”, e o Cadene acrescentou “Ordem de serviço”.",
    text: "Entendi que hoje as operações são anotadas em papel e depois passadas para planilha. Alguns serviços saem de uma ordem de serviço, e parte das operações nem chega a ser registrada. O sistema passa a ser o lugar desse registro.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.2.2",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m2.q2",
    summary: { manoel: "Horas.", cadene: "Horas e Área trabalhada." },
    why: "Só o Cadene marcou a área.",
    text: "Entendi que o custo é calculado pelas horas, e a área também é registrada em cada operação, para medir o rendimento em hectares por hora. O Manoel também pede a área na {2.5}.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.4.4",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m4.q4",
    summary: {
      manoel: "Produtividade, Teor de amido, Amido por hectare, Ciclo e Estande/falhas.",
      cadene: "Produtividade, Teor de amido, Amido por hectare, Ciclo, Custo por hectare e Custo por 1.000 kg.",
    },
    why: "O Cadene não marcou Estande/falhas, mas explicou esse indicador na resposta. E só ele marcou os de custo.",
    text: "Entendi que os dois querem comparar os quatro indicadores em comum e também Estande/falhas. Os de custo entram se o custo for acompanhado por variedade {4.3}.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.5.1",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m5.q1",
    summary: {
      manoel:
        "Amostragem em linha de plantio ou em parcela de tamanho definido. As plantas são pesadas e o resultado é extrapolado para hectare ou alqueire.",
      cadene: "Amostragem em campo, com a média histórica da variedade no começo e uma nova amostragem perto da colheita.",
    },
    why: "É resposta escrita, e cada um descreveu de um jeito.",
    text: "Entendi que a estimativa é feita por amostragem. As plantas de uma linha ou de uma parcela de tamanho definido são colhidas, as raízes são pesadas e o resultado é extrapolado para o hectare ou o alqueire. A média histórica da variedade serve de apoio no começo do ciclo, e a estimativa é refeita conforme a planta cresce.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.5.3",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m5.q3",
    summary: {
      manoel: "Volume colhido, pelos relatórios de pesagem da indústria, dividido pela área do talhão.",
      cadene: "Soma dos tickets de balança dividida pela área colhida. Peso bruto para a produtividade e peso líquido para o financeiro.",
    },
    why: "O Cadene acrescentou a colheita parcial e a diferença entre peso bruto e líquido.",
    text: "Entendi que a produtividade real é o peso colhido dividido pela área colhida. Se a colheita for parcial, vale só a área colhida. O peso bruto vale para a produtividade, e o peso líquido, com os descontos da indústria, vale para o resultado financeiro.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.5.4",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m5.q4",
    summary: {
      manoel: "Balança hidrostática, normalmente feita pela indústria.",
      cadene: "Balança hidrostática, na indústria em cada carga e na fazenda na amostragem antes da colheita.",
    },
    why: "O Cadene acrescentou a medição feita na fazenda.",
    text: "Entendi que o resultado que vale é o da indústria, medido em cada carga. A fazenda também pode medir antes da colheita, para decidir quando colher.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.6.3",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m6.q3",
    summary: {
      manoel:
        "Estande/população, Peso de raízes da amostra e Teor de amido. Pragas e doenças, num apontamento semanal. Registro de chuva, que ele chamou de crucial.",
      cadene:
        "Os mesmos três, mais Pragas e doenças, Plantas daninhas e os dados de cada avaliação: data, talhão, variedade, idade da planta, responsável e observações.",
    },
    why: "O Cadene põe pragas, doenças e daninhas em toda avaliação. O Manoel quer pragas e doenças num apontamento semanal à parte.",
    text: "Entendi que em toda avaliação são obrigatórios estande, peso de raízes e teor de amido, com data, talhão, variedade e idade da planta. Pragas, doenças e plantas daninhas ficam no acompanhamento semanal. O sistema também registra o volume de chuva.",
    choices: UNDERSTOOD,
  },
  {
    key: "entendimento.7.2",
    section: "entendimento",
    audience: BOTH,
    questionKey: "m7.q2",
    summary: {
      manoel: "Proprietário, Gerente, Agrônomo e Financeiro.",
      cadene: "Gerente, Agrônomo e Financeiro. Para ele, o proprietário costuma só aprovar.",
    },
    why: "Só o Manoel incluiu o proprietário na conferência.",
    text: "Entendi que os quatro conferem, cada um na sua parte, e o proprietário confere também, não só aprova. Quem lançou um custo não é quem o confere.",
    choices: UNDERSTOOD,
  },

  // Responderam diferente de verdade: proposta para alinhar.
  {
    key: "alinhar.1.1",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m1.q1",
    summary: {
      manoel: "Safra → Fazenda → Talhão → Cultura (mandioca, milho, milheto, soja) → Variedade.",
      cadene: "Fazenda, Talhão e Safra. A variedade é uma característica do talhão, não um nível de custo.",
    },
    why: "Os dois lançam o custo no talhão, mas o Manoel pôs Cultura e Variedade como níveis, e o Cadene não.",
    text: "A ordem é Safra → Fazenda → Talhão → Cultura → Variedade. A safra é o ciclo de cultivo, do preparo do solo à colheita, e não o ano do calendário. O Manoel disse o mesmo {3.6}. O custo é lançado no talhão. A variedade só vira nível de custo quando mais de uma divide o mesmo talhão {4.3}. Se o sistema vai ter outras culturas é a pergunta nova “Culturas”, mais abaixo.",
    choices: ALIGN,
  },
  {
    key: "alinhar.2.4",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m2.q4",
    summary: {
      manoel: "Custo real: a soma das contas da máquina dividida pelas horas trabalhadas em cada talhão.",
      cadene: "Valor fixo por hora-máquina, por tipo de equipamento, revisado de vez em quando.",
    },
    why: "São duas formas diferentes de calcular. Uma usa o que a máquina realmente gastou, a outra um valor de tabela.",
    text: "A hora custa o que a máquina gastou no período (combustível, manutenção, operador e depreciação) dividido pelas horas que ela trabalhou. Cada operação leva para o talhão as suas horas vezes esse valor. Como o custo real só fecha no fim do período, durante o ciclo o sistema usa um valor de referência por hora e acerta com o real no fechamento. Máquina terceirizada entra pelo valor que o terceiro cobrou {2.3}.",
    choices: ALIGN,
  },
  {
    key: "alinhar.3.4",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m3.q4",
    matrixComparison: true,
    why: "O Manoel marcou “Distribuição manual” em 6 tipos, ou seja, decidir a cada lançamento. O Cadene usou uma regra fixa para cada um. Os dois disseram que a regra pode variar por tipo {3.5}.",
    text: "Cada tipo tem uma regra padrão, que pode ser trocada em qualquer lançamento. Os padrões são:",
    bullets: [
      "Insumos: quantidade aplicada em cada talhão, ou a área quando não houver quantidade.",
      "Mão de obra: horas no talhão.",
      "Manutenção: horas de uso, porque já faz parte da hora-máquina {2.4}.",
      "Transporte: quantidade transportada.",
      "Serviços técnicos, administração, custos financeiros e depreciação/seguros: área.",
    ],
    choices: ALIGN,
  },
  {
    key: "alinhar.4.3",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m4.q3",
    summary: { manoel: "Não.", cadene: "Parcialmente: só quando há mais de uma variedade no mesmo talhão." },
    why: "O Manoel respondeu “Não”, mas marcou “Variedade dentro do talhão” como unidade de custeio {1.1} e disse que um talhão pode ter mais de uma variedade {1.4}.",
    text: "O custo é acompanhado por talhão. Se o talhão tem uma variedade, o custo dele já é o da variedade, sem trabalho a mais. Se tem mais de uma, o custo comum (preparo e adubação) é dividido pela área de cada variedade, e a colheita é lançada direto em cada uma. Assim dá para comparar o custo por tonelada entre variedades {4.4}.",
    choices: ALIGN,
  },
  {
    key: "alinhar.6.5",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m6.q5",
    summary: { manoel: "Não.", cadene: "Sim, porque sem o método não dá para saber se dois números são comparáveis." },
    why: "Os dois disseram que a metodologia pode mudar {6.4}. Se ela muda e a antiga não fica registrada, uma produtividade medida com 5 plantas por ponto e outra medida com 10 aparecem como se fossem iguais.",
    text: "Cada avaliação guarda sozinha qual metodologia foi usada e desde quando ela vale. Ninguém preenche nada a mais. Ao comparar dados de metodologias diferentes, o sistema avisa.",
    choices: ALIGN,
  },
  {
    key: "alinhar.7.1",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m7.q1",
    summary: { manoel: "Ao fim da colheita.", cadene: "Depois da conferência dos custos." },
    why: "Entre o fim da colheita e a conferência ainda chegam tickets de pesagem e notas fiscais. É preciso definir até quando a safra aceita lançamentos.",
    text: "A safra passa por duas etapas:",
    bullets: [
      "Colhida: quando a colheita termina, como o Manoel disse {3.6}. A partir daí não entram mais operações de campo, mas ainda entram pesagens e notas.",
      "Fechada: quando os custos foram conferidos e aprovados {7.2} {7.3}. A partir daí só entram correções autorizadas {7.4}.",
    ],
    choices: ALIGN,
  },
  {
    key: "alinhar.7.5",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m7.q5",
    summary: { manoel: "Não.", cadene: "Sim, com o motivo, a data, o valor e quem autorizou." },
    why: "Os dois disseram que a correção precisa de autorização {7.4}. Sem o motivo, depois ninguém sabe o que foi autorizado nem por quê.",
    text: "Toda correção registra o motivo, a data, o valor e quem autorizou. O motivo é escolhido numa lista curta (nota atrasada, erro de lançamento, outro), para não virar burocracia.",
    choices: ALIGN,
  },
  {
    key: "alinhar.7.6",
    section: "alinhar",
    audience: BOTH,
    questionKey: "m7.q6",
    summary: { manoel: "Não.", cadene: "Sim, o resultado aprovado fica ao lado do corrigido." },
    why: "Se a correção substitui o resultado aprovado, some o registro do que foi aprovado no fechamento.",
    text: "A correção não apaga o resultado aprovado. O original fica guardado para consulta, e nos relatórios e nas comparações entre safras vale o resultado corrigido.",
    choices: ALIGN,
  },

  // Perguntas novas, surgidas das respostas.
  {
    key: "nova.culturas",
    section: "nova",
    audience: BOTH,
    title: "O sistema vai custear outras culturas além da mandioca?",
    why: "Na pergunta {1.1} o Manoel incluiu a cultura (mandioca, milho, milheto, soja), e isso muda o tamanho do sistema.",
    choices: [
      { key: "sim_inicio", label: "Sim, desde o início" },
      { key: "sim_depois", label: "Sim, mas depois" },
      { key: "nao", label: "Não, só mandioca" },
    ],
  },
  {
    key: "nova.alqueire",
    section: "nova",
    audience: BOTH,
    title: "O sistema precisa trabalhar com alqueire também?",
    why: "Na pergunta {5.1} o Manoel citou hectare e alqueire.",
    choices: [
      { key: "sim", label: "Sim", commentRequired: true, commentLabel: "Qual alqueire: paulista, mineiro ou outro?" },
      { key: "nao", label: "Não, só hectare" },
    ],
  },
  {
    key: "nova.aprovacao",
    section: "nova",
    audience: BOTH,
    title: "A aprovação do fechamento precisa dos dois, ou basta um?",
    why: "Na pergunta {7.3} os dois marcaram proprietário e gerente, e o sistema precisa saber se o fechamento exige as duas aprovações.",
    choices: [
      { key: "dois", label: "Precisa dos dois" },
      { key: "um", label: "Basta um" },
      { key: "outro", label: "Outro", commentRequired: true, commentLabel: "Como deve ser?" },
    ],
  },

  // Só para o Cadene.
  {
    key: "completar.5.6",
    section: "completar",
    audience: CADENE,
    questionKey: "m5.q6",
    why: "Sua resposta tratou do custo por 1.000 kg, que é o assunto da {5.5}. A pergunta é sobre a quantidade estimada de amido por hectare.",
    text: "O Manoel respondeu: volume produzido × teor de amido, associado à análise de renda da tabela CEPEA.",
    choices: [
      { key: "manoel", label: "Concordo com o Manoel" },
      { key: "responder", label: "Quero responder", reanswer: true },
    ],
  },
  ...["m1.q1", "m1.q2", "m1.q3", "m2.q4", "m3.q1", "m6.q1"].map(
    (questionKey): ReviewItemDef => ({
      key: `duvida.${questionKey.slice(1).replace(".q", ".")}`,
      section: "duvida",
      audience: CADENE,
      questionKey,
      choices: DOUBT,
    }),
  ),

  // Antes de começar a construir o sistema.
  {
    key: "final.duvidas",
    section: "final",
    audience: BOTH,
    title: "Ficou alguma dúvida sobre o que definimos?",
    choices: [],
    optional: true,
  },
  {
    key: "final.mais",
    section: "final",
    audience: BOTH,
    title: "O sistema precisa de mais alguma coisa que não apareceu nas perguntas?",
    choices: [],
    optional: true,
  },
  {
    key: "final.mudar",
    section: "final",
    audience: BOTH,
    title: "Quer mudar mais alguma resposta? Escreva aqui.",
    choices: [],
    optional: true,
  },
  {
    key: "final.largada",
    section: "final",
    audience: BOTH,
    title: "Podemos começar a construir o sistema com base nestas definições?",
    choices: [
      { key: "sim", label: "Sim, pode começar" },
      { key: "nao", label: "Ainda não", commentRequired: true, commentLabel: "O que falta?" },
    ],
  },
];

export const reviewItemByKey: Map<string, ReviewItemDef> = new Map(reviewItems.map((i) => [i.key, i]));

export const REVIEW_SECTIONS: Record<ReviewSection, { title: string; intro?: string }> = {
  entendimento: {
    title: "Entendi assim. Está certo?",
    intro: "Vocês responderam diferente, mas entendi que querem dizer a mesma coisa. Confirme se entendi certo.",
  },
  alinhar: {
    title: "Precisamos alinhar",
    intro: "Aqui as respostas foram diferentes de verdade. Para cada uma há uma proposta. Escolha uma opção e, se quiser, comente.",
  },
  nova: { title: "Perguntas novas", intro: "Surgiram das respostas de vocês." },
  completar: { title: "Só para você" },
  duvida: {
    title: "Suas marcações “Preciso discutir isso”",
    intro: "A marcação continua ativa nestas perguntas, embora você tenha respondido todas depois. A dúvida continua?",
  },
  final: {
    title: "Antes de começarmos a construir o sistema",
    intro: "Se estiver tudo certo, já vamos conversar sobre começar a construir. Antes disso:",
  },
};
