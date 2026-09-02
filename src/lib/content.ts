export type TimelineEntry = {
  id: string;
  period: string;
  title: string;
  summary: string;
  detail?: string;
  pending?: string;
};

export const timeline: TimelineEntry[] = [
  {
    id: "pesca",
    period: "Aproximadamente dos 10 aos 12 anos",
    title: "Pesca e venda de peixes e salgados",
    summary:
      "Dos aproximadamente 10 aos 12 anos, Thiago estudava pela manhã e, à tarde, ajudava a vender os peixes que pescava à noite com o pai. Quando a pescaria estava fraca, também vendia salgados que pedia à mãe para preparar.",
    detail:
      "Foi uma das primeiras experiências de Thiago com trabalho, venda, dinheiro e negociação. Além dos peixes, quando a pescaria estava fraca, ele pedia à mãe que preparasse salgados para vender na rua. Com o dinheiro que conseguiu juntar nessa fase, comprou seu primeiro telefone.",
  },
  {
    id: "mecanica",
    period: "Por volta dos 13 anos",
    title: "Auxiliar de mecânico",
    summary:
      "Primeiro trabalho para outra pessoa, fora de casa — a entrada no mercado de trabalho.",
  },
  {
    id: "central-carnes",
    period: "Adolescência",
    title: "Central Carnes e Espetinhos — atendimento",
    summary:
      "Atendimento ao público, principalmente aos finais de semana e em eventos. Foi ali que Thiago construiu a reputação que abriria a próxima porta.",
  },
  {
    id: "indicacao",
    period: "Por volta dos 15 anos",
    title: "Uma oportunidade que bateu à porta",
    summary:
      "Paulo, dono da Central Carnes, indicou Thiago a Ítalo — o \"Tim\" —, que procurava alguém confiável para seu bar.",
    detail:
      "Ítalo foi pessoalmente até a casa de Thiago, bateu no portão e o chamou para conversar sobre a vaga, num dia em que os pais dele estavam pescando. Thiago aceitou fazer um teste, foi aprovado e começou a trabalhar.",
  },
  {
    id: "bar-do-tim",
    period: "Aproximadamente 2 anos e 4 meses",
    title: "Bar do Tim — atendimento e apoio à operação",
    summary:
      "Atendimento ao público, caixa em determinados momentos e apoio à condução do estabelecimento nas ausências do proprietário — responsabilidade real construída sobre confiança, ainda muito jovem.",
    detail:
      "Em 2020, durante a pandemia, os estabelecimentos da cidade foram fechados e a demanda de trabalho caiu. Aos 17 anos, Thiago encerrou essa etapa de forma amigável.",
  },
  {
    id: "zona-rural",
    period: "Aproximadamente 1 ano e 4 meses",
    title: "Zona rural — novos caminhos",
    summary:
      "Depois do Bar do Tim, uma nova etapa em busca de vínculo e evolução profissional, enquanto uma oportunidade que já vinha sendo construída amadurecia em paralelo.",
  },
  {
    id: "terra-nobre",
    period: "A partir dos 18 anos",
    title: "A vaga que esperou por mim — Terra Nobre Hotel (Manga/MG)",
    summary:
      "A proprietária já conhecia o trabalho de Thiago desde os 15 anos e dizia que, ao completar 18, teria uma oportunidade no hotel. Ele levou o currículo — não havia vaga naquele momento.",
    detail:
      "Cerca de 1 ano e 4 meses depois, durante a passagem pela zona rural, a proprietária entrou em contato: a vaga havia surgido. Thiago assumiu a recepção, com jornada relatada de 24 horas de trabalho por 48 de descanso, hospedagem e estrutura próprias do trabalho — uma das oportunidades mais relevantes daquele momento e naquela cidade.",
  },
  {
    id: "decisao-sc",
    period: "2023",
    title: "Uma nova decisão",
    summary:
      "Mesmo com a proprietária pedindo para que ficasse, Thiago decidiu buscar crescimento fora da cidade onde cresceu e se mudou para Santa Catarina.",
  },
  {
    id: "rudolf-usinados",
    period: "17 de fevereiro de 2023 — janeiro de 2025",
    title: "Rudolf Usinados — produção e expedição",
    summary:
      "Em 17 de fevereiro de 2023, Thiago iniciou seu primeiro vínculo trabalhista em Santa Catarina na Rudolf Usinados. Começou atuando na produção e, posteriormente, passou para o setor de expedição, ampliando sua experiência dentro da empresa.",
    detail:
      "Em janeiro de 2025, encerrou essa etapa de forma amigável ao decidir trabalhar como freelancer, onde conseguia uma remuneração melhor e uma jornada mais flexível. A mudança também permitiu direcionar mais tempo e energia para os estudos e para a construção da carreira em tecnologia.",
  },
  {
    id: "bierdam",
    period: "Durante o período na Rudolf Usinados",
    title: "Bierdam — atendimento",
    summary:
      "Enquanto trabalhava na Rudolf Usinados, Thiago também trabalhava à noite no Restaurante Bierdam, conciliando as duas atividades profissionais.",
  },
  {
    id: "motoboy-estudos",
    period: "Após essa etapa",
    title: "Trabalho flexível e foco nos estudos",
    summary:
      "Após sair da Rudolf e encerrar essa etapa, Thiago manteve sua renda com trabalhos como motoboy freelancer enquanto direcionava tempo e energia para os estudos.",
  },
  {
    id: "primeiros-contatos-tech",
    period: "Antes e durante o aprofundamento dos estudos",
    title: "Primeiros contatos profissionais com tecnologia",
    summary:
      "Antes de consolidar a formação, Thiago já havia iniciado sua atuação profissional em tecnologia como Consultor de Desenvolvimento de Software, por meio de prestação de serviços à Persysten Sistemas.",
    detail:
      "Persysten Sistemas — Consultor de Desenvolvimento de Software (Prestação de Serviços), por 6 meses. Principais atividades: investigação e correção de bugs em aplicações; desenvolvimento e manutenção de funcionalidades em sistemas web; integração entre frontend, backend e banco de dados; apoio na evolução da plataforma W-Care.",
    pending: "Posição exata dessa experiência na linha do tempo em confirmação.",
  },
  {
    id: "ponto-de-virada",
    period: "A partir de 2023",
    title: "Formação e consolidação em tecnologia",
    summary:
      "Em 2023, Thiago iniciou a graduação em Análise e Desenvolvimento de Sistemas, enquanto continuava construindo sua trajetória profissional. A partir desse período, tecnologia e desenvolvimento de software passaram a ocupar cada vez mais espaço em sua formação e em seus objetivos profissionais.",
    detail:
      "A graduação passou a caminhar junto com os estudos práticos e com os primeiros projetos na área de tecnologia. Essa combinação entre formação acadêmica, prática e experiências profissionais ajudou a consolidar a direção que Thiago queria seguir.",
  },
  {
    id: "construindo-carreira",
    period: "Atualmente",
    title: "Construindo uma carreira em tecnologia",
    summary:
      "No último semestre de Análise e Desenvolvimento de Sistemas, Thiago mantém o foco na evolução técnica e no desenvolvimento do Encanto System, projeto autoral real construído e mantido em produção. Agora, busca transformar essa experiência em uma carreira sólida em tecnologia.",
  },
];

