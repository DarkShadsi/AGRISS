import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/client';
import { financialLogs } from '@/db/schema';

export type Period = 'day' | 'month' | 'overall';

function range(period: Period): [Date, Date] | null {
    const n = new Date();
    if (period === 'day')
        return [new Date(n.getFullYear(), n.getMonth(), n.getDate()),
            new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1)];
    if (period === 'month')
        return [new Date(n.getFullYear(), n.getMonth(), 1),
            new Date(n.getFullYear(), n.getMonth() + 1, 1)];
    return null;
}

export function getSales(period: Period) {
    const r = range(period);
    const conds = [eq(financialLogs.type, 'income')];
    if (r) conds.push(gte(financialLogs.date, r[0]), lt(financialLogs.date, r[1]));
    return db.select().from(financialLogs)
        .where(and(...conds))
        .orderBy(desc(financialLogs.date))
        .all();
}

export function getTotals(sales: ReturnType<typeof getSales>) {
    return {
        yield: sales.reduce((a, s) => a + (s.unitsYield ?? 0), 0),
        income: sales.reduce((a, s) => a + s.amount, 0),
    };
}

type NewSale = {
    cycleId: string; cropName: string;
    unitsYield: number; pricePerUnit: number; date: Date;
};

export function addSale(s: NewSale) {
    db.insert(financialLogs).values({
        id: randomUUID(),
        cycleId: s.cycleId,
        type: 'income',
        category: s.cropName, // crop name is stored here so it survives deleting the crop
        unitsYield: s.unitsYield,
        pricePerUnit: s.pricePerUnit,
        amount: s.unitsYield * s.pricePerUnit,
        date: s.date,
    }).run();
}

export function deleteSale(id: string) {
    db.delete(financialLogs).where(eq(financialLogs.id, id)).run();
}