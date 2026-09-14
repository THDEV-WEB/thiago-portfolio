// Conteúdo exclusivo do AWP — Agricultural Wealth Project.
// Independente do conteúdo do portfólio (src/lib/content.ts): não reutilizar
// nem misturar dados com outros projetos (Encanto, Valion Sistemas etc.).

export type FlowStep = string;

export type ProviderArchitecture = {
  name: string;
  region: string;
  flow: FlowStep[];
  services: string[];
  notes: string[];
};

export type CostTableRow = {
  users: string;
  aws: string;
  gcp: string;
  highlight?: boolean;
};

export type DetailCard = {
  name: string;
  role: string;
  referenceCost?: string;
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
};

export type SizingAssumption = {
  users: string;
  appSpec: string;
  dbSpec: string;
  dbStorageGb: string;
  filesGb: string;
  trafficGb: string;
};

export const navSections = [
  { id: "resumo", label: "Resumo" },
  { id: "premissas", label: "Premissas" },
  { id: "cenarios", label: "Cenários" },
  { id: "arquitetura", label: "Arquitetura" },
  { id: "custos", label: "Custos" },
  { id: "seguranca", label: "Segurança" },
  { id: "backup", label: "Backup" },
  { id: "crescimento", label: "Crescimento" },
  { id: "recomendacao", label: "Recomendação" },
];

export const heroBadges = [
  "2 empresas",
  "~20 usuários iniciais",
  "HML + Produção",
  "Arquitetura multitenant",
  "PostgreSQL gerenciado",
  "Backup + segurança + monitoramento",
];

export const executiveSummary = {
  intro:
    "O objetivo desta proposta é identificar a menor infraestrutura gerenciada capaz de atender profissionalmente o MVP1 do AWP, sem assumir infraestrutura gratuita como premissa de produção.",
  quote:
    "Para o AWP, a comparação não deve ser simplesmente entre uma infraestrutura cara e uma infraestrutura gratuita. O objetivo é encontrar uma cloud gerenciada, segura e escalável, com custo compatível com o estágio inicial do projeto.",
  freeTierNote:
    "Eventuais créditos promocionais de provedores de nuvem podem ser úteis como benefício temporário durante o desenvolvimento, mas não fazem parte da premissa financeira de produção deste orçamento.",
};

export const premises = [
  "2 empresas/clientes no MVP1",
  "Aproximadamente 10 usuários por empresa",
  "Aproximadamente 20 usuários iniciais no total",
  "Aplicação web responsiva",
  "Arquitetura multitenant desde o início",
  "Homologação separada de Produção",
  "PostgreSQL gerenciado",
  "Backup obrigatório em produção",
  "Segurança considerada desde o MVP1",
  "Monitoramento e logs",
  "HTTPS obrigatório",
  "Domínio próprio",
  "Crescimento progressivo, sem provisionar para 500 usuários no primeiro dia",
  "CDN não considerada necessária no MVP1",
  "Alta disponibilidade complexa não considerada necessária no MVP1",
  "Armazenamento de arquivos conforme necessidade",
];

export const premisesNote =
  "O documento de referência solicita estimativas para os cenários de 10, 50, 100 e 500 usuários. O cenário de aproximadamente 20 usuários (MVP real inicial) é apresentado como referência adicional, sem substituir os cenários solicitados no documento.";

export const scenarios: Scenario[] = [
  {
    id: "A",
    title: "Cenário A — Econômico / MVP",
    description:
      "Infraestrutura gerenciada enxuta, evitando componentes que não sejam necessários inicialmente.",
  },
  {
    id: "B",
    title: "Cenário B — Recomendado",
    description:
      "Infraestrutura profissional para produção, com segurança, backup, monitoramento e margem razoável de crescimento.",
  },
  {
    id: "C",
    title: "Cenário C — Crescimento / Maior disponibilidade",
    description:
      "Infraestrutura preparada para aumento significativo de utilização e maior redundância.",
  },
];

