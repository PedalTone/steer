import { z } from 'zod';
export const categorySchema = z.object({ id: z.string().min(1).max(80), label: z.string().trim().min(1).max(80), image: z.string().max(80), active: z.boolean() });
export const settingsSchema = z.object({
    headline: z.string().trim().min(1).max(140), reminder: z.string().trim().min(1).max(500),
    outcomes: z.string().trim().min(1).max(300),
    recipe: z.array(z.object({ title: z.string().trim().min(1).max(120), detail: z.string().max(400) })).length(4),
    categories: z.array(categorySchema).min(1).max(40).refine(a => new Set(a.map(x => x.id)).size === a.length, 'Choices must have unique IDs')
});
export type Settings = z.infer<typeof settingsSchema>;
export type Category = Settings['categories'][number];
export type Entry = {
    id: string;
    categoryId: string;
    categoryLabel: string;
    choice: 'plan' | 'original';
    mode: 'moment' | 'reflection';
    occurredAt: string;
    recordedAt: string;
    note: string;
};
export const defaults: Settings = {
    headline: 'You can make the harder choice.',
    reminder: 'It may feel hard right now. Think about how proud you’ll feel afterward. One choice, right now.',
    outcomes: 'Sharp mind. Happy mind.\nHealthy body. Long life.',
    recipe: [{ title: 'Get plenty of rest.', detail: '' }, { title: 'Get up and move.', detail: 'Do my workout, prioritize strength, move daily, and stay on schedule.' }, { title: 'Eat protein + fiber.', detail: 'Limit junk food. Eat sensible portions.' }, { title: 'Practice self-control.', detail: 'Pause, remember my plan, and choose deliberately.' }],
    categories: [['scrolling', 'Scrolling'], ['seconds', 'Going for seconds'], ['junk-food', 'Eating junk food'], ['unplanned-eating', 'Unplanned eating'], ['staying-up-late', 'Staying up late'], ['negative-self-talk', 'Negative self-talk'], ['lingering-in-bed', 'Lingering in bed'], ['watching-movies', 'Watching movies']].map(([id, label]) => ({ id, label, image: `option-a-${id}-v2.webp`, active: true }))
};
export const knownImages = new Set(defaults.categories.map(c => c.image));
export function imageFor(category: Category) { return knownImages.has(category.image) ? `./illustrations/${category.image}` : './illustrations/splash-recipe-v2.webp'; }
const recordFields = { categoryId: z.string().min(1).max(80), categoryLabel: z.string().trim().min(1).max(80), choice: z.enum(['plan', 'original']), mode: z.enum(['moment', 'reflection']), occurredAt: z.string().datetime().refine(v => new Date(v).getTime() <= Date.now() + 60000 && new Date(v).getFullYear() >= 2000, 'Choose a time in the past or present'), note: z.string().max(1000) };
export const mutationSchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('record'), id: z.string().uuid(), ...recordFields }),
    z.object({ action: z.literal('edit'), id: z.string().uuid(), ...recordFields }),
    z.object({ action: z.literal('delete'), id: z.string().uuid() }),
    z.object({ action: z.literal('settings'), settings: settingsSchema })
]);
export type Period = 'week' | 'month';
export function periodBounds(anchor: Date, period: Period) {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    if (period === 'week')
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    else
        start.setDate(1);
    const end = new Date(start);
    if (period === 'week')
        end.setDate(end.getDate() + 7);
    else
        end.setMonth(end.getMonth() + 1);
    return { start, end };
}
export function shiftPeriod(anchor: Date, period: Period, n: number) { const { start } = periodBounds(anchor, period); if (period === 'week')
    start.setDate(start.getDate() + 7 * n);
else
    start.setMonth(start.getMonth() + n); return start; }
export function entriesInPeriod(entries: Entry[], anchor: Date, period: Period) { const { start, end } = periodBounds(anchor, period); return entries.filter(e => { const t = new Date(e.occurredAt); return t >= start && t < end; }); }
export function summarize(entries: Entry[]) { const plan = entries.filter(e => e.choice === 'plan').length; return { total: entries.length, plan, original: entries.length - plan, rate: entries.length ? Math.round(plan / entries.length * 100) : null }; }
export function localInput(date: Date) { const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); }
export function timeline(entries: Entry[], anchor: Date, period: Period) {
    const { start, end } = periodBounds(anchor, period);
    const bins = [];
    for (let from = new Date(start); from < end;) {
        const to = new Date(from);
        to.setDate(to.getDate() + (period === 'week' ? 1 : 7));
        if (to > end)
            to.setTime(end.getTime());
        const last = new Date(to.getTime() - 1);
        const rows = entries.filter(e => { const t = new Date(e.occurredAt); return t >= from && t < to; });
        bins.push({ ...summarize(rows), label: period === 'week' ? from.toLocaleDateString(undefined, { weekday: 'short' }) : `${from.getDate()}–${last.getDate()}`, fullLabel: from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
        from = to;
    }
    return bins;
}