export const capabilities = [
  {
    title: "Sistemas web completos",
    description:
      "Do frontend ao backend, construindo aplicações pensadas para uso real e operação no dia a dia.",
  },
  {
    title: "Banco de dados e modelagem",
    description:
      "PostgreSQL e Supabase, com modelagem, integridade, consultas e segurança dos dados.",
  },
  {
    title: "Autenticação e multi-tenant",
    description:
      "Controle de acesso, isolamento entre contas e políticas de segurança com RLS.",
  },
  {
    title: "APIs e automação",
    description:
      "Integrações, APIs e automações para conectar diferentes partes da aplicação e do negócio.",
  },
  {
    title: "Testes end-to-end",
    description:
      "Playwright para validar fluxos completos e reduzir regressões antes da entrega.",
  },
  {
    title: "Performance e SEO",
    description:
      "Otimização de aplicações web, Core Web Vitals e boas práticas de indexação.",
  },
] as const;

export const techStack = {
  Frontend: ["React", "JavaScript", "HTML5 & CSS3", "Vite"],
  "Dados & Backend": ["Supabase", "PostgreSQL", "SQL", "APIs REST & RPC"],
  Engenharia: ["Git & GitHub", "CI/CD", "Playwright", "Sentry", "ESLint & Prettier"],
} as const;

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  status: string;
  href: string;
};

export const projects: Project[] = [
  {
    slug: "encanto",
    name: "Encanto System",
    tagline: "Sistema real de gestão e operação para alimentação, multi-tenant e em produção.",
    description:
      "Plataforma completa para operação de pedidos online — catálogo, checkout, fidelidade, endereços com cálculo de taxa por distância, área do cliente e painel administrativo — projetada e construída do zero para uso real.",
    stack: ["React", "Vite", "Supabase", "PostgreSQL", "Playwright"],
    status: "Em produção",
    href: "/projetos/encanto",
  },
];

export const socialLinks: { label: string; href: string | null }[] = [
  { label: "GitHub", href: null },
  { label: "LinkedIn", href: null },
  { label: "Contato", href: null },
];

export const positioningStatement =
  "Hoje minha busca é diferente. Não estou mais procurando apenas uma oportunidade de trabalho. Estou buscando construir uma carreira sólida em tecnologia.";

export const positioningStatementHome =
  "Hoje minha busca é diferente. Não estou mais procurando apenas uma oportunidade de trabalho. Estou buscando construir uma carreira sólida em tecnologia.";

export const profilePhotoSrc: string | null = "/thiago-perfil-v2.jpg";