export const scenariosNote =
  "Nenhum cenário é declarado como definitivo neste momento. Os valores calculados na seção Custos usam o dimensionamento do Cenário A (Econômico/MVP); os Cenários B e C custariam mais, na proporção do dimensionamento maior que usam.";

export const providerIntro =
  "Duas alternativas completas e independentes estão sendo avaliadas. Os provedores não são combinados em uma mesma arquitetura.";

export const awsArchitecture: ProviderArchitecture = {
  name: "AWS",
  region: "São Paulo (sa-east-1)",
  flow: ["Internet", "HTTPS / domínio", "ALB (quando utilizado no cenário)", "ECS / Fargate", "RDS PostgreSQL"],
  services: ["S3", "CloudWatch", "Route 53", "ACM", "VPC", "Backup", "IAM"],
  notes: [
    "Fargate para execução da aplicação em containers (Docker), sem gerenciar servidores diretamente.",
    "RDS PostgreSQL para banco de dados gerenciado.",
    "S3 para armazenamento de arquivos e relatórios.",
    "CloudWatch para monitoramento e logs.",
    "Route 53 para DNS e ACM para certificado HTTPS.",
    "VPC para isolamento de rede.",
  ],
};

export const awsDivergenceNote =
  "Atenção — divergência a validar: o diagrama de referência apresenta um Application Load Balancer (ALB), enquanto a tabela de infraestrutura do mesmo documento indica que o Load Balancer não é inicialmente necessário. Esta é uma decisão arquitetural ainda em aberto, não uma inconsistência já resolvida.";

export const awsNatNote =
  "Quando a arquitetura utilizar o ECS em sub-rede privada, o custo do NAT Gateway também precisa ser considerado no orçamento total.";

export const gcpArchitecture: ProviderArchitecture = {
  name: "Google Cloud",
  region: "São Paulo",
  flow: ["Internet", "HTTPS / domínio", "Cloud Run", "Cloud SQL PostgreSQL"],
  services: ["Cloud Storage", "Cloud Monitoring", "Cloud DNS", "Backup", "IAM"],
  notes: [
    "Cloud Run é considerado como alternativa ao ECS/Fargate.",
    "Cloud SQL PostgreSQL é considerado como alternativa ao RDS PostgreSQL.",
  ],
};

export const providerCostNote =
  "Nenhum dos dois provedores é apresentado como mais barato antes da validação final dos custos.";

export const environmentsFlow = ["Desenvolvimento", "Homologação", "Produção"];

export const environmentsNote =
  "No MVP1, o ambiente de desenvolvimento pode ser executado localmente. Homologação e Produção são ambientes separados, com banco de dados, configurações e credenciais independentes. Não será criada infraestrutura de desenvolvimento em nuvem apenas para ampliar o orçamento.";

export const costTableRows: CostTableRow[] = [
  { users: "10", aws: "US$ 60,85", gcp: "US$ 139,30" },
  { users: "20 — MVP real", aws: "US$ 60,98", gcp: "US$ 139,97", highlight: true },
  { users: "50", aws: "US$ 124,33", gcp: "US$ 191,55" },
  { users: "100", aws: "US$ 196,63", gcp: "US$ 234,67" },
  { users: "500", aws: "US$ 372,91", gcp: "US$ 360,50" },
  { users: "1.000", aws: "US$ 871,16", gcp: "US$ 718,90" },
];

export const pricingAsOf = "14 de setembro de 2026";

export const costTableNote =
  "Valores calculados com tarifas oficiais da AWS e do Google Cloud para a região São Paulo, consultadas em " +
  pricingAsOf +
  ". Cada linha usa o dimensionamento do Cenário A (Econômico/MVP) — o extremo inferior de cada faixa de vCPU/RAM informada no documento de referência para aquele patamar de usuários (ex.: banco \"1–2 GB\" no patamar de 10 usuários foi calculado com 1 GB). Usar o extremo superior da mesma faixa (mais próximo do Cenário B/C) eleva o custo do banco de dados em até 2x em alguns patamares. O detalhamento completo — preços unitários, fontes e premissas assumidas (armazenamento de arquivos e tráfego, que ainda não têm medição real) — está descrito abaixo, em \"Como esses valores foram calculados\".";

export const preliminaryCostWarning =
  "Os valores acima foram calculados a partir de tarifas oficiais publicadas pela AWS e pelo Google Cloud (ver metodologia e fontes abaixo), mas ainda dependem de premissas que não foram validadas com o cliente — principalmente volume de arquivos armazenados e tráfego de rede, que ainda não têm medição real de uso. Também não incluem impostos. Recomenda-se uma conferência final na calculadora oficial de cada provedor antes da contratação.";

export const costMethodologyIntro =
  "Os valores da tabela acima não são estimativas soltas — foram calculados componente por componente, usando as tarifas oficiais de cada provedor para a região São Paulo (AWS Price List API e páginas oficiais de preço do Google Cloud, ambas consultadas em " +
  pricingAsOf +
  ") aplicadas ao dimensionamento (vCPU/RAM/armazenamento) já definido no documento de referência do AWP.";

export const costMethodologyRules = [
  "Dimensionamento: para cada patamar de usuários, foi usado o extremo inferior da faixa de vCPU/RAM/banco informada no documento (ex.: \"4–8 GB\" no banco do patamar de 100 usuários foi calculado como 4 GB) — consistente com a filosofia do próprio documento de infraestrutura enxuta no MVP, e com os dois valores de referência preliminares já publicados anteriormente (Fargate e RDS), que batem exatamente com essa escolha.",
  "Convenção de horas: 730 horas/mês, a mesma convenção usada pela AWS e pelo Google Cloud em suas próprias páginas de preço.",
  "Load Balancer (ALB) e NAT Gateway: tratados como componentes opcionais nos patamares de 10 a 500 usuários (consistente com a divergência já sinalizada em Arquitetura), portanto NÃO estão somados no valor principal da AWS nesses patamares. No patamar de 1.000 usuários, ambos passam a ser somados — é o ponto em que a arquitetura muda de fato (ver Crescimento).",
  "Armazenamento de arquivos e tráfego de rede: o documento de referência afirma explicitamente que \"não existe estimativa precisa de tráfego\" — por isso, os volumes usados no cálculo (de 5 GB/mês no patamar de 10 usuários até 200 GB/mês no patamar de 1.000) são uma ASSUNÇÃO de referência, proporcional ao número de usuários, e não um dado confirmado. Esse é o principal ponto a validar com o cliente antes de fechar o orçamento.",
  "Banco de dados: na AWS, cada patamar foi mapeado para a menor classe de instância RDS (família t4g, burstable) que atende ao extremo inferior da faixa de RAM. No Google Cloud, o Cloud SQL foi calculado com o mesmo vCPU/RAM equivalente à classe RDS escolhida, já que o Cloud SQL cobra por vCPU e GiB de forma granular (não por classe fixa).",
  "Google Cloud Run e parte do Cloud SQL para a região São Paulo exigiram confirmação por navegador headless ou cruzamento com fonte secundária, porque essas páginas oficiais trocam a região por JavaScript. Recomenda-se uma conferência visual manual desses dois itens em cloud.google.com/run/pricing e cloud.google.com/sql/pricing antes da apresentação final ao cliente.",
  "Por que 10 e 20 usuários custam quase o mesmo: infraestrutura gerenciada é paga pela capacidade reservada (a tarefa Fargate e a instância de banco ficam ligadas o mês inteiro), não por usuário. Como o documento não define um dimensionamento próprio para 20 usuários, foi reaproveitada a mesma capacidade do patamar de 10 — por isso a diferença entre as duas linhas é só o pequeno acréscimo assumido em armazenamento de arquivos e tráfego. O custo sobe em degraus (quando a tabela oficial pede uma instância maior), não em linha reta a cada novo usuário.",
];

export const sizingAssumptions: SizingAssumption[] = [
  {
    users: "10",
    appSpec: "0,5 vCPU / 1 GB (1 instância)",
    dbSpec: "2 vCPU / 1 GB (classe db.t4g.micro / equivalente)",
    dbStorageGb: "20 GB",
    filesGb: "5 GB",
    trafficGb: "5 GB",
  },
  {
    users: "20 — MVP real",
    appSpec: "0,5 vCPU / 1 GB (1 instância)",
    dbSpec: "2 vCPU / 1 GB (classe db.t4g.micro / equivalente)",
    dbStorageGb: "20 GB",
    filesGb: "8 GB",
    trafficGb: "8 GB",
  },
  {
    users: "50",
    appSpec: "1 vCPU / 2 GB (1 instância)",
    dbSpec: "2 vCPU / 2 GB (classe db.t4g.small / equivalente)",
    dbStorageGb: "50 GB",
    filesGb: "15 GB",
    trafficGb: "15 GB",
  },
  {
    users: "100",
    appSpec: "1 vCPU / 4 GB (1 instância)",
    dbSpec: "2 vCPU / 4 GB (classe db.t4g.medium / equivalente)",
    dbStorageGb: "100 GB",
    filesGb: "30 GB",
    trafficGb: "25 GB",
  },
  {
    users: "500",
    appSpec: "2 vCPU / 4 GB (1 instância)",
    dbSpec: "2 vCPU / 8 GB (classe db.t4g.large / equivalente)",
    dbStorageGb: "200 GB",
    filesGb: "100 GB",
    trafficGb: "80 GB",
  },
  {
    users: "1.000 (extrapolado)",
    appSpec: "2 vCPU / 4 GB × 2 instâncias (escala horizontal, com ALB)",
    dbSpec: "4 vCPU / 16 GB (classe db.t4g.xlarge / equivalente)",
    dbStorageGb: "400 GB",
    filesGb: "200 GB",
    trafficGb: "150 GB",
  },
];

export const awsDetailCards: DetailCard[] = [
  {
    name: "ECS / Fargate",
    role: "Execução da aplicação em containers (Docker), sem gerenciar servidores diretamente.",
    referenceCost:
      "US$ 0,0696/vCPU-hora + US$ 0,0076/GB-hora. Ex.: 0,5 vCPU + 1 GB por ~730h = US$ 30,95/mês por tarefa.",
  },
  {
    name: "RDS PostgreSQL",
    role: "Banco de dados relacional gerenciado.",
    referenceCost:
      "A partir de US$ 0,034/hora (db.t4g.micro, 2 vCPU/1 GB) até US$ 0,55/hora (db.t4g.xlarge, 4 vCPU/16 GB), Single-AZ. Armazenamento: US$ 0,219/GB-mês (gp3).",
  },
  {
    name: "ALB",
    role: "Balanceamento de carga e ponto de entrada HTTPS — decisão arquitetural ainda em validação (ver observação em Arquitetura).",
    referenceCost: "US$ 0,034/hora (≈ US$ 24,82/mês) + US$ 0,011/LCU-hora.",
  },
  {
    name: "NAT Gateway",
    role: "Permite que recursos em sub-rede privada acessem a internet.",
    referenceCost: "US$ 0,093/hora (≈ US$ 67,89/mês) + US$ 0,093/GB processado.",
  },
  {
    name: "S3",
    role: "Armazenamento de arquivos e relatórios.",
    referenceCost: "US$ 0,0405/GB-mês (Standard, até 50 TB).",
  },
  {
    name: "CloudWatch",
    role: "Monitoramento e logs.",
    referenceCost: "US$ 0,90/GB de log ingerido; 5 GB/mês incluídos na franquia gratuita da conta.",
  },
  {
    name: "Route 53",
    role: "DNS.",
    referenceCost: "US$ 0,50/mês por zona hospedada + US$ 0,40 por milhão de consultas.",
  },
  {
    name: "ACM",
    role: "Certificado HTTPS gerenciado.",
    referenceCost: "Gratuito quando usado com serviços integrados da AWS (ex.: ALB).",
  },
  {
    name: "IPv4 público",
    role: "Endereço IP público associado a recursos (ex.: NAT Gateway, load balancer).",
    referenceCost: "US$ 0,005/hora por endereço.",
  },
  {
    name: "Backup",
    role: "Cópias de segurança do banco de dados.",
    referenceCost: "US$ 0,095/GB-mês além da franquia padrão (que cobre o tamanho do banco provisionado).",
  },
  {
    name: "Tráfego / rede",
    role: "Tráfego de saída de dados (data transfer).",
    referenceCost:
      "Primeiros 100 GB/mês grátis (franquia global da conta). Acima disso, US$ 0,15/GB até 10 TB/mês.",
  },
];

