// Questionário de levantamento de regras de negócio do AWP.
// Fonte única do conteúdo: a tela, o painel, o PDF e a carga no banco
// (scripts/awp-levantamento/db-setup.mjs) leem daqui.
//
// `proposed: true` marca alternativas sugeridas pelo desenvolvimento, que ainda
// precisam ser validadas com o Manoel. As demais vieram do material aprovado.
//
// Este arquivo também é importado direto pelo Node (type stripping), então não
// pode importar outros módulos nem usar sintaxe TS que não seja apagável.

export type OptionDef = {
  key: string;
  label: string;
  proposed?: boolean;
  /** Abre o campo "Qual?" quando escolhida. */
  other?: boolean;
  /** Torna a explicação obrigatória quando escolhida (ex.: "Depende"). */
  requiresExplanation?: boolean;
};

export type ExtraFieldDef = {
  key: "responsible" | "reference_doc";
  label: string;
  help?: string;
};

export type QuestionDef = {
  key: string;
  number: string;
  prompt: string;
  kind: "single" | "multi" | "text" | "matrix";
  options?: OptionDef[];
  /** Somente `matrix`: linhas (tipos de despesa) e critérios por linha. */
  rows?: OptionDef[];
  criteria?: OptionDef[];
  /**
   * Campo de explicação sempre visível. Em perguntas `text` é o próprio campo
   * da resposta. Sem ele, a explicação só aparece quando uma alternativa com
   * `requiresExplanation` é escolhida.
   */
  explanation?: { label: string; help?: string };
  /** Exemplos exibidos como dica no campo de texto. */
  hints?: { text: string; proposed?: boolean };
  extraFields?: ExtraFieldDef[];
};

export type ModuleDef = {
  key: string;
  number: number;
  title: string;
  objective: string;
  /** Orientação exibida ao participante no topo do módulo. */
  guidance?: string;
  /** Contexto interno, exibido só no painel e no PDF. */
  internalNote?: string;
  questions: QuestionDef[];
};

const OTHER: OptionDef = { key: "outro", label: "Outro", other: true };

const YES_NO: OptionDef[] = [
  { key: "sim", label: "Sim" },
  { key: "nao", label: "Não" },
];

const YES_NO_DEPENDS: OptionDef[] = [
  ...YES_NO,
  { key: "depende", label: "Depende", requiresExplanation: true },
];

const YES_NO_PARTIALLY: OptionDef[] = [
  ...YES_NO,
  { key: "parcialmente", label: "Parcialmente", requiresExplanation: true },
];

const EXPLAIN = { label: "Explicação" };

const PERIODICITY: OptionDef[] = [
  { key: "mensal", label: "Mensal", proposed: true },
  { key: "bimestral", label: "Bimestral", proposed: true },
  {
    key: "idade_planta",
    label: "Por idade da planta (ex.: 6, 8, 10, 12 meses)",
    proposed: true,
  },
  { key: "antes_colheita", label: "Só antes da colheita", proposed: true },
  { key: "sem_periodicidade", label: "Sem periodicidade fixa", proposed: true },
  OTHER,
];

const CLOSING_ROLES: OptionDef[] = [
  { key: "proprietario", label: "Proprietário", proposed: true },
  { key: "gerente", label: "Gerente/administrador da fazenda", proposed: true },
  { key: "agronomo", label: "Agrônomo/técnico", proposed: true },
  { key: "financeiro", label: "Financeiro/contador", proposed: true },
  OTHER,
];

const RESPONSIBLE_FIELD: ExtraFieldDef = {
  key: "responsible",
  label: "Nome do responsável (se houver)",
};

