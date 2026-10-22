import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Dumbbell, Moon, Utensils, Compass, Settings as SettingsIcon, BookOpen, Footprints, Sun, Shirt, Smartphone, ListChecks, X, Plus, MessageCircle, Phone, UsersRound, Music2, Eye, Salad, Tv, BedDouble, Wind, Heart, Sparkles, Palette, Clock3, Apple, Refrigerator } from 'lucide-react';
import { defaults, phrasesFor, guidanceFor, entriesByDirection, localInput, settingsSchema, chooseEncouragement, type Settings, type Category, type Entry } from './journal';
import {readJournal,writeJournal,requestPersistentStorage,type DailyCheckin} from './storage';
import DeviceTools from './DeviceTools';
import Encouragement from './Encouragement';
import GoalIcon,{goalIcons} from './GoalIcon';
import OfflineStatus from './OfflineStatus';
import BuildInfo from './BuildInfo';
import SplashArt from './SplashArt';
import FileSave from './FileSave';
type Screen = 'review' | 'home' | 'reminder' | 'saved' | 'journal' | 'settings' | 'edit';
const dateLabel = (d: string) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const localDayKey=(date=new Date())=>{const shifted=new Date(date.getTime()-date.getTimezoneOffset()*60000);return shifted.toISOString().slice(0,10);};
async function request(body?: unknown) {
    const entry = body ? await writeJournal(body) : undefined;
    const journal = await readJournal();
    return {...journal, entry};
}
export default function Steer() {
    const [screen, setScreen] = useState<Screen>('home'), [settings, setSettings] = useState<Settings>(defaults), [entries, setEntries] = useState<Entry[]>([]), [dailyCheckins,setDailyCheckins]=useState<DailyCheckin[]>([]), [todayKey,setTodayKey]=useState(localDayKey()), [loaded, setLoaded] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const [category, setCategory] = useState<Category>(defaults.categories[0]), [reflection, setReflection] = useState(false), [when, setWhen] = useState(''), [note, setNote] = useState(''), [saved, setSaved] = useState<Entry | null>(null), [editing, setEditing] = useState<Entry | null>(null);
    const [draft, setDraft] = useState<Entry | null>(null);
    const [encouragement,setEncouragement]=useState('');
    const [quickCategory,setQuickCategory]=useState<Category|null>(null), [quickSaved,setQuickSaved]=useState(''), [quickSelected,setQuickSelected]=useState<string[]>([]), [quickCustom,setQuickCustom]=useState<string[]>([]), [quickAddOpen,setQuickAddOpen]=useState(false), [quickNewOption,setQuickNewOption]=useState('');
    const quickDialog=useRef<HTMLDivElement>(null), quickTrigger=useRef<HTMLElement|null>(null);
    const dayOrder=['lingering-in-bed','move-well','eat-well','scrolling','watching-movies','connect-well','negative-self-talk','staying-up-late'];
    const visibleCategories=settings.categories.filter(c=>c.active).sort((a,b)=>(dayOrder.indexOf(a.id)<0?6.5:dayOrder.indexOf(a.id))-(dayOrder.indexOf(b.id)<0?6.5:dayOrder.indexOf(b.id)));
    const choicesToday=new Set(entriesByDirection(entries,settings.categories).filter(entry=>entry.choice==='plan'&&localDayKey(new Date(entry.occurredAt))===todayKey).map(entry=>entry.categoryId));
    const lastEncouragement=useRef('');

    const momentId = useRef(''), pending = useRef(false), heading = useRef<HTMLHeadingElement>(null);
    async function load() { try {
        const data = await request();
        setError('');
        setSettings(data.settings);
        setEntries(data.entries);
        setDailyCheckins(data.dailyCheckins);
        setLoaded(true);
    }
    catch (e) {
        setError((e as Error).message);
    } }
    useEffect(() => { let active = true; request().then(data => { if (active) {
        setSettings(data.settings);
        setEntries(data.entries);
        setDailyCheckins(data.dailyCheckins);
        setLoaded(true);
    } }).catch(e => { if (active)
        setError(e.message); }); return () => { active = false; }; }, []);
    function go(next: Screen) { if(draft && !['review','reminder','saved'].includes(next)){if(!window.confirm('This choice is not saved yet. Discard it?'))return;setDraft(null);} setError(''); setScreen(next); window.scrollTo({ top: 0 }); }
    useEffect(()=>{const refreshDay=()=>setTodayKey(localDayKey());const timer=window.setInterval(refreshDay,30000);document.addEventListener('visibilitychange',refreshDay);window.addEventListener('focus',refreshDay);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refreshDay);window.removeEventListener('focus',refreshDay);};},[]);
    useEffect(()=>setQuickSaved(''),[todayKey]);
    useEffect(()=>{if(!quickCategory)return;const previous=document.activeElement as HTMLElement|null;const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';quickDialog.current?.querySelector<HTMLElement>('button')?.focus();const key=(event:KeyboardEvent)=>{if(event.key==='Escape')setQuickCategory(null);};window.addEventListener('keydown',key);return()=>{document.body.style.overflow=oldOverflow;window.removeEventListener('keydown',key);(quickTrigger.current??previous)?.focus({preventScroll:true});};},[quickCategory]);
    useEffect(()=>{if(!draft)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[draft]);
    useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [screen]);
    async function mutate(body: unknown, onSuccess: (data: Awaited<ReturnType<typeof request>>) => void) { if (pending.current)
        return; pending.current = true; setBusy(true); setError(''); try {
        const data = await request(body);
        setEntries(data.entries);setSettings(data.settings);
        setDailyCheckins(data.dailyCheckins);
        onSuccess(data);
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        pending.current = false;
        setBusy(false);
    } }
    function begin(c: Category) { const phrase=c.encouragement||chooseEncouragement(phrasesFor(c,settings),lastEncouragement.current);lastEncouragement.current=phrase;setEncouragement(phrase); setCategory(c); setWhen(localInput(new Date())); setNote(''); momentId.current = crypto.randomUUID(); go('reminder'); }
    function record(choice: Entry['choice'], alternative?:string) { const at = reflection ? new Date(when) : new Date(); if (!Number.isFinite(at.getTime()) || at.getTime() > Date.now() + 60000) {
        setError('Choose a time in the past or present.');
        return;
    } const entry: Entry = { id: momentId.current, categoryId: category.id, categoryLabel: category.label, alternative, choice, mode: reflection ? 'reflection' : 'moment', occurredAt: at.toISOString(), recordedAt: new Date().toISOString(), note: note.trim() }; setDraft(entry); if(reflection)go('review');else saveEntry(entry); }
    function saveChoice(){if(draft)saveEntry(draft);}
    function saveEntry(entry:Entry){void mutate({action:'record',...entry},data=>{if(!data.entry)throw new Error('Could not confirm your save. Please retry.');setSaved(data.entry);setDraft(null);go('saved');void requestPersistentStorage();});}
    function saveQuickChoice(){if(!quickCategory||!quickSelected.length)return;const option=quickSelected.join(' · ');if(option.length>1000){setError('Choose fewer or shorter steps before saving.');return;}const now=new Date().toISOString();const entry:Entry={id:crypto.randomUUID(),categoryId:quickCategory.id,categoryLabel:quickCategory.label,alternative:option,choice:'plan',mode:'moment',occurredAt:now,recordedAt:now,note:''};void mutate({action:'record',...entry},data=>{if(!data.entry)throw new Error('Could not confirm your save. Please retry.');setSaved(data.entry);setQuickSaved(`${quickCategory.label} saved.`);setQuickCategory(null);setQuickSelected([]);setQuickCustom([]);setQuickAddOpen(false);setQuickNewOption('');void requestPersistentStorage();});}
    function addQuickOption(){const value=quickNewOption.trim();if(!value||!quickCategory)return;if(!(quickCategory.alternatives??[]).includes(value)&&!quickCustom.includes(value))setQuickCustom(options=>[...options,value]);setQuickSelected(options=>options.includes(value)?options:[...options,value]);setQuickNewOption('');setQuickAddOpen(false);}
    function openQuickCategory(c:Category,trigger:HTMLElement){quickTrigger.current=trigger;setError('');setQuickSelected([]);setQuickCustom([]);setQuickAddOpen(false);setQuickNewOption('');setQuickCategory(c);}

    return <div className="shell">{loaded&&<nav className="utility-nav" aria-label="Navigation">{screen!=="home"&&<button disabled={busy} onClick={()=>go("home")}><BookOpen size={18}/>My day</button>}<button disabled={busy} onClick={()=>go("journal")}><BookOpen size={18}/>Journal</button><button disabled={busy} onClick={()=>go("settings")}><SettingsIcon size={18}/>Settings</button></nav>}{screen!=='home'&&<header><button className="brand" onClick={() => go('home')} disabled={busy} aria-label="Steer home"><Compass size={23}/>steer</button><span className="header-note">One choice, right now.</span></header>}
 <main aria-busy={busy}>
 {!loaded ? <section className="loading"><h1 ref={heading} tabIndex={-1}>Your moment to pause.</h1>{error ? <><p role="alert">{error}</p><button className="primary" onClick={() => void load()}>Try again</button><p className="small">Your journal stays on this device. Try reopening Steer without clearing website data.</p></> : <p>Opening your journal…</p>}</section> : <>
 {screen === 'home' && <section className="home home-dashboard"><SplashArt/><div className="home-heading"><div><h1 ref={heading} tabIndex={-1}>What good choice do I need right now?</h1></div></div><div className="home-goals" aria-label="Choose a good direction">{visibleCategories.map(c=>{const chosen=choicesToday.has(c.id);return <button key={c.id} className={`home-goal${chosen?' is-complete':''}`} aria-label={chosen?`${c.label}, choice saved today`:c.label} disabled={busy} onClick={e=>openQuickCategory(c,e.currentTarget)}><GoalIcon id={c.id} image={c.image}/><span>{c.label}</span></button>;})}</div>{!settings.categories.some(c=>c.active)&&<p>Turn on a direction in Settings to get started.</p>}{quickSaved&&<div className="quick-saved"><span role="status">{quickSaved}</span><FileSave compact journal={{entries,settings,dailyCheckins}}/></div>}<div className="home-life"><p className="eyebrow">The life I’m choosing</p><div className="home-recipe" aria-label="My recipe for success">{settings.recipe.map((item,i)=>{const Icon=recipeIcons[i];return <div key={i}><Icon size={18} aria-hidden="true"/><span>{item.title}</span></div>;})}</div></div><div className="home-links"><BuildInfo/></div></section>}

 {screen === 'reminder' && <section className="reminder"><button className="back" onClick={() => go('home')} disabled={busy}><ArrowLeft size={18}/>My day</button><p className="eyebrow">{category.label}</p>{reflection?<h1 ref={heading} tabIndex={-1}>A moment to learn.</h1>:<Encouragement key={category.id} initial={encouragement} phrases={phrasesFor(category,settings)} heading={heading}/>}<div className="moment-options"><h2>{reflection?'What did you choose?':'Take a breath. Choose your next step.'}</h2>{!reflection&&<p className="small">{busy?'Saving your choice…':'Tap an option to save your good choice.'}</p>}{(category.alternatives??[]).map((option,index)=><button className="secondary action-option" key={index} disabled={busy} onClick={()=>record('plan',option)}>{option}<ArrowRight size={18} aria-hidden="true"/></button>)}</div>{error && <p className="error" role="alert">{error}</p>}{reflection&&<><button className="primary" disabled={busy} onClick={()=>record('plan')}>I chose my plan<Check size={19}/></button><button className="secondary" disabled={busy} onClick={()=>record('original')}>I continued as I was</button></>}{!reflection&&!(category.alternatives??[]).length&&<p className="small">Add a “do instead” option for this goal in Settings to record your next step.</p>}<details className="moment-more"><summary>Notes & reminders</summary><details className="recipe-details"><summary>Remember my plan</summary><p className="reminder-copy">{reflection ? 'Remember your choice as it happened. You can start fresh with the next one.' : guidanceFor(category,settings).guidance}</p><div className="why"><span>The life I’m choosing</span><p>{settings.outcomes}</p></div></details>{reflection && <label className="field">When did it happen?<input type="datetime-local" value={when} max={localInput(new Date())} onChange={e => setWhen(e.target.value)} required/></label>}<details className="note-details"><summary>Add a note (optional)</summary><textarea aria-label="Note" placeholder="What was going on?" value={note} maxLength={1000} onChange={e => setNote(e.target.value)}/></details></details><details className="recipe-details"><summary>Remember my recipe</summary><Recipe settings={settings}/></details></section>}
 {screen === 'review' && draft && <section className="review"><button className="back" disabled={busy} onClick={()=>go('reminder')}><ArrowLeft size={18}/>Change my choice</button><p className="eyebrow">ONE MORE STEP</p><h1 ref={heading} tabIndex={-1}>Save this moment.</h1><p className="intro">Tap below to keep this choice in your journal on this device.</p><div className="receipt"><strong>{draft.categoryLabel}</strong><span>{draft.choice==='plan'?'My plan':'Continued as I was'} · {dateLabel(draft.occurredAt)}</span><span>{draft.mode==='moment'?'Before acting':'Afterward'}</span>{draft.alternative&&<p>{draft.alternative}</p>}{draft.note&&<p>{draft.note}</p>}</div>{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy} onClick={saveChoice}>{busy?'Saving on this device…':'Save to my journal'}<Check size={19}/></button><p className="small">Not saved until you tap. No internet or account needed.</p></section>}
 {screen === 'saved' && saved && <section className="saved"><div className="saved-mark"><Check size={32}/></div><p className="eyebrow">SAVED ON THIS DEVICE</p><h1 ref={heading} tabIndex={-1}>{saved.choice==='plan'?'Good choice. Give yourself credit.':'You paused. That matters.'}</h1><p className="reminder-copy">{saved.choice==='plan'?'Now take that step. You can make the next good choice, too.':'The next moment is another chance to steer.'}</p><p className="chosen-step">{saved.alternative??saved.categoryLabel}</p><FileSave key={saved.id} journal={{entries,settings,dailyCheckins}}/><button className="primary" onClick={()=>go('home')}>Done</button><button className="text-button" onClick={()=>go('journal')}>Open my journal</button><button className="text-button" onClick={()=>{setEditing(saved);go('edit');}}>Change this entry</button></section>}
 {screen === 'journal' && <Journal entries={entries} categories={settings.categories} onEdit={e => { setEditing(e); go('edit'); }} onRecord={() => { setReflection(false); go('home'); }} heading={heading}/>}
 {screen === 'settings' && <><SettingsForm key={JSON.stringify(settings)} settings={settings} busy={busy} error={error} onSave={draft => void mutate({ action: 'settings', settings: draft }, () => { setSettings(draft); go('home'); })}/><DeviceTools onImported={load}/></>}
 {screen === 'edit' && editing && <EditEntry key={editing.id} entry={editing} categories={settings.categories} busy={busy} error={error} onBack={() => go('journal')} onSave={entry => void mutate({ action: 'edit', ...entry }, () => { setEntries(a => a.map(e => e.id === entry.id ? entry : e)); go('journal'); })} onDelete={() => void mutate({ action: 'delete', id: editing.id }, () => { setEntries(a => a.filter(e => e.id !== editing.id)); go('journal'); })}/>}
 </>}
 {screen==='home'&&quickCategory&&<div className="quick-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)setQuickCategory(null);}}><div className="quick-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-title" ref={quickDialog}><div className="quick-dialog-head"><div><p className="eyebrow">{quickCategory.label}</p><h2 id="quick-title">Choose what you’ll do</h2></div><button className="quick-close" aria-label="Close options" onClick={()=>setQuickCategory(null)}><X size={22}/></button></div><p className="quick-encouragement">{guidanceFor(quickCategory,settings).encouragement} Select one or more small steps.</p><div className="quick-options">{[...(quickCategory.alternatives??[]),...quickCustom].map((option,index)=><button key={`${index}-${option}`} type="button" className={`quick-option${quickSelected.includes(option)?' is-selected':''}`} aria-pressed={quickSelected.includes(option)} disabled={busy} onClick={()=>setQuickSelected(selected=>selected.includes(option)?selected.filter(value=>value!==option):[...selected,option])}><span className={`quick-option-icon tone-${index%6}`}><ActionGlyph option={option} categoryId={quickCategory.id} index={index}/></span><span>{option}</span></button>)}</div><button type="button" className="quick-add-trigger" disabled={busy} onClick={()=>setQuickAddOpen(open=>!open)}><Plus size={19}/>Add</button>{quickAddOpen&&<form className="quick-add-form" onSubmit={event=>{event.preventDefault();addQuickOption();}}><input autoFocus aria-label="Name a step" placeholder="Name another step" value={quickNewOption} maxLength={180} onChange={event=>setQuickNewOption(event.target.value)}/><button type="submit" className="quick-add-submit" disabled={!quickNewOption.trim()||busy}>Add</button></form>}{quickSelected.length>0&&<button type="button" className="primary quick-save" disabled={busy} onClick={saveQuickChoice}>{busy?'Saving on this iPhone…':'Save my choices'}<Check size={19}/></button>}{error&&<p className="error" role="alert">{error}</p>}{busy&&<p className="small" role="status">Saving your choice on this iPhone…</p>}</div></div>}
 </main><OfflineStatus visible={screen==='settings'} canReload={loaded&&!busy&&!draft&&screen==='home'}/></div>;
}
function ActionGlyph({option,categoryId,index}:{option:string;categoryId:string;index:number}){
 const value=option.toLowerCase();
 const categoryIcons:Record<string,typeof Sun[]>={
  'lingering-in-bed':[Footprints,Sun,Shirt,Footprints,ListChecks],
  'move-well':[Shirt,Dumbbell,Dumbbell,Footprints,Dumbbell],
  'eat-well':[Apple,Salad,Utensils,Refrigerator,UsersRound],
  'scrolling':[Smartphone,Footprints,UsersRound,Music2,Eye],
  'watching-movies':[Music2,Palette,Phone,Footprints,Clock3],
  'connect-well':[MessageCircle,Phone,UsersRound,Footprints,UsersRound],
  'negative-self-talk':[Heart,Sparkles,MessageCircle,Wind,UsersRound],
  'staying-up-late':[Smartphone,Tv,Sparkles,Sun,BedDouble]
 };
 const Icon=/phone|scroll|charger/.test(value)?Smartphone
  :/text|message/.test(value)?MessageCircle
  :/call/.test(value)?Phone
  :/clothes|shirt/.test(value)?Shirt
  :/workout|warm-up|exercise|strength/.test(value)?Dumbbell
  :/walk|feet|step outside/.test(value)?Footprints
  :/curtain|lights|sun/.test(value)?Sun
  :/bed|sleep/.test(value)?BedDouble
  :/tv|movie/.test(value)?Tv
  :/music|instrument/.test(value)?Music2
  :/breath/.test(value)?Wind
  :/hungry/.test(value)?Apple
  :/protein|fiber/.test(value)?Salad
  :/leftover/.test(value)?Refrigerator
  :/portion|seconds/.test(value)?Utensils
  :/talk|conversation|listen|together|someone/.test(value)?UsersRound
  :/thought|friend|kind|support/.test(value)?Heart
  :/notice|around/.test(value)?Eye
  :/make|project|creative/.test(value)?Palette
  :categoryIcons[categoryId]?.[index%5]??ListChecks;
 return <Icon size={25} strokeWidth={1.9} aria-hidden="true"/>;
}
function Journal({ entries: originalEntries, categories, onEdit, onRecord, heading }: {
    entries: Entry[];
    categories: Category[];
    onEdit: (entry: Entry) => void;
    onRecord: () => void;
    heading: React.RefObject<HTMLHeadingElement | null>;
}) {
    const entries = entriesByDirection(originalEntries, categories).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    const days = new Map<string, Entry[]>();
    for (const entry of entries) {
        const day = localDayKey(new Date(entry.occurredAt));
        days.set(day, [...(days.get(day) ?? []), entry]);
    }
    return <section className="journal"><p className="eyebrow">YOUR JOURNAL</p><h1 ref={heading} tabIndex={-1}>Moments I chose.</h1><p className="intro">A place to remember the small steps you saved.</p>
        {days.size === 0 ? <div className="empty"><Compass size={30}/><h2>No moments yet.</h2><p>When you save a choice, it will appear here.</p><button className="secondary" onClick={onRecord}>Make a good choice</button></div> : <div className="journal-days">{Array.from(days, ([day, rows]) => <div className="journal-day" key={day}><h2>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2><div className="entries">{rows.map(entry => <button key={entry.id} className="entry" onClick={() => onEdit(originalEntries.find(original => original.id === entry.id)!)}><div><strong>{entry.categoryLabel}</strong><span>{dateLabel(entry.occurredAt)} · {entry.mode === 'moment' ? 'Chosen in the moment' : 'Recorded afterward'}</span>{entry.alternative && <p>{entry.alternative}</p>}{entry.note && <p>{entry.note}</p>}</div><span className={`badge ${entry.choice}`}>{entry.choice === 'plan' ? 'Chose a step' : 'Continued as I was'}</span><ChevronRight size={16}/></button>)}</div></div>)}</div>}
        {days.size > 0 && <p className="small journal-note">These are the choices you recorded. A saved step is an intention; you can edit a moment if things went differently.</p>}
    </section>;
}
function AlternativesEditor({category,onChange}:{category:Category;onChange:(options:string[])=>void}) {
    const options=category.alternatives??[];
    return <details className="alternatives-editor"><summary>Things I could do instead ({options.length})</summary>
        <p className="small">Make these steps your own. Edit, remove, or add an option, then tap Save my settings.</p>
        {options.map((option,index)=><div className="alternative-edit" key={index}>
            <label className="field">Option {index+1}<textarea aria-label={`${category.label}: option ${index+1}`} value={option} maxLength={180} onChange={e=>onChange(options.map((value,i)=>i===index?e.target.value:value))}/></label>
            <button type="button" className="text-button" aria-label={`Remove ${category.label} option ${index+1}`} onClick={()=>onChange(options.filter((_,i)=>i!==index))}>Remove</button>
        </div>)}
        {!options.length&&<p className="small">Add a small step you could take toward this goal.</p>}
        <button type="button" className="secondary" disabled={options.length>=30} onClick={()=>onChange([...options,''])}>Add option</button>
    </details>;
}

function SettingsForm({ settings, busy, error, onSave }: {
    settings: Settings;
    busy: boolean;
    error: string;
    onSave: (s: Settings) => void;
}) {
    const [draft, setDraft] = useState(settings), [invalid, setInvalid] = useState('');
    const [newChoice,setNewChoice]=useState(''),[newImage,setNewImage]=useState('icon:custom'),[choiceError,setChoiceError]=useState(''),[notice,setNotice]=useState('');
    function addChoice(){const label=newChoice.trim();if(!label){setChoiceError('Name your new choice first.');return;}if(draft.categories.some(c=>c.label.toLowerCase()===label.toLowerCase())){setChoiceError('That choice is already in your list. Use its Show checkbox to display it.');return;}if(draft.categories.length>=60){setChoiceError('You can save up to 60 choices.');return;}setDraft({...draft,categories:[...draft.categories,{id:crypto.randomUUID(),label,image:newImage,active:true}]});setNewChoice('');setChoiceError('');setNotice('Choice added to your list. Tap Save my settings below to keep it.');}

    return <section><p className="eyebrow">MAKE IT YOURS</p><h1>My settings.</h1><p className="intro">Words that help you remember how you want to live.</p><form onSubmit={e => { e.preventDefault(); if(newChoice.trim()){setChoiceError('Tap Add choice to my list first, or clear the name before saving.');return;} const result = settingsSchema.safeParse({...draft,headline:draft.encouragements[0]}); if (!result.success) {
        const issue=result.error.issues[0]; const goal=issue.path[0]==='categories'?draft.categories[Number(issue.path[1])]?.label:undefined; setInvalid(`${goal?goal+': ':''}${issue.message}`);
        return;
    } setInvalid(''); onSave(result.data); }}><h2>General encouragement phrases</h2><p className="small">Goals use their own phrase lists below. These general phrases are used when a goal has no phrase list. Reduce Motion on your device keeps the text still.</p>{draft.encouragements.map((phrase,i)=><div className="phrase-edit" key={i}><label className="field">Phrase {i+1}<textarea value={phrase} maxLength={140} required onChange={e=>setDraft({...draft,encouragements:draft.encouragements.map((p,j)=>j===i?e.target.value:p)})}/></label><button type="button" className="text-button" disabled={draft.encouragements.length===1} aria-label={`Remove phrase ${i+1}`} onClick={()=>setDraft({...draft,encouragements:draft.encouragements.filter((_,j)=>j!==i)})}>Remove</button></div>)}<button type="button" className="secondary" disabled={draft.encouragements.length>=20} onClick={()=>setDraft({...draft,encouragements:[...draft.encouragements,'']})}>Add encouragement phrase</button><label className="field">Default reminder for custom directions<textarea value={draft.reminder} maxLength={500} required onChange={e => setDraft({ ...draft, reminder: e.target.value })}/></label><label className="field">The life I’m choosing<textarea value={draft.outcomes} maxLength={300} required onChange={e => setDraft({ ...draft, outcomes: e.target.value })}/></label><h2>My recipe for success</h2>{draft.recipe.map((r, i) => <fieldset key={i}><legend>Ingredient {i + 1}</legend><label className="field">Main idea<input value={r.title} required maxLength={120} onChange={e => setDraft({ ...draft, recipe: draft.recipe.map((v, j) => j === i ? { ...v, title: e.target.value } : v) })}/></label><label className="field">Details<textarea value={r.detail} maxLength={400} onChange={e => setDraft({ ...draft, recipe: draft.recipe.map((v, j) => j === i ? { ...v, detail: e.target.value } : v) })}/></label></fieldset>)}<h2>My directions</h2><p className="small">Rename or hide a button. Past entries stay in your journal.</p>{draft.categories.map((c, i) => <div className="direction-settings" key={c.id}><div className="category-edit"><input aria-label={`Direction ${i+1}`} value={c.label} maxLength={80} required onChange={e=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,label:e.target.value}:v)})}/><label><input type="checkbox" checked={c.active} onChange={e=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,active:e.target.checked}:v)})}/>Show</label></div><details><summary>Edit this direction’s reminder</summary><label className="field">Encouragement<input value={c.encouragement??''} maxLength={140} placeholder="Use my extra phrases" onChange={e=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,encouragement:e.target.value}:v)})}/></label><label className="field">Plan reminder and first step<textarea value={c.guidance??''} maxLength={500} placeholder="Use my default reminder" onChange={e=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,guidance:e.target.value}:v)})}/></label></details><details><summary>Encouragement phrases ({(c.phrases??[]).length})</summary><p className="small">These cycle after this goal’s opening encouragement. Edit, remove, or add phrases, then save your settings. An empty list uses your general phrases.</p>{(c.phrases??[]).map((phrase,k)=><div className="phrase-edit" key={k}><label className="field">Phrase {k+1}<textarea aria-label={`${c.label} phrase ${k+1}`} maxLength={140} value={phrase} onChange={e=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,phrases:(v.phrases??[]).map((p,n)=>n===k?e.target.value:p)}:v)})}/></label><button type="button" className="text-button" aria-label={`Remove ${c.label} phrase ${k+1}`} onClick={()=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,phrases:(v.phrases??[]).filter((_,n)=>n!==k)}:v)})}>Remove</button></div>)}<button type="button" className="secondary" disabled={(c.phrases??[]).length>=40} onClick={()=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,phrases:[...(v.phrases??[]),'']}:v)})}>Add phrase for this goal</button></details><AlternativesEditor category={c} onChange={alternatives=>setDraft({...draft,categories:draft.categories.map((v,j)=>j===i?{...v,alternatives}:v)})}/></div>)}<fieldset className="new-choice"><legend>Add a choice</legend><label className="field">What would you like to do?<input value={newChoice} maxLength={80} placeholder="For example, Make Something" onChange={e=>{setNewChoice(e.target.value);setChoiceError('');}}/></label><details><summary>Choose an icon</summary><div className="picture-options" role="radiogroup" aria-label="Icon for the new choice">{goalIcons.map(p=><button key={p.id} type="button" role="radio" aria-checked={newImage==='icon:'+p.id} className={newImage==='icon:'+p.id?'selected':''} aria-label={p.label} onClick={()=>setNewImage('icon:'+p.id)}><GoalIcon id={p.id}/><span>{p.label}</span></button>)}</div></details><button type="button" className="secondary" disabled={draft.categories.length>=60} onClick={addChoice}>Add choice to my list</button>{choiceError&&<p className="error" role="alert">{choiceError}</p>}{notice&&<p className="small" role="status">{notice}</p>}</fieldset>{(invalid || error) && <p className="error" role="alert">{invalid || error}</p>}<button className="primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save my settings'}</button><p className="small">Your reminders and journal are saved only on this device.</p></form></section>;
}
function EditEntry({ entry, categories, busy, error, onBack, onSave, onDelete }: {
    entry: Entry;
    categories: Category[];
    busy: boolean;
    error: string;
    onBack: () => void;
    onSave: (e: Entry) => void;
    onDelete: () => void;
}) {
    const [draft, setDraft] = useState(entry), [when, setWhen] = useState(localInput(new Date(entry.occurredAt))), [confirm, setConfirm] = useState(false), [invalid, setInvalid] = useState('');
    return <section><button className="back" disabled={busy} onClick={onBack}><ArrowLeft size={18}/>Journal</button><h1>Edit this moment.</h1><form onSubmit={e => { e.preventDefault(); const date = new Date(when); if (!Number.isFinite(date.getTime()) || date.getTime() > Date.now() + 60000) {
        setInvalid('Choose a time in the past or present.');
        return;
    } onSave({ ...draft, occurredAt: date.toISOString() }); }}><label className="field">Direction<select value={draft.categoryId} onChange={e => { const c = categories.find(c => c.id === e.target.value); if (c)
        setDraft({ ...draft, categoryId: c.id, categoryLabel: c.label,alternative:undefined }); }}>{!categories.some(c => c.id === draft.categoryId) && <option value={draft.categoryId}>{draft.categoryLabel}</option>}{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label className="field">When<input type="datetime-local" required value={when} max={localInput(new Date())} onChange={e => setWhen(e.target.value)}/></label><fieldset><legend>My choice</legend><div className="segmented"><button type="button" aria-pressed={draft.choice === 'plan'} className={draft.choice === 'plan' ? 'selected' : ''} onClick={() => setDraft({ ...draft, choice: 'plan' })}>My plan</button><button type="button" aria-pressed={draft.choice === 'original'} className={draft.choice === 'original' ? 'selected' : ''} onClick={() => setDraft({ ...draft, choice: 'original',alternative:undefined })}>Carried on</button></div></fieldset><label className="field">Recorded<select value={draft.mode} onChange={e => setDraft({ ...draft, mode: e.target.value as Entry['mode'] })}><option value="moment">Before acting</option><option value="reflection">Afterward</option></select></label>{draft.choice==='plan'&&<label className="field">Step I chose (optional)<input maxLength={1000} value={draft.alternative??''} onChange={e=>setDraft({...draft,alternative:e.target.value.trim()?e.target.value:undefined})}/></label>}<label className="field">Note (optional)<textarea value={draft.note} maxLength={1000} onChange={e => setDraft({ ...draft, note: e.target.value })}/></label>{(invalid || error) && <p role="alert" className="error">{invalid || error}</p>}<button type="submit" className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></form>{confirm ? <div className="delete-confirm"><p>Delete this entry from your journal?</p><button className="danger" disabled={busy} onClick={onDelete}>Delete entry</button><button className="text-button" disabled={busy} onClick={() => setConfirm(false)}>Keep entry</button></div> : <button className="text-button" disabled={busy} onClick={() => setConfirm(true)}>Delete entry</button>}</section>;
}
const recipeIcons = [Moon, Dumbbell, Utensils, Compass];
function Recipe({ settings }: {
    settings: Settings;
}) { return <div className="recipe-list">{settings.recipe.map((item, i) => { const Icon = recipeIcons[i]; return <div className="recipe-item" key={i}><Icon size={21} aria-hidden="true"/><p><strong>{item.title}</strong>{item.detail && <span>{item.detail}</span>}</p></div>; })}</div>; }
