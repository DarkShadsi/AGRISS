/** Orders "2" before "10", and "A2" before "A10". */
export function naturalCompare(a: string, b: string): number {
    const ax = a.toLowerCase().match(/\d+|\D+/g) ?? [];
    const bx = b.toLowerCase().match(/\d+|\D+/g) ?? [];
    for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
        const x = ax[i], y = bx[i];
        if (x === y) continue;
        if (/^\d+$/.test(x) && /^\d+$/.test(y)) return Number(x) - Number(y);
        return x < y ? -1 : 1;
    }
    return ax.length - bx.length;
}