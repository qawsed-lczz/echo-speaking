const pad = (n: number) => String(n).padStart(2, '0');

/** Local-time date key, YYYY-MM-DD. */
export const dateKey = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (key: string, delta: number): string => {
  const date = parseKey(key);
  date.setDate(date.getDate() + delta);
  return dateKey(date);
};

export const daysBetween = (from: string, to: string): number => {
  const a = parseKey(from).getTime();
  const b = parseKey(to).getTime();
  return Math.round((b - a) / 86_400_000);
};

export const lastNDays = (n: number, end: string = dateKey()): string[] => {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) out.push(addDays(end, -i));
  return out;
};

export const weekdayShort = (key: string): string =>
  ['日', '一', '二', '三', '四', '五', '六'][parseKey(key).getDay()];

export const monthDay = (key: string): string => {
  const d = parseKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

export const greeting = (date: Date = new Date()): string => {
  const h = date.getHours();
  if (h < 5) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
};
