export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function round1(value: number): number {
  return Number(value.toFixed(1));
}

export function normalizeLabel(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function getByMatchers(
  totals: Record<string, number>,
  matchers: RegExp[],
  fallback = 0
): number {
  let sum = 0;
  const entries = Object.entries(totals);
  for (const [label, value] of entries) {
    if (matchers.some(matcher => matcher.test(label))) {
      sum += value;
    }
  }
  return sum || fallback;
}

export function percentValue(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return round1((numerator / denominator) * 100);
}
