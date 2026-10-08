import { z } from 'zod';
export const starterEncouragements = [
    'You can make the harder choice.',
    'A little hard now. A little prouder later.',
    'Pause. Remember the life you want.',
    'You only need to choose this next step.'
];
export const legacyCategories = [['scrolling','Scrolling'],['seconds','Going for seconds'],['junk-food','Eating junk food'],['unplanned-eating','Unplanned eating'],['staying-up-late','Staying up late'],['negative-self-talk','Negative self-talk'],['lingering-in-bed','Lingering in bed'],['watching-movies','Watching movies']].map(([id,label])=>({id,label,image:`option-a-${id}-v2.webp`,active:true}));
export const foodIds = new Set(['seconds','junk-food','unplanned-eating']);
export const directionDefinitions = [
 {id:'scrolling',label:'Be Present',image:'option-a-scrolling-v2.webp',encouragement:'You can step away, even when it’s hard to stop.',guidance:'Give your attention to the life in front of you. Put your phone down and take one intentional breath.'},
 {id:'eat-well',label:'Eat Well',image:'option-a-seconds-v2.webp',encouragement:'A little self-control now can feel good later.',guidance:'Choose protein + fiber, limit junk food, and eat sensible portions. Pause before the next bite and decide what fits your plan.'},
 {id:'staying-up-late',label:'Rest Well',image:'option-a-staying-up-late-v2.webp',encouragement:'Give tomorrow’s you a good start.',guidance:'Plenty of rest supports the mind and body you want. Turn off the screen and begin getting ready for bed.'},
 {id:'negative-self-talk',label:'Be Kind to Myself',image:'option-a-negative-self-talk-v2.webp',encouragement:'You can be honest with yourself and still be kind.',guidance:'One difficult moment doesn’t define you. Replace the harsh thought with something you’d say to a friend.'},
 {id:'lingering-in-bed',label:'Start My Day',image:'option-a-lingering-in-bed-v2.webp',encouragement:'You only need to make the first move.',guidance:'Your morning plan helps you live the day you want. Sit up, put your feet on the floor, and begin.'},
 {id:'watching-movies',label:'Use My Time Well',image:'option-a-watching-movies-v2.webp',encouragement:'Choose what you’ll be glad you made time for.',guidance:'Remember what makes a good day: movement, creativity, and connection. Pause the movie and take one small step toward one of those.'},
 {id:'move-well',label:'Move Well',image:'move-well.webp',encouragement:'You don’t have to feel motivated to begin.',guidance:'Remember your plan: prioritize strength, move daily, and stay on schedule. Put on your workout clothes and take the first step.'}
];
export const defaultAlternatives: Record<string,string[]> = {
  "scrolling": [
    "Put my phone out of reach",
    "Step outside",
    "Talk with someone",
    "Play some music",
    "Notice five things around me"
  ],
  "eat-well": [
    "Pause and check whether I’m hungry",
    "Choose protein + fiber",
    "Start with a sensible portion",
    "Put leftovers away before taking seconds",
    "Enjoy the conversation while I decide"
  ],
  "staying-up-late": [
    "Put my phone on its charger",
    "Turn off the TV",
    "Brush my teeth",
    "Dim the lights",
    "Get into bed"
  ],
  "negative-self-talk": [
    "Speak to myself like a friend",
    "Name one thing I did well",
    "Replace a harsh thought with a fair one",
    "Take three slow breaths",
    "Reach out to someone supportive"
  ],
  "lingering-in-bed": [
    "Sit up and put my feet down",
    "Open the curtains",
    "Put on workout clothes",
    "Walk to my workout space",
    "Start the first step of my morning plan"
  ],
  "watching-movies": [
    "Play an instrument",
    "Make something",
    "Call a friend or family member",
    "Take a walk",
    "Spend ten minutes on a meaningful project"
  ],
  "move-well": [
    "Put on workout clothes",
    "Do a five-minute warm-up",
    "Start my first strength exercise",
    "Take a brisk walk",
    "Do a shorter version of my planned workout"
  ]
};
export const categorySchema = z.object({id:z.string().min(1).max(80),label:z.string().trim().min(1).max(80),image:z.string().max(80),active:z.boolean(),encouragement:z.string().trim().max(140).optional(),guidance:z.string().trim().max(500).optional(),alternatives:z.array(z.string().trim().min(1, "Write an option or remove the empty one.").max(180)).max(30).optional()});
type StoredCategory=z.infer<typeof categorySchema>;
function upgradeDirections(categories:StoredCategory[]):StoredCategory[]{
 const oldIds=new Set(legacyCategories.map(c=>c.id));
 const upgraded=directionDefinitions.map(direction=>{
  const existing=categories.find(c=>c.id===direction.id);
  const oldFood=categories.filter(c=>foodIds.has(c.id));
  return {...direction,alternatives:existing?.alternatives,active:existing?.active??(direction.id==='eat-well'&&oldFood.length?oldFood.some(c=>c.active):true),...(existing?.encouragement?{encouragement:existing.encouragement}:{}),...(existing?.guidance?{guidance:existing.guidance}:{})};
 });
 return [...upgraded,...categories.filter(c=>!oldIds.has(c.id)&&!directionDefinitions.some(d=>d.id===c.id))];
}
export const settingsSchema = z.object({
    directionsVersion:z.literal(1).optional(),
    headline: z.string().trim().min(1).max(140),
    encouragements: z.array(z.string().trim().min(1, 'Write a phrase or remove the empty one.').max(140)).min(1).max(20).optional(),
    reminder: z.string().trim().min(1).max(500),
    outcomes: z.string().trim().min(1).max(300),
    recipe: z.array(z.object({ title: z.string().trim().min(1).max(120), detail: z.string().max(400) })).length(4),
    categories: z.array(categorySchema).min(1).max(60).refine(a => new Set(a.map(x => x.id)).size === a.length, 'Choices must have unique IDs')
}).transform(settings => ({...settings,directionsVersion:1 as const,categories:(settings.directionsVersion===1?settings.categories:upgradeDirections(settings.categories)).map((c):StoredCategory=>({...c,alternatives:c.alternatives??[...(defaultAlternatives[c.id]??[])]})), encouragements: settings.encouragements ?? [settings.headline, ...starterEncouragements.filter(phrase => phrase !== settings.headline)]}));
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
    alternative?: string;
};
export const defaults: Settings = {
    directionsVersion:1,
    headline: 'You can make the harder choice.',
    encouragements: [...starterEncouragements],
    reminder: 'It may feel hard right now. Think about how proud you’ll feel afterward. One choice, right now.',
    outcomes: 'Sharp mind. Happy mind.\nHealthy body. Long life.',
    recipe: [{ title: 'Get plenty of rest.', detail: '' }, { title: 'Get up and move.', detail: 'Do my workout, prioritize strength, move daily, and stay on schedule.' }, { title: 'Eat protein + fiber.', detail: 'Limit junk food. Eat sensible portions.' }, { title: 'Practice self-control.', detail: 'Pause, remember my plan, and choose deliberately.' }],
    categories: directionDefinitions.map(direction=>({...direction,active:true,alternatives:[...defaultAlternatives[direction.id]]}))
};
export const knownImages = new Set([...defaults.categories,...legacyCategories].map(c => c.image));
export function imageFor(category: Category) { return knownImages.has(category.image) ? `./illustrations/${category.image}` : './illustrations/splash-recipe-v2.webp'; }
export const choicePictures = [{label:'Steer companion',image:'splash-recipe-v2.webp'}, ...defaults.categories.map(c=>({label:c.label,image:c.image})),...legacyCategories.filter(c=>!defaults.categories.some(d=>d.image===c.image)).map(c=>({label:c.label,image:c.image}))];
export function chooseEncouragement(phrases:string[],previous:string,random:()=>number=Math.random){
    const unique=[...new Set(phrases)];const different=unique.filter(phrase=>phrase!==previous);const candidates=different.length?different:unique;
    return candidates[Math.floor(random()*candidates.length)]??starterEncouragements[0];
}
export const alternativeSchema = z.string().trim().min(1).max(180).optional();
const recordFields = { alternative: alternativeSchema, categoryId: z.string().min(1).max(80), categoryLabel: z.string().trim().min(1).max(80), choice: z.enum(['plan', 'original']), mode: z.enum(['moment', 'reflection']), occurredAt: z.string().datetime().refine(v => new Date(v).getTime() <= Date.now() + 60000 && new Date(v).getFullYear() >= 2000, 'Choose a time in the past or present'), note: z.string().max(1000) };
export const mutationSchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('record'), id: z.string().uuid(), ...recordFields }),
    z.object({ action: z.literal('edit'), id: z.string().uuid(), ...recordFields }),
    z.object({ action: z.literal('delete'), id: z.string().uuid() }),
    z.object({ action: z.literal('settings'), settings: settingsSchema })
]);
// Group old records for reporting without rewriting their original saved fields.
export function entriesByDirection(entries:Entry[],categories:Category[]):Entry[]{
 return entries.map(entry=>{const categoryId=foodIds.has(entry.categoryId)?'eat-well':entry.categoryId;const category=categories.find(c=>c.id===categoryId)??directionDefinitions.find(c=>c.id===categoryId);return {...entry,categoryId,categoryLabel:category?.label??entry.categoryLabel};});
}
export function guidanceFor(category:Category,settings:Settings){return {encouragement:category.encouragement||settings.headline,guidance:category.guidance||settings.reminder};}
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

export function quickProgress(entries:Entry[],now=new Date()) {
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const end=new Date(start);end.setDate(end.getDate()+1);
 return {today:summarize(entries.filter(e=>new Date(e.occurredAt)>=start&&new Date(e.occurredAt)<end)),week:summarize(entriesInPeriod(entries,now,'week'))};
}
