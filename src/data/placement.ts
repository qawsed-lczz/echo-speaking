import { Level } from '../types';

export interface QuizQuestion {
  id: string;
  prompt: string;
  hint?: string;
  options: { key: string; label: string }[];
  answer: string;
  explain: string;
}

export const placementQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: '“Not at all” 里，not 和 at 之间的 t 通常会怎样？',
    options: [
      { key: 'A', label: '完全消失' },
      { key: 'B', label: '变成轻快的闪音，听起来像 d' },
      { key: 'C', label: '加一个 w 音' },
      { key: 'D', label: '重读并爆破' },
    ],
    answer: 'B',
    explain: 't 落在两个元音之间会闪音化，读成“na-da-dall”。',
  },
  {
    id: 'q2',
    prompt: '“I don’t know” 里 don’t 的 t 通常：',
    options: [
      { key: 'A', label: '清晰爆破' },
      { key: 'B', label: '在 n 前只做口型、不爆破' },
      { key: 'C', label: '变成 s' },
      { key: 'D', label: '读成两个 t' },
    ],
    answer: 'B',
    explain: '鼻音前的 t 往往失去爆破，只留下一个很短的停顿。',
  },
  {
    id: 'q3',
    prompt: '“Could you” 最自然的美音读法接近：',
    options: [
      { key: 'A', label: '/kʊd ju/' },
      { key: 'B', label: '/kʊdʒə/' },
      { key: 'C', label: '/kʊl ju/' },
      { key: 'D', label: '/kaʊ ju/' },
    ],
    answer: 'B',
    explain: 'd 和 y 相遇合成 /dʒ/，you 弱读成 /jə/。',
  },
  {
    id: 'q4',
    prompt: '“I bought apples, oranges, and bananas.” 的语调通常是：',
    options: [
      { key: 'A', label: '全程升调' },
      { key: 'B', label: '全程降调' },
      { key: 'C', label: '前两项升，最后一项降' },
      { key: 'D', label: '前两项降，最后一项升' },
    ],
    answer: 'C',
    explain: '列举时前面的项目升调，最后一项降调收尾。',
  },
  {
    id: 'q5',
    prompt: '“gonna” 是下面哪两个词的缩略？',
    options: [
      { key: 'A', label: 'going to' },
      { key: 'B', label: 'got to' },
      { key: 'C', label: 'want to' },
      { key: 'D', label: 'going on' },
    ],
    answer: 'A',
    explain: 'going to 快速连读后收成 gonna，口语里非常常见。',
  },
];

export interface SelfAssessment {
  key: string;
  title: string;
  desc: string;
  level: Level;
}

export const selfAssessments: SelfAssessment[] = [
  {
    key: 'start',
    title: '能读，但不太连',
    desc: '单词发音还行，一整句就变回逐词朗读。',
    level: 1,
  },
  {
    key: 'talk',
    title: '能聊，但不够顺',
    desc: '日常对话没问题，连读、弱读还靠猜。',
    level: 2,
  },
  {
    key: 'flow',
    title: '比较流利',
    desc: '能自然表达，想打磨语调和重音细节。',
    level: 3,
  },
];

export const goals = [
  { key: 'daily', label: '日常交流' },
  { key: 'study', label: '留学 / 学术' },
  { key: 'interview', label: '面试 / 工作' },
  { key: 'accent', label: '纠正口音' },
];

/** Map quiz score (0-5) plus self assessment to a starting module. */
export const recommendStart = (score: number, selfLevel: Level): number => {
  const quizLevel: Level = score <= 1 ? 1 : score <= 3 ? 2 : 3;
  const level = Math.min(quizLevel, selfLevel) as Level;
  if (level === 1) return 1;
  if (level === 2) return score >= 3 ? 3 : 2;
  return score >= 4 ? 5 : 4;
};

export const levelLabel: Record<Level, string> = {
  1: '起步',
  2: '进阶',
  3: '自如',
};