export const gcpDetailCards: DetailCard[] = [
  {
    name: "Cloud Run",
    role: "Execução da aplicação em containers, sem gerenciar servidores diretamente.",
    referenceCost:
      "US$ 0,0000216/vCPU-segundo + US$ 0,0000024/GiB-segundo (modo CPU sempre alocada, São Paulo — valor obtido por confirmação cruzada, recomenda-se conferência visual final).",
  },
  {
    name: "Cloud SQL",
    role: "Banco de dados PostgreSQL gerenciado.",
    referenceCost: "US$ 0,062/vCPU-hora + US$ 0,0105/GiB-hora + US$ 0,255/GB-mês de armazenamento SSD.",
  },
  {
    name: "Cloud Storage",
    role: "Armazenamento de arquivos e relatórios.",
    referenceCost: "US$ 0,035/GB-mês (Standard, São Paulo).",
  },
  {
    name: "Cloud Monitoring",
    role: "Monitoramento e logs.",
    referenceCost:
      "50 GiB de logs/projeto/mês grátis (depois US$ 0,50/GiB); 150 MiB de métricas/conta/mês grátis (depois a partir de US$ 0,258/MiB).",
  },
  {
    name: "Cloud DNS",
    role: "DNS.",
    referenceCost: "≈ US$ 0,20/mês por zona hospedada + US$ 0,40 por milhão de consultas.",
  },
  {
    name: "Backup",
    role: "Cópias de segurança do banco de dados.",
    referenceCost: "US$ 0,12/GB-mês de armazenamento de backup do Cloud SQL.",
  },
  {
    name: "Rede / tráfego",
    role: "Tráfego de saída de dados (data transfer).",
    referenceCost:
      "US$ 0,19/GiB de saída para internet no Premium Tier (padrão, sem franquia gratuita). O Standard Tier tem 200 GiB/mês grátis, com SLA de rede menor.",
  },
];

export const securityBullets = [
  "HTTPS obrigatório",
  "Autenticação individual",
  "Perfis/permissões de acesso",
  "Princípio do menor privilégio",
  "Banco de produção sem acesso público",
  "Credenciais separadas por ambiente",
  "Segredos armazenados fora do código-fonte",
  "Atualização periódica das dependências",
  "Backups protegidos",
  "Logs sem senhas, tokens ou credenciais",
  "MFA para administração, quando aplicável",
];

export const backupBullets = [
  "Backup diário",
  "Criptografia",
  "Acesso restrito",
  "Armazenamento separado da instância principal",
  "Retenção definida",
  "Testes periódicos de restauração",
  "Verificação de integridade dos backups",
];

export const backupRetentionNote =
  "O documento de referência menciona atenção especial à possibilidade de retenção de 18 meses. Esse prazo ainda não está definitivamente aprovado — é tratado como requisito em validação, a confirmar com o cliente.";

export const backupDistinctionNote =
  "Retenção de backup não deve ser confundida com retenção dos dados da aplicação — são políticas distintas.";

export const growthSteps = ["10", "50", "100", "500", "1.000"];

