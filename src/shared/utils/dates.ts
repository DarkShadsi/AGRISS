const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayString(): string {
    return toDateString(new Date());
}

export function parseDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function addDays(s: string, days: number): string {
    const d = parseDate(s);
    d.setDate(d.getDate() + days);
    return toDateString(d);
}

export function diffInDays(from: string, to: string): number {
    return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}