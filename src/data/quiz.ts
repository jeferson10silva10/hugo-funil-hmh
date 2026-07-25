// Dados do quiz HMH — copy verbatim capturada de hugomiyazakioriental.org (25/07/2026)
// Fonte da verdade: docs/research/FUNIL_SOURCE_OF_TRUTH.md

export interface QuizOption {
  key: "A" | "B" | "C";
  text: string;
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
      { key: "A", text: "A gente é pobre, mas é honesto / Quem nasce pobre morre pobre" },
      { key: "B", text: "Dinheiro não dá em árvore / Tem que trabalhar duro pra ter um pouquinho" },
      { key: "C", text: "Se você estudar e se esforçar, dá certo / A gente dá um jeito" },
    ],
  },
  {
    id: 2,
    question: "Quando você senta para fazer algo importante pra VOCÊ, o que acontece?",
    options: [
      { key: "A", text: "Eu travo. Faço qualquer coisa menos o que precisa" },
      { key: "B", text: "Eu começo, mas em pouco tempo desvio e perco o foco" },
      { key: "C", text: "Eu consigo começar, mas demora pra entrar no ritmo" },
    ],
  },
  {
    id: 3,
    question: "Nos últimos 12 meses, quantos projetos você começou e NÃO terminou?",
    options: [
      { key: "A", text: "Vários. Começo empolgado e abandono no meio" },
      { key: "B", text: "Alguns. Termino uns, abandono outros" },
      { key: "C", text: "Poucos. Termino quase tudo, mas demora muito" },
    ],
  },
  {
    id: 4,
    question: "Quando você vê alguém da sua idade conquistando muito mais que você, o que sente?",
    options: [
      { key: "A", text: "Acho que teve sorte ou passou por cima de alguém" },
      { key: "B", text: "Fico inquieto. Penso que podia ser eu" },
      { key: "C", text: "Me inspiro, mas penso que vou no meu ritmo" },
    ],
  },
  {
    id: 5,
    question: "À noite, antes de dormir, qual sensação você sente com mais frequência?",
    options: [
      { key: "A", text: "Peso. Mais um dia que não fiz o que precisava" },
      { key: "B", text: "Inquietação. Lista mental do que ficou pra trás" },
      { key: "C", text: "Cansaço. Trabalhei, mas não sinto que avancei" },
    ],
  },
  {
    id: 6,
    question: "Quando você finalmente separa um tempo pra VOCÊ, o que acontece?",
    options: [
      { key: "A", text: "Aparece alguém precisando e eu largo o meu pra ajudar" },
      { key: "B", text: "Sinto culpa de estar cuidando de mim antes dos outros" },
      { key: "C", text: "Consigo focar em mim, mas é raro" },
    ],
  },
  {
    id: 7,
    question: "Olhando para 2024 e 2025, como você descreveria esses anos?",
    options: [
      { key: "A", text: "Foram parecidos demais. Quase nada mudou" },
      { key: "B", text: "Tive avanços, mas algo sempre me puxava de volta" },
      { key: "C", text: "Cresci, mas não no ritmo que sei que poderia" },
    ],
  },
];

export const PANDA_VSL_SRC =
  "https://player-vz-76736fd2-919.tv.pandavideo.com.br/embed/?v=b3cdb18e-5517-4a50-987c-0337ea0b7f8e&autoplay=1&preload=metadata";

export const CHECKOUT_IMERSAO =
  "https://pay.hotmart.com/N103472724M?off=z8ho36x1&checkoutMode=10";
