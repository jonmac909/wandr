export function parseIsoDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToIso(dateStr: string, days: number): string {
  const date = parseIsoDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}
