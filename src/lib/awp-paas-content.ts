// Nota interna do AWP — Agricultural Wealth Project.
// Comparativo Vercel+Supabase (PaaS) vs. a proposta AWS/GCP já enviada ao cliente.
// Uso pessoal do autor, não faz parte do documento entregue ao Cadenê.
// Independente do conteúdo do portfólio (src/lib/content.ts) e do restante do AWP
// (src/lib/awp-content.ts): não reutilizar nem misturar dados com outros projetos.

export type PaasCostCell = {
  usd: string;
  brl: string;
};

export type PaasTierRow = {
  users: string;
  mvp?: boolean;
  aws: PaasCostCell;
  gcp: PaasCostCell;
  floor: PaasCostCell;
  note: string;
};

export const clientPageMeta = {
  title: "AWP — Alternativa Vercel + Supabase",
  description: "Comparativo de custo Vercel+Supabase (PaaS) como opção complementar à proposta AWS/GCP do AWP para a fase inicial do MVP1.",
};

export const clientIntro =
  "Ao lado da proposta AWS/GCP já compartilhada, preparei também esta alternativa gerenciada (PaaS) — Vercel + Supabase — pensada especificamente para a fase inicial do MVP1. Segue o mesmo princípio da proposta original: valores calculados componente por componente, a partir de tarifas oficiais publicadas pelos dois provedores.";

export const clientMissingTitle = "O que este comparativo ainda não inclui";

export const beforeDecidingTitle = "Antes de decidir";
export const beforeDecidingPoints = [
  "Essa alternativa não substitui o orçamento AWS/GCP já enviado — é uma opção complementar para a fase inicial do MVP1.",
  "Vale confirmarmos se AWS/GCP é uma exigência do cliente final do AWP, ou se foi apenas o ponto de partida da estimativa original — isso muda se essa via faz sentido.",
  "Fico à disposição pra detalhar qualquer ponto, ou seguir com essa opção se fizer sentido pro momento do projeto.",
];

export const generatedAt = "22 de setembro de 2026";
export const exchangeRateNote = "Câmbio: PTAX venda R$ 5,0918 (11/09/2026), reaproveitada do documento oficial.";

export const leadIntro = "No MVP real (20 usuários), o piso Vercel+Supabase é";
export const leadFloor = "US$ 46,50/mês";
export const leadMid = ". O GCP — hoje a opção mais barata entre AWS e GCP — custa";
export const leadGcp = "US$ 139,97/mês";
export const leadEnd = ": quase 3× mais.";

export const tiers: PaasTierRow[] = [
  {
    users: "10",
    aws: { usd: "US$ 166,71", brl: "R$ 848,85" },
    gcp: { usd: "US$ 139,30", brl: "R$ 709,29" },
    floor: { usd: "US$ 46,50", brl: "R$ 236,77" },
    note: "banco: Micro",
  },
  {
    users: "20",
    mvp: true,
    aws: { usd: "US$ 167,86", brl: "R$ 854,71" },
    gcp: { usd: "US$ 139,97", brl: "R$ 712,72" },
    floor: { usd: "US$ 46,50", brl: "R$ 236,77" },
    note: "banco: Micro",
  },
  {
    users: "50",
    aws: { usd: "US$ 233,62", brl: "R$ 1.189,53" },
    gcp: { usd: "US$ 191,55", brl: "R$ 975,36" },
    floor: { usd: "US$ 55,25", brl: "R$ 281,32" },
    note: "banco: Small (+US$5)",
  },
  {
    users: "100",
    aws: { usd: "US$ 309,34", brl: "R$ 1.575,10" },
    gcp: { usd: "US$ 234,67", brl: "R$ 1.194,91" },
    floor: { usd: "US$ 106,50", brl: "R$ 542,28" },
    note: "banco: Medium (+US$50)",
  },
  {
    users: "500",
    aws: { usd: "US$ 504,49", brl: "R$ 2.568,75" },
    gcp: { usd: "US$ 360,50", brl: "R$ 1.835,59" },
    floor: { usd: "US$ 169,00", brl: "R$ 860,51" },
    note: "banco: Large (+US$100)",
  },
  {
    users: "1.000",
    aws: { usd: "US$ 777,10", brl: "R$ 3.956,83" },
    gcp: { usd: "US$ 580,14", brl: "R$ 2.953,95" },
    floor: { usd: "US$ 296,13", brl: "R$ 1.507,83" },
    note: "banco: XL (+US$200) + arquivo extra",
  },
];

export const missingPoints = [
  "Custo variável do Vercel (Functions/CPU) não entra — é cobrado por uso real, e não há tráfego medido do AWP pra calcular isso sem inventar dado.",
  "Alta disponibilidade (equivalente aos Cenários B/C) não foi precificada aqui.",
  "Backup de 18 meses não existe em nenhum plano Supabase — o máximo é 28 dias (add-on Enterprise, ≈US$400/mês). Se o cliente confirmar essa exigência, isso sozinho derruba essa alternativa.",
];

export const methodologyRules = [
  "Vercel Pro US$20/mês (1 seat) — Hobby não pode ser usado comercialmente. Banda inclui 1TB/mês, bem acima do tráfego do AWP (5–150GB).",
  "Supabase Pro US$25/mês — inclui 8GB banco, 100GB arquivos, 250GB egress, 100k usuários de auth, e US$10/mês em créditos de compute.",
  "Banco de cada patamar mapeado pro add-on de compute equivalente da Supabase, já com o crédito de US$10 descontado do preço cheio.",
  "Excedente de armazenamento pela tarifa oficial: banco US$0,125/GB acima de 8GB; arquivos US$0,0213/GB acima de 100GB.",
  "Região sa-east-1 (São Paulo) confirmada disponível no Supabase — sem problema de residência de dados.",
  "Valores AWS/GCP reaproveitados do Cenário A já publicado em thiago.valionsistemas.com.br/awp.",
];

export const sources = [
  { label: "Vercel — Pricing", href: "https://vercel.com/pricing" },
  { label: "Supabase — Pricing", href: "https://supabase.com/pricing" },
  { label: "Supabase — Compute Add-ons", href: "https://supabase.com/docs/guides/platform/compute-add-ons" },
  { label: "Supabase — Backups & PITR", href: "https://supabase.com/docs/guides/platform/backups" },
  { label: "Supabase — Regions", href: "https://supabase.com/docs/guides/platform/regions" },
];