export const questionnaire: ModuleDef[] = [
  {
    key: "m1",
    number: 1,
    title: "Estrutura da produção",
    objective: "Entender como a produção é organizada na prática.",
    internalNote:
      "Precisamos identificar como a produção, os custos e a produtividade são organizados.",
    questions: [
      {
        key: "m1.q1",
        number: "1.1",
        prompt: "Qual unidade é usada para controlar o custeio?",
        kind: "multi",
        options: [
          { key: "fazenda", label: "Fazenda", proposed: true },
          { key: "talhao", label: "Talhão", proposed: true },
          { key: "safra", label: "Safra", proposed: true },
          { key: "variedade", label: "Variedade dentro do talhão", proposed: true },
          OTHER,
        ],
        explanation: {
          label: "Explicação",
          help: "Se marcou mais de uma, explique como elas se relacionam (em qual nível o custo é lançado e em qual é consolidado).",
        },
      },
      {
        key: "m1.q2",
        number: "1.2",
        prompt: "Uma mesma fazenda possui vários talhões com safras independentes?",
        kind: "single",
        options: YES_NO_DEPENDS,
      },
      {
        key: "m1.q3",
        number: "1.3",
        prompt: "Um mesmo talhão pode ter diferentes safras ou ciclos ao longo dos anos?",
        kind: "single",
        options: YES_NO_DEPENDS,
      },
      {
        key: "m1.q4",
        number: "1.4",
        prompt: "Uma mesma safra pode ter diferentes variedades dentro do talhão?",
        kind: "single",
        options: YES_NO_DEPENDS,
      },
    ],
  },
  {
    key: "m2",
    number: 2,
    title: "Operações agrícolas e máquinas",
    objective: "Entender como os serviços e o trabalho das máquinas são registrados e custeados.",
    guidance:
      "Não presumimos que todas as informações sejam obrigatórias. Conte como funciona o apontamento real na fazenda.",
    internalNote:
      "Incluído a partir da reunião. Módulo especialmente importante pela experiência anterior do Cadene com o SAP.",
    questions: [
      {
        key: "m2.q1",
        number: "2.1",
        prompt: "Como são registrados os serviços e operações agrícolas realizados?",
        kind: "multi",
        options: [
          { key: "caderno", label: "Caderno/papel", proposed: true },
          { key: "planilha", label: "Planilha", proposed: true },
          { key: "sistema", label: "Sistema (SAP ou outro)", proposed: true },
          { key: "aplicativo", label: "Aplicativo no celular", proposed: true },
          { key: "ordem_servico", label: "Ordem de serviço", proposed: true },
          { key: "nao_registrados", label: "Não são registrados", proposed: true },
          OTHER,
        ],
        explanation: EXPLAIN,
      },
      {
        key: "m2.q2",
        number: "2.2",
        prompt: "Como é medido o trabalho das máquinas?",
        kind: "multi",
        options: [
          { key: "horas", label: "Horas" },
          { key: "area", label: "Área trabalhada" },
          { key: "servico", label: "Serviço" },
          OTHER,
        ],
      },
      {
        key: "m2.q3",
        number: "2.3",
        prompt: "As máquinas são próprias, terceirizadas ou ambas?",
        kind: "single",
        options: [
          { key: "proprias", label: "Próprias" },
          { key: "terceirizadas", label: "Terceirizadas" },
          { key: "ambas", label: "Ambas" },
        ],
      },
      {
        key: "m2.q4",
        number: "2.4",
        prompt: "Como o custo de uma operação com máquina é calculado atualmente?",
        kind: "single",
        options: [
          { key: "hora_maquina", label: "Valor fixo por hora-máquina", proposed: true },
          {
            key: "custo_real",
            label: "Custo real (combustível, manutenção, operador, depreciação)",
            proposed: true,
          },
          { key: "valor_terceiro", label: "Valor cobrado pelo terceiro", proposed: true },
          { key: "valor_hectare", label: "Valor por hectare", proposed: true },
          { key: "nao_calculado", label: "Não é calculado hoje", proposed: true },
          OTHER,
        ],
        explanation: EXPLAIN,
      },
      {
        key: "m2.q5",
        number: "2.5",
        prompt: "Quais informações precisam ser registradas em cada operação?",
        kind: "multi",
        options: [
          { key: "maquina", label: "Máquina utilizada" },
          { key: "operador", label: "Operador" },
          { key: "data", label: "Data" },
          { key: "talhao", label: "Talhão" },
          { key: "atividade", label: "Atividade" },
          { key: "horas", label: "Horas trabalhadas" },
          { key: "area", label: "Área atendida" },
          OTHER,
        ],
        explanation: {
          label: "Como funciona o apontamento hoje?",
          help: "Marque só o que é registrado ou precisa ser registrado de verdade.",
        },
      },
    ],
  },
  {
    key: "m3",
    number: 3,
    title: "Insumos, despesas e distribuição de custos",
    objective: "Entender como os gastos são atribuídos à produção.",
    guidance:
      "A fazenda não precisa usar um único critério para tudo: a resposta pode ser diferente conforme o tipo de despesa.",
    questions: [
      {
        key: "m3.q1",
        number: "3.1",
        prompt: "Como os insumos são associados ao custo de uma safra?",
        kind: "single",
        options: [
          {
            key: "direto_aplicacao",
            label: "Lançados direto na safra/talhão onde foram aplicados",
            proposed: true,
          },
          { key: "rateio_estoque", label: "Rateados a partir do estoque", proposed: true },
          { key: "nota_fiscal", label: "Pela nota fiscal de compra", proposed: true },
          OTHER,
        ],
        explanation: EXPLAIN,
      },
      {
        key: "m3.q2",
        number: "3.2",
        prompt: "O custo é considerado no momento da compra ou da aplicação na lavoura?",
        kind: "single",
        options: [
          { key: "compra", label: "Na compra" },
          { key: "aplicacao", label: "Na aplicação" },
          {
            key: "depende",
            label: "Depende do insumo",
            proposed: true,
            requiresExplanation: true,
          },
        ],
      },
      {
        key: "m3.q3",
        number: "3.3",
        prompt: "Como são tratados os insumos comprados que não foram usados por inteiro?",
        kind: "single",
        options: [
          { key: "estoque", label: "Ficam em estoque para a próxima safra", proposed: true },
          { key: "safra_compra", label: "Entram inteiros na safra da compra", proposed: true },
          { key: "devolvidos", label: "Devolvidos ou vendidos", proposed: true },
          { key: "perda", label: "Tratados como perda", proposed: true },
          OTHER,
        ],
        explanation: EXPLAIN,
      },
      {
        key: "m3.q4",
        number: "3.4",
        prompt: "Como uma despesa que atende vários talhões deve ser distribuída?",
        kind: "matrix",
        rows: [
          { key: "insumos", label: "Insumos agrícolas" },
          { key: "maquinas_proprias", label: "Máquinas próprias" },
          { key: "maquinas_terceirizadas", label: "Máquinas terceirizadas" },
          { key: "mao_de_obra", label: "Mão de obra" },
          { key: "combustivel", label: "Combustível" },
          { key: "manutencao", label: "Manutenção" },
          { key: "transporte", label: "Transporte" },
          { key: "servicos_tecnicos", label: "Serviços técnicos" },
          { key: "administracao", label: "Administração/estrutura" },
          { key: "arrendamento", label: "Arrendamento" },
          { key: "financeiros_tributos", label: "Custos financeiros/tributos" },
          { key: "depreciacao_seguros", label: "Depreciação/seguros" },
          { key: "outro_tipo", label: "Outro tipo de despesa", other: true },
        ],
        criteria: [
          { key: "area", label: "Proporcional à área" },
          { key: "horas", label: "Conforme horas de utilização" },
          { key: "quantidade", label: "Conforme quantidade utilizada" },
          { key: "manual", label: "Distribuição manual" },
          OTHER,
          { key: "nao_definido", label: "Ainda não definido" },
        ],
        explanation: EXPLAIN,
      },
      {
        key: "m3.q5",
        number: "3.5",
        prompt: "O critério de distribuição pode variar conforme o tipo de despesa?",
        kind: "single",
        options: [...YES_NO, { key: "nao_definido", label: "Não definido" }],
      },
      {
        key: "m3.q6",
        number: "3.6",
        prompt:
          "Como devem ser tratados os custos anteriores ao plantio ou posteriores à colheita?",
        kind: "single",
        options: [
          { key: "safra_atual", label: "Entram na safra atual", proposed: true },
          { key: "safra_seguinte", label: "Entram na safra seguinte", proposed: true },
          { key: "rateio_safras", label: "Rateados entre safras", proposed: true },
          { key: "despesa_geral", label: "Despesa geral da fazenda", proposed: true },
          OTHER,
        ],
        explanation: EXPLAIN,
      },
    ],
  },
  {
    key: "m4",
    number: 4,
    title: "Variedades e acompanhamento da lavoura",
    objective: "Entender como as variedades são acompanhadas individualmente.",
    questions: [
      {
        key: "m4.q1",
        number: "4.1",
        prompt: "Uma variedade pode ocupar diferentes áreas de um mesmo talhão?",
        kind: "single",
        options: YES_NO,
      },
      {
        key: "m4.q2",
        number: "4.2",
        prompt: "Variedades diferentes podem ter datas de plantio e colheita diferentes?",
        kind: "single",
        options: YES_NO,
      },
      {
        key: "m4.q3",
        number: "4.3",
        prompt: "É necessário acompanhar os custos individualmente por variedade?",
        kind: "single",
        options: YES_NO_PARTIALLY,
      },
      {
        key: "m4.q4",
        number: "4.4",
        prompt: "Quais indicadores precisam ser comparados entre variedades?",
        kind: "multi",
        options: [
          { key: "custo_ha", label: "Custo por hectare", proposed: true },
          { key: "custo_1000kg", label: "Custo por 1.000 kg", proposed: true },
          { key: "produtividade", label: "Produtividade (t/ha)", proposed: true },
          { key: "teor_amido", label: "Teor de amido (%)", proposed: true },
          { key: "amido_ha", label: "Amido por hectare", proposed: true },
          { key: "ciclo", label: "Ciclo (dias do plantio à colheita)", proposed: true },
          { key: "estande", label: "Estande/falhas", proposed: true },
          OTHER,
        ],
      },
    ],
  },
  {
    key: "m5",
    number: 5,
    title: "Produtividade e teor de amido",
    objective:
      "Definir como as informações agronômicas são obtidas e utilizadas nos cálculos.",
    guidance:
      "Ajude-nos a separar a estimativa, a medição periódica e o resultado efetivo da colheita.",
    questions: [
      {
        key: "m5.q1",
        number: "5.1",
        prompt: "Como é estimada a produtividade durante o desenvolvimento da lavoura?",
        kind: "text",
        explanation: { label: "Resposta" },
      },
      {
        key: "m5.q2",
        number: "5.2",
        prompt: "Em quais momentos as avaliações são realizadas atualmente na fazenda?",
        kind: "multi",
        options: PERIODICITY,
        explanation: EXPLAIN,
      },
      {
        key: "m5.q3",
        number: "5.3",
        prompt: "Como é determinada a produtividade real após a colheita?",
        kind: "text",
        explanation: { label: "Resposta" },
      },
      {
        key: "m5.q4",
        number: "5.4",
        prompt: "Como é realizada a medição do teor de amido?",
        kind: "text",
        explanation: { label: "Resposta" },
        hints: {
          text: "balança hidrostática, valor informado pela fecularia, laboratório",
          proposed: true,
        },
      },
      {
        key: "m5.q5",
        number: "5.5",
        prompt: "Qual produtividade deve ser usada para calcular o custo definitivo por 1.000 kg?",
        kind: "single",
        options: [
          { key: "estimada", label: "Estimada", proposed: true },
          { key: "ultima_avaliacao", label: "Última avaliação periódica", proposed: true },
          {
            key: "real_colheita",
            label: "Real da colheita (pesagem/romaneio)",
            proposed: true,
          },
          OTHER,
        ],
      },
      {
        key: "m5.q6",
        number: "5.6",
        prompt: "Como deve ser calculada a quantidade estimada de amido por hectare?",
        kind: "text",
        explanation: { label: "Fórmula ou explicação" },
        extraFields: [
          {
            key: "reference_doc",
            label: "Documento de referência",
            help: "Nome ou identificação do documento. O arquivo pode ser enviado por fora.",
          },
        ],
      },
    ],
  },
  {
    key: "m6",
    number: 6,
    title: "Avaliações e metodologias técnicas",
    objective: "Compreender os protocolos agronômicos utilizados nas avaliações.",
    questions: [
      {
        key: "m6.q1",
        number: "6.1",
        prompt: "Já existem protocolos técnicos utilizados nas avaliações?",
        kind: "single",
        options: YES_NO_PARTIALLY,
      },
      {
        key: "m6.q2",
        number: "6.2",
        prompt: "Qual periodicidade é recomendada pelos protocolos técnicos para cada avaliação?",
        kind: "multi",
        options: PERIODICITY,
        explanation: {
          label: "Explicação",
          help: "Indique a periodicidade correspondente a cada avaliação.",
        },
      },
      {
        key: "m6.q3",
        number: "6.3",
        prompt: "Quais indicadores são obrigatórios em cada avaliação?",
        kind: "multi",
        options: [
          { key: "estande", label: "Estande/população de plantas", proposed: true },
          { key: "altura", label: "Altura", proposed: true },
          { key: "hastes", label: "Número de hastes", proposed: true },
          { key: "peso_raizes", label: "Peso de raízes da amostra", proposed: true },
          { key: "teor_amido", label: "Teor de amido", proposed: true },
          { key: "pragas_doencas", label: "Pragas e doenças", proposed: true },
          { key: "plantas_daninhas", label: "Plantas daninhas", proposed: true },
          OTHER,
        ],
      },
      {
        key: "m6.q4",
        number: "6.4",
        prompt: "Uma metodologia pode ser modificada ao longo do tempo?",
        kind: "single",
        options: YES_NO,
      },
      {
        key: "m6.q5",
        number: "6.5",
        prompt: "Precisamos preservar a metodologia utilizada em avaliações anteriores?",
        kind: "single",
        options: [...YES_NO, { key: "a_definir", label: "A definir" }],
      },
    ],
  },
  {
    key: "m7",
    number: 7,
    title: "Fechamento e aprovação das safras",
    objective: "Definir as regras de encerramento e preservação dos resultados.",
    questions: [
      {
        key: "m7.q1",
        number: "7.1",
        prompt: "Em que momento uma safra é considerada encerrada?",
        kind: "single",
        options: [
          { key: "fim_colheita", label: "Ao fim da colheita", proposed: true },
          {
            key: "entrega_pagamento",
            label: "Após entrega e recebimento do pagamento",
            proposed: true,
          },
          { key: "conferencia", label: "Após a conferência dos custos", proposed: true },
          { key: "data_fixa", label: "Em data fixa do calendário", proposed: true },
          OTHER,
        ],
        explanation: EXPLAIN,
      },
      {
        key: "m7.q2",
        number: "7.2",
        prompt: "Quem realiza a conferência final dos custos?",
        kind: "multi",
        options: CLOSING_ROLES,
        extraFields: [RESPONSIBLE_FIELD],
      },
      {
        key: "m7.q3",
        number: "7.3",
        prompt: "Quem aprova o fechamento?",
        kind: "multi",
        options: CLOSING_ROLES,
        extraFields: [RESPONSIBLE_FIELD],
      },
      {
        key: "m7.q4",
        number: "7.4",
        prompt: "Uma safra aprovada pode receber correções?",
        kind: "single",
        options: [...YES_NO, { key: "com_autorizacao", label: "Com autorização" }],
      },
      {
        key: "m7.q5",
        number: "7.5",
        prompt: "É necessário justificar uma correção após o fechamento?",
        kind: "single",
        options: YES_NO,
      },
      {
        key: "m7.q6",
        number: "7.6",
        prompt: "O resultado original deve permanecer disponível após uma correção?",
        kind: "single",
        options: YES_NO,
      },
    ],
  },
];

export const allQuestions: QuestionDef[] = questionnaire.flatMap((m) => m.questions);

export const questionByKey: Map<string, QuestionDef> = new Map(
  allQuestions.map((q) => [q.key, q]),
);

export const moduleOfQuestion: Map<string, ModuleDef> = new Map(
  questionnaire.flatMap((m) => m.questions.map((q) => [q.key, m] as const)),
);
