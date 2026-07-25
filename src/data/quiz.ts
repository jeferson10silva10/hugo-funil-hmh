// Dados do quiz HMH — adaptativo por peso semântico
// Cada opção pesa em UM dos 3 arquétipos: escrava (E), aprisionada (P) ou adormecida (D).
// O diagnóstico calcula o arquétipo dominante e monta o texto personalizado.
// Fonte da verdade: docs/research/FUNIL_SOURCE_OF_TRUTH.md

export type Arquetipo = "escrava" | "aprisionada" | "adormecida";

export interface QuizOption {
  key: "A" | "B" | "C";
  text: string;
  /** Arquétipo que essa resposta pontua. */
  weight: Arquetipo;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Qual dessas frases você mais ouviu em casa quando criança?",
    options: [
      { key: "A", text: "A gente é pobre, mas é honesto / Quem nasce pobre morre pobre", weight: "escrava" },
      { key: "B", text: "Dinheiro não dá em árvore / Tem que trabalhar duro pra ter um pouquinho", weight: "aprisionada" },
      { key: "C", text: "Se você estudar e se esforçar, dá certo / A gente dá um jeito", weight: "adormecida" },
    ],
  },
  {
    id: 2,
    question: "Quando você senta para fazer algo importante pra VOCÊ, o que acontece?",
    options: [
      { key: "A", text: "Eu travo. Faço qualquer coisa menos o que precisa", weight: "aprisionada" },
      { key: "B", text: "Eu começo, mas em pouco tempo desvio e perco o foco", weight: "adormecida" },
      { key: "C", text: "Eu consigo começar, mas demora pra entrar no ritmo", weight: "adormecida" },
    ],
  },
  {
    id: 3,
    question: "Nos últimos 12 meses, quantos projetos você começou e NÃO terminou?",
    options: [
      { key: "A", text: "Vários. Começo empolgado e abandono no meio", weight: "aprisionada" },
      { key: "B", text: "Alguns. Termino uns, abandono outros", weight: "adormecida" },
      { key: "C", text: "Poucos. Termino quase tudo, mas demora muito", weight: "adormecida" },
    ],
  },
  {
    id: 4,
    question: "Quando você vê alguém da sua idade conquistando muito mais que você, o que sente?",
    options: [
      { key: "A", text: "Acho que teve sorte ou passou por cima de alguém", weight: "escrava" },
      { key: "B", text: "Fico inquieto. Penso que podia ser eu", weight: "aprisionada" },
      { key: "C", text: "Me inspiro, mas penso que vou no meu ritmo", weight: "adormecida" },
    ],
  },
  {
    id: 5,
    question: "À noite, antes de dormir, qual sensação você sente com mais frequência?",
    options: [
      { key: "A", text: "Peso. Mais um dia que não fiz o que precisava", weight: "aprisionada" },
      { key: "B", text: "Inquietação. Lista mental do que ficou pra trás", weight: "aprisionada" },
      { key: "C", text: "Cansaço. Trabalhei, mas não sinto que avancei", weight: "escrava" },
    ],
  },
  {
    id: 6,
    question: "Quando você finalmente separa um tempo pra VOCÊ, o que acontece?",
    options: [
      { key: "A", text: "Aparece alguém precisando e eu largo o meu pra ajudar", weight: "escrava" },
      { key: "B", text: "Sinto culpa de estar cuidando de mim antes dos outros", weight: "escrava" },
      { key: "C", text: "Consigo focar em mim, mas é raro", weight: "adormecida" },
    ],
  },
  {
    id: 7,
    question: "Olhando para 2024 e 2025, como você descreveria esses anos?",
    options: [
      { key: "A", text: "Foram parecidos demais. Quase nada mudou", weight: "aprisionada" },
      { key: "B", text: "Tive avanços, mas algo sempre me puxava de volta", weight: "escrava" },
      { key: "C", text: "Cresci, mas não no ritmo que sei que poderia", weight: "adormecida" },
    ],
  },
];

/* ============ Perfil de diagnóstico por arquétipo ============ */
export interface Perfil {
  arquetipo: Arquetipo;
  nomeCurto: string;             // "Mente Escrava" etc
  severidade: string;            // "SEVERO", "SEVERO", "MODERADO"
  severidadeCor: "vermelho" | "laranja";
  grau: number;                  // 0-100 — grau de ativação (base; ajusta pela contagem depois)
  frasesDor: string[];           // 4-6 sentenças "diagnóstico completo"
  reframe: string;               // linha de acolhimento
  ganchoJapones: string;         // Ishin-Denshin ou variação — congruente com VSL
  prognostico: string;           // "se não remover em 6 meses..."
}