export const growthText =
  "O objetivo não é provisionar infraestrutura para 500 ou 1.000 usuários desde o primeiro dia. A arquitetura deve permitir evolução progressiva, acompanhando métricas reais como usuários ativos, requisições, CPU, memória, consultas ao banco, tamanho do banco, armazenamento, latência, disponibilidade e volume de arquivos — isso permitirá identificar o ponto em que será necessário alterar a arquitetura. No cálculo desta proposta, esse ponto já aparece de forma concreta na AWS: até 500 usuários, uma única instância de aplicação atende; no patamar de 1.000 usuários (extrapolado, fora do documento original), a arquitetura passa a exigir Load Balancer e duas instâncias de aplicação, elevando o custo além do simples dobro do patamar anterior. Recomenda-se revisar o dimensionamento real após o início da operação, em vez de assumir os patamares extrapolados como definitivos.";

export const recommendationText =
  "A recomendação deve considerar não apenas o menor preço, mas o equilíbrio entre custo, segurança, operação, backup, continuidade, escalabilidade e complexidade administrativa.";

export const recommendationFinding =
  "Com os valores calculados (Cenário A / Econômico), a AWS tende a custar menos nos patamares de 10 a 500 usuários; a partir de 1.000 usuários — quando a arquitetura AWS passa a exigir Load Balancer e duas instâncias de aplicação — a diferença se inverte e o Google Cloud fica mais barato no cálculo. Essa comparação depende diretamente das premissas assumidas (principalmente tráfego e armazenamento de arquivos, ainda não confirmados) e não considera fatores fora de preço, como familiaridade da equipe, suporte e serviços já em uso.";

export const recommendationStatusNote =
  "Os valores acima já refletem tarifas oficiais calculadas (ver Custos), mas a escolha final entre AWS e Google Cloud ainda depende da validação das premissas de tráfego e armazenamento com o cliente, e de uma conferência manual dos dois itens do Google Cloud marcados como confirmação cruzada. Por isso, nenhum provedor é declarado aqui como opção definitiva.";

export const pricingSources = [
  "AWS Pricing Calculator",
  "AWS Fargate Pricing",
  "AWS RDS for PostgreSQL Pricing",
  "AWS Elastic Load Balancing Pricing",
  "AWS VPC Pricing (NAT Gateway)",
  "AWS S3 Pricing",
  "AWS Backup Pricing",
  "Google Cloud Run Pricing",
  "Google Cloud SQL Pricing",
  "Google Cloud Storage Pricing",
];

export const pricingSourcesNote =
  "Os valores desta proposta foram obtidos prioritariamente da AWS Price List API (a mesma fonte de dados oficial que alimenta a AWS Pricing Calculator) e das páginas oficiais do Google Cloud, consultadas em " +
  pricingAsOf +
  ". Fontes de terceiros só foram usadas como pista inicial, nunca como valor final — em caso de diferença, prevalece o valor oficial. Dois itens do Google Cloud (Cloud Run e parte do Cloud SQL para São Paulo) exigiram confirmação por navegador headless ou cruzamento com fonte secundária, porque essas páginas trocam a região por JavaScript — recomenda-se uma conferência visual final nessas duas páginas antes da contratação.";

export const financialDisclaimer =
  "Os valores apresentados constituem uma estimativa preliminar de infraestrutura. O custo efetivo pode variar conforme consumo de CPU, memória, armazenamento, tráfego, logs, backups, retenção, número de requisições, crescimento do banco e demais recursos utilizados. A estimativa final deve ser validada nas calculadoras oficiais dos provedores antes da contratação.";

export const disclaimerScopeNote =
  "Os valores em dólar refletem exclusivamente o preço de lista publicado pela AWS e pelo Google Cloud, sem nenhum imposto brasileiro somado. Uma compra internacional como esta costuma envolver custos adicionais — por exemplo IOF sobre a operação financeira internacional e, dependendo de como o contrato e o pagamento forem estruturados, tributos sobre importação de serviços (como ISS, PIS/COFINS-Importação e IRRF). Esses valores dependem do regime tributário da empresa contratante e não foram calculados aqui — é uma validação a fazer com o contador antes de fechar o orçamento com o cliente. Domínio e outros serviços externos eventualmente necessários também podem não estar incluídos, salvo quando explicitamente indicados.";