export const PERFIS: Record<Arquetipo, Perfil> = {
  escrava: {
    arquetipo: "escrava",
    nomeCurto: "Mente Escrava",
    severidade: "ESTADO SEVERO",
    severidadeCor: "vermelho",
    grau: 89,
    frasesDor: [
      "Você trabalha muito. Muito mais que a maioria. E o mundo não te devolve na mesma proporção.",
      "Isso NÃO é falta de esforço. É o oposto: você aprendeu a se apagar pra caber nos outros.",
      "Toda vez que você pensa em VOCÊ, aparece alguém precisando — e você larga o seu.",
      "Essa é uma Herança Mental Herdada de servidão. Foi instalada quando você era criança, ouvindo que 'egoísmo é feio' e que 'ajudar é honra'.",
      "Ela roda em segundo plano há décadas. Sabota toda decisão que envolve você em primeiro lugar.",
      "Sozinha, você não sai daí. Não porque é fraca. Porque essa Herança foi feita pra ser invisível — e pra você achar que 'é o certo'.",
    ],
    reframe:
      "Isso NÃO é culpa sua. Você não escolheu se apagar — te ensinaram que se apagar é ser boa pessoa. E é exatamente por isso que dá pra reverter.",
    ganchoJapones:
      "Na Medicina Oriental Japonesa, esse padrão tem nome: Ishin-Denshin (以心伝心) — a herança silenciosa que passa de mãe pra filha sem uma palavra. É isso que o Hugo remove no Protocolo.",
    prognostico:
      "Se você não remover essa Herança nos próximos 6 meses, você vai continuar trabalhando 3× mais que os outros e recebendo metade. 2026 vai ser igual a 2025.",
  },
  aprisionada: {
    arquetipo: "aprisionada",
    nomeCurto: "Mente Aprisionada",
    severidade: "ESTADO SEVERO",
    severidadeCor: "vermelho",
    grau: 87,
    frasesDor: [
      "Você não tem problema de disciplina. Você não tem problema de motivação.",
      "O problema é que TODA vez que você tenta focar em VOCÊ, algo trava por dentro. Não é você — é a Herança.",
      "Você começa empolgada. Empurra por um tempo. E aí, do nada, desanda. Já perdeu a conta de quantas vezes.",
      "Essa é uma Herança Mental Herdada de Aprisionamento — uma programação instalada nos primeiros 7 anos de vida.",
      "Ela roda em segundo plano há décadas. A cada vez que você tenta crescer, ela ativa. A cada vez que você decide mudar, ela contra-ataca.",
      "Sozinha, você não sai daí. Não porque você é fraca. Porque a Herança foi feita pra ser invisível.",
    ],
    reframe:
      "Isso NÃO é culpa sua. Você não escolheu essa programação — ela foi instalada quando você era criança, sem você perceber. E é exatamente por isso que dá pra remover.",
    ganchoJapones:
      "Na Medicina Oriental Japonesa, esse padrão tem nome: Ishin-Denshin (以心伝心) — a transmissão silenciosa que passa de geração em geração. É isso que o Hugo remove no Protocolo.",
    prognostico:
      "Se você não remover essa Herança nos próximos 6 meses, 2026 vai ser igual a 2025. Que foi igual a 2024. E você sabe disso.",
  },
  adormecida: {
    arquetipo: "adormecida",
    nomeCurto: "Mente Adormecida",
    severidade: "ESTADO MODERADO",
    severidadeCor: "laranja",
    grau: 71,
    frasesDor: [
      "Você anda. Você faz. Você entrega. Mas está andando com o freio de mão puxado.",
      "Sabe que podia estar em outro nível — mas algo dentro segura o ritmo que você tem.",
      "Não é falta de talento nem de esforço. É uma Herança Mental Herdada mais sutil: a de 'ficar no seu lugar'.",
      "Ela não te derruba. Ela te desacelera. Enquanto os outros aceleram, você mantém o passo — e o gap vai crescendo em silêncio.",
      "É a mais perigosa das três: como não dói forte, você adia demais. Mas ela cobra em anos, não em dias.",
      "A boa notícia: sua Herança é a mais rápida de remover — porque você já está em movimento.",
    ],
    reframe:
      "Isso NÃO é falta de vontade. Você tem — o que falta é liberar o freio. E o Protocolo do Hugo é exatamente sobre isso.",
    ganchoJapones:
      "Na Medicina Oriental Japonesa, esse padrão tem nome: Ishin-Denshin (以心伝心) — a herança silenciosa que passa de geração em geração. É isso que o Hugo remove no Protocolo.",
    prognostico:
      "Se você não remover essa Herança nos próximos 6 meses, o gap vai continuar crescendo. Em 3 anos, você olha pra trás e percebe que passou mais uma janela.",
  },
};

/** Calcula o arquétipo dominante das respostas. Empate → aprisionada (mais comum na VSL). */
export function calcularArquetipo(answers: string[]): Arquetipo {
  const contagem: Record<Arquetipo, number> = { escrava: 0, aprisionada: 0, adormecida: 0 };
  answers.forEach((key, i) => {
    const q = QUIZ_QUESTIONS[i];
    const opt = q?.options.find((o) => o.key === key);
    if (opt) contagem[opt.weight] += 1;
  });
  const ordem: Arquetipo[] = ["escrava", "aprisionada", "adormecida"];
  let winner: Arquetipo = "aprisionada";
  let max = -1;
  for (const a of ordem) {
    if (contagem[a] > max) {
      max = contagem[a];
      winner = a;
    }
  }
  // desempate: se aprisionada empata com outra, prevalece aprisionada (default do funil)
  if (contagem.aprisionada === max) winner = "aprisionada";
  return winner;
}

/** Recupera a citação literal da resposta escolhida — pra plantar no diagnóstico como prova. */
export function citarResposta(answers: string[], qId: number): string | null {
  const q = QUIZ_QUESTIONS.find((x) => x.id === qId);
  if (!q) return null;
  const idx = QUIZ_QUESTIONS.indexOf(q);
  const key = answers[idx];
  return q.options.find((o) => o.key === key)?.text ?? null;
}

export const PANDA_VSL_SRC =
  "https://player-vz-76736fd2-919.tv.pandavideo.com.br/embed/?v=b3cdb18e-5517-4a50-987c-0337ea0b7f8e&autoplay=1&preload=metadata";

export const CHECKOUT_IMERSAO =
  "https://pay.hotmart.com/N103472724M?off=z8ho36x1&checkoutMode=10";
