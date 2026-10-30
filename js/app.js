/**
 * LingaloKR — application logic
 * Views (hash-routed): home, learn, practice, numbers, words, settings.
 * The study session (and guided lessons) run in a full-screen overlay on top of the current view.
 * Data: data.js (topics, mnemonics), lessons.js (guided path), korean_class_words.js (class lessons), examples.js, hangul.js.
 */
'use strict';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const hasHangul = s => /[가-힣ㄱ-ㆎ]/.test(s || '');

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Local calendar day helpers. dayNum counts days since 1970 in local time.
const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
const dayFromNum = n => { const d = new Date(n * 86400000); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };

// Lowercase, strip accents, punctuation and spaces so typed answers are compared fairly.
function normalize(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[.,!?'"’()\-]/g, ' ').replace(/\s+/g, ' ').trim();
}
const compact = s => normalize(s).replace(/\s/g, '');

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const STORE_KEY = 'lingalo_stats_v4';
const THEME_KEY = 'lingalo_theme';
const LANG = KOREAN;
const MODES = {
    quiz: { label: 'Quiz', desc: 'Pick the right answer from four choices', icon: 'target' },
    flashcards: { label: 'Flashcards', desc: 'Recall it, flip, then rate yourself', icon: 'cards' },
    listening: { label: 'Listening', desc: 'Hear the word, pick its meaning', icon: 'headphones' },
    typing: { label: 'Typing', desc: 'Type how it sounds from memory', icon: 'keyboard' },
    speedMatch: { label: 'Speed sprint', desc: 'As many as you can in 60 seconds', icon: 'zap' },
    matchPairs: { label: 'Match pairs', desc: 'Connect each word to its meaning', icon: 'grid' },
    speaking: { label: 'Speaking', desc: 'Say each word out loud', icon: 'mic' },
    hangulTyping: { label: 'Hangul typing', desc: 'See the meaning, type it in Hangul', icon: 'keyboard' },
    writing: { label: 'Writing', desc: 'Trace letters stroke by stroke', icon: 'pen' }
};
// Modes that run one exercise kind per item, shared with guided lessons.
const MODE_KIND = { speaking: 'speak', hangulTyping: 'typeko', writing: 'write' };
// Which skill each exercise practices, for the progress panel.
const SKILLS = { reading: 'Reading', recall: 'Recall', listening: 'Listening', speaking: 'Speaking', writing: 'Writing', typing: 'Typing', grammar: 'Grammar' };
const KIND_SKILL = { choice: 'reading', reverse: 'recall', listen: 'listening', speak: 'speaking', write: 'writing', typeko: 'typing', build: 'reading', order: 'grammar', particle: 'grammar', reply: 'grammar' };
const MAX_FREEZES = 2;
const LENGTHS = [10, 15, 25, 0];
const VIEWS = ['home', 'learn', 'practice', 'progress', 'numbers', 'words', 'settings'];
const PASS_PCT = 60;

const defaults = () => ({
    version: 6,
    name: '',
    onboarded: false,
    mastery: {},
    srs: {},
    history: {},
    customList: {},
    guided: {},
    unitTests: {},
    achievements: {},
    skills: {},
    daily: {},
    freezes: 0,
    lifetimeXP: 0,
    totalXP: 0,
    todayXP: 0,
    todayDate: null,
    dailyGoal: 50,
    level: 1,
    streak: 0,
    lastActive: null,
    lastStreakUpdate: null,
    goalCelebrated: null,
    sfxEnabled: true,
    speechRate: 1.0,
    autoAudio: false,
    prefs: { mode: 'quiz', reverse: false, teach: true, hints: true, length: 15, topics: {}, numStyle: 'read', numLevel: 1000, speakEx: true, writeEx: true, typeEx: true }
});

/* ------------------------------------------------------------------ */
/* App state                                                           */
/* ------------------------------------------------------------------ */
const app = {
    lang: LANG,
    view: 'home',
    store: defaults(),
    session: null,
    words: { topic: 'all', status: 'all', query: '' },
    builder: { c: 'ㅎ', v: 'ㅏ', f: 'ㄴ' },
    learnTab: 'course',
    welcomeStep: 1,
    notesQuery: ''
};

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */
function loadProgress() {
    let saved = {};
    try {
        const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem('lingalo_stats_v3') || localStorage.getItem('lingalo_stats_v2');
        if (raw) saved = JSON.parse(raw) || {};
    } catch (e) { /* storage unavailable */ }

    const base = defaults();
    const s = { ...base, ...saved, prefs: { ...base.prefs, ...(saved.prefs || {}) }, version: 6 };
    ['mastery', 'srs', 'history', 'customList', 'guided', 'unitTests', 'achievements', 'skills', 'daily'].forEach(k => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
    if (!s.prefs.topics) s.prefs.topics = {};
    if (!MODES[s.prefs.mode]) s.prefs.mode = 'quiz';

    // Progress from the older single-language QuickHangul app.
    try {
        const old = JSON.parse(localStorage.getItem('quickhangul_stats') || 'null');
        if (old && old.mastery && !s.mastery.korean) s.mastery.korean = old.mastery;
        if (old && old.customList && !s.customList.korean) s.customList.korean = old.customList;
    } catch (e) { /* ignore bad legacy data */ }

    const today = new Date().toDateString();
    const lastDay = s.todayDate || s.lastActive;
    if (lastDay && lastDay !== today) s.todayXP = 0;
    s.todayDate = today;
    s.lastActive = today;
    // XP earned over all time, for achievements. Older saves only have XP within the current level.
    if (!s.lifetimeXP && (s.level > 1 || s.totalXP)) s.lifetimeXP = s.totalXP + (s.level - 1) * s.level * 50;
    // One missed day can be covered by a streak freeze; any longer gap resets the streak.
    if (s.lastStreakUpdate) {
        const gap = dayNum(new Date(today)) - dayNum(new Date(s.lastStreakUpdate));
        if (gap === 2 && s.freezes > 0 && s.streak > 0) {
            s.freezes--;
            s.lastStreakUpdate = dayFromNum(dayNum(new Date(today)) - 1).toDateString();
            app.freezeUsed = true;
        } else if (gap > 1) s.streak = 0;
    }

    if (!s.mastery.korean) s.mastery.korean = {};
    if (!s.srs.korean) s.srs.korean = {};
    if (!s.customList.korean) s.customList.korean = {};
    app.store = s;
}

function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(app.store)); } catch (e) { /* storage full or blocked */ }
    renderHeaderStats();
}

const masteryMap = () => app.store.mastery.korean;
const deck = () => app.store.srs.korean;
const masteryOf = id => masteryMap()[id] || 0;

function logActivity({ xp = 0, correct = 0, total = 0 }) {
    const k = dateKey();
    const h = app.store.history[k] || (app.store.history[k] = { xp: 0, correct: 0, total: 0 });
    h.xp += xp;
    h.correct += correct;
    h.total += total;
}

function addXP(amount) {
    const s = app.store;
    const now = new Date();
    const today = now.toDateString();
    if (s.todayDate !== today) { s.todayXP = 0; s.todayDate = today; }

    s.totalXP += amount;
    s.todayXP += amount;
    s.lifetimeXP = (s.lifetimeXP || 0) + amount;
    logActivity({ xp: amount });
    if (app.session) app.session.xp += amount;

    if (s.lastStreakUpdate !== today) {
        const gap = s.lastStreakUpdate ? dayNum(now) - dayNum(new Date(s.lastStreakUpdate)) : 99;
        s.streak = gap === 1 ? (s.streak || 0) + 1 : 1;
        s.lastStreakUpdate = today;
        // Every 7 days of streak earns a freeze that covers one missed day.
        if (s.streak % 7 === 0 && (s.freezes || 0) < MAX_FREEZES) {
            s.freezes = (s.freezes || 0) + 1;
            toast(`${s.streak}-day streak! You earned a streak freeze.`, 'success');
        }
    }

    let leveled = false;
    while (s.totalXP >= s.level * 100) {
        s.totalXP -= s.level * 100;
        s.level++;
        leveled = true;
    }
    if (leveled) {
        SFX.levelUp();
        confetti();
        toast(`Level up! You're now level ${s.level}.`, 'success');
    }
    if (s.todayXP >= s.dailyGoal && s.goalCelebrated !== today) {
        s.goalCelebrated = today;
        toast('Daily goal reached. Nice work!', 'success');
        if (!leveled) confetti();
    }
    save();
}

function bumpMastery(item, delta) {
    if (item.gen) return;
    const m = masteryMap();
    m[item.id] = Math.max(0, Math.min(5, (m[item.id] || 0) + delta));
}

/* ------------------------------------------------------------------ */
/* Spaced repetition                                                   */
/* ------------------------------------------------------------------ */
// Each word gets a review date. Right answers push it further out
// (1 day, 3 days, then interval × ease); a miss brings it back today.
function schedule(item, rating) {
    if (item.gen) return;
    const t = dayNum();
    const d = deck();
    const c = d[item.id] || { ivl: 0, ease: 2.5, due: t };
    if (rating === 'again') {
        c.ivl = 0;
        c.ease = Math.max(1.3, c.ease - 0.2);
        c.due = t;
    } else if (c.due <= t) {
        // Only words that are due move forward; practicing early doesn't stretch the interval.
        const easy = rating === 'easy';
        let ivl;
        if (c.ivl === 0) ivl = easy ? 4 : 1;
        else if (c.ivl === 1) ivl = easy ? 6 : 3;
        else ivl = Math.round(c.ivl * c.ease * (easy ? 1.3 : 1));
        if (easy) c.ease = Math.min(3, c.ease + 0.15);
        c.ivl = Math.min(365, ivl);
        c.due = t + c.ivl;
    }
    d[item.id] = c;
}

const isDue = (item, t = dayNum()) => { const c = deck()[item.id]; return !!c && c.due <= t; };
const isNew = item => !deck()[item.id];

/* ------------------------------------------------------------------ */
/* Curriculum model                                                    */
/* ------------------------------------------------------------------ */
let topicCache = null;

function makeItem(topic, key, value) {
    if (topic.chars) return { id: key, key, rom: value, def: value, isChar: true, topic: topic.id };
    const [rom, def, note] = Array.isArray(value) ? value : [value.rom, value.def, value.note];
    return {
        id: topic.idPrefix ? `${topic.idPrefix}:${key}` : key,
        key,
        rom: rom || (hasHangul(key) ? Hangul.romanize(key) : ''),
        def: def || '',
        note: (note || '').trim(),
        topic: topic.id
    };
}

function getTopics() {
    if (topicCache) return topicCache;
    const topics = TOPICS.map(t => ({ ...t, items: Object.entries(t.words).map(([k, v]) => makeItem(t, k, v)) }));
    (typeof KOREAN_CLASS_LESSONS !== 'undefined' ? KOREAN_CLASS_LESSONS : []).forEach(l => {
        const t = { id: `class_${l.id}`, label: l.id === '읽기' ? 'Reading' : `Lesson ${parseInt(l.id, 10)}`, sub: l.theme, group: 'Class lessons' };
        t.items = l.words.map(w => makeItem(t, w.word, [w.rom, w.def, w.note]));
        topics.push(t);
    });
    const custom = { id: 'custom', label: 'My words', sub: 'Words you added yourself', group: 'My words' };
    custom.items = Object.entries(app.store.customList.korean).map(([k, v]) => makeItem(custom, k, [v.rom && v.rom !== v.def ? v.rom : '', v.def]));
    topics.push(custom);
    topicCache = topics;
    return topics;
}
const invalidateTopics = () => { topicCache = null; };

function uniqueItems(lists) {
    const seen = new Set();
    const out = [];
    lists.flat().forEach(i => { if (!seen.has(i.id)) { seen.add(i.id); out.push(i); } });
    return out;
}

const allItems = () => uniqueItems(getTopics().map(t => t.items));
const topicById = id => getTopics().find(t => t.id === id);
const poolFor = ids => uniqueItems(ids.map(id => (topicById(id) || { items: [] }).items));
const exampleFor = item => (item.gen ? null : EXAMPLES[item.id] || (item.id === item.key ? EXAMPLES[item.key] : null));

/* ------------------------------------------------------------------ */
/* Mnemonics and syllable blocks                                       */
/* ------------------------------------------------------------------ */
const mnemonicFor = item => (item && item.isChar ? MNEMONICS[item.key] || null : null);

// "*G*un" → "<strong>G</strong>un", escaped. Used by mnemonics and lesson notes.
const richText = text => esc(text).replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

function mnemonicLine(item, cls = '') {
    const mn = mnemonicFor(item);
    return mn ? `<div class="mnemonic ${cls}"><span class="mnemonic-sound">${esc(mn[0])}</span><span>${richText(mn[1])}</span></div>` : '';
}

// A single letter read aloud gives its name (ㄱ = "giyeok"), so letters are spoken
// inside a syllable instead: consonants with ㅏ, vowels after a silent ㅇ.
const sampleSyllable = letter => Hangul.join(letter, 'ㅏ') || Hangul.join('ㅇ', letter) || letter;
const speakItem = item => speak(item.isChar ? sampleSyllable(item.key) : item.key);

// Where the vowel sits decides the block's shape: right of the consonant, under it, or both.
const blockShape = vowel => ('ㅏㅐㅑㅒㅓㅔㅕㅖㅣ'.includes(vowel) ? 'side' : 'ㅗㅛㅜㅠㅡ'.includes(vowel) ? 'under' : 'wrap');

// A syllable drawn as its parts in their slots, with "ㄱ + ㅏ + ㅇ = 강" underneath.
function blockDiagram(syl, { speakable = true } = {}) {
    const p = Hangul.split(syl);
    if (!p) return '';
    const part = (ch, role, label) => `<span class="part part-${role}"><span class="lang-text">${esc(ch)}</span><small>${label}</small></span>`;
    const sum = [
        `<span class="tone-c">${esc(p.initial)}</span>${p.initial === 'ㅇ' ? '<small> (silent)</small>' : ''}`,
        `<span class="tone-v">${esc(p.vowel)}</span>`,
        p.final ? `<span class="tone-f">${esc(p.final)}</span>` : ''
    ].filter(Boolean).join(' + ');
    return `<figure class="block-demo" ${speakable ? `data-action="speak" data-text="${esc(syl)}" role="button" tabindex="0" aria-label="Play ${esc(syl)}"` : ''}>
        <div class="block block-${blockShape(p.vowel)} ${p.final ? 'has-final' : ''}">
            ${part(p.initial, 'c', p.initial === 'ㅇ' ? 'silent' : 'consonant')}${part(p.vowel, 'v', 'vowel')}${p.final ? part(p.final, 'f', 'final') : ''}
        </div>
        <figcaption><span class="lang-text">${sum} = <strong>${esc(syl)}</strong></span><span class="muted small">${esc(Hangul.romanize(syl))}</span></figcaption>
    </figure>`;
}

/* ------------------------------------------------------------------ */
/* Guided path                                                         */
/* ------------------------------------------------------------------ */
const unitMeta = name => UNITS.find(u => u.name === name) || {};
// The main course; optional units (the class track) sit beside it.
const courseLessons = () => LESSONS.filter(l => !unitMeta(l.unit).optional);
const unitLessons = unit => LESSONS.filter(l => l.unit === unit);
const lessonDone = id => !!app.store.guided[id];
const nextLesson = () => courseLessons().find(l => !lessonDone(l.id)) || null;
const nextClassLesson = () => LESSONS.find(l => unitMeta(l.unit).optional && !lessonDone(l.id)) || null;
const trackOf = lesson => (unitMeta(lesson.unit).optional ? unitLessons(lesson.unit) : courseLessons());
const lessonNumber = lesson => trackOf(lesson).indexOf(lesson) + 1;

function lessonAfter(id) {
    const track = trackOf(lessonById(id));
    return track[track.indexOf(lessonById(id)) + 1] || null;
}

// A unit test is a lesson made of every item in the unit. Its id is "test:<unit>".
function lessonById(id) {
    if (String(id).startsWith('test:')) {
        const unit = id.slice(5);
        const ls = unitLessons(unit);
        return { id, unit, title: `${unit} test`, test: true, items: ls.flatMap(l => l.items), build: ls.flatMap(l => l.build || []), concepts: ls.flatMap(l => l.concepts || []) };
    }
    return LESSONS.find(l => l.id === id);
}

function lessonItems(lesson) {
    return uniqueItems(lesson.items.map(([topicId, keys]) => {
        const topic = topicById(topicId);
        return topic ? keys.map(k => topic.items.find(i => i.key === k)).filter(Boolean) : [];
    }));
}

function lessonNoun(lesson) {
    const items = lessonItems(lesson);
    if (lesson.items[0][0] === 'syllables') return 'syllable';
    if (items.every(i => i.isChar)) return 'letter';
    return items.some(i => i.key.trim().includes(' ')) ? 'phrase' : 'word';
}

function statsFor(items) {
    const m = masteryMap();
    const t = dayNum();
    let mastered = 0, due = 0, seen = 0;
    items.forEach(i => {
        if ((m[i.id] || 0) >= 4) mastered++;
        if (deck()[i.id]) { seen++; if (deck()[i.id].due <= t) due++; }
    });
    return { total: items.length, mastered, due, seen, pct: items.length ? Math.round(mastered / items.length * 100) : 0 };
}

// allowEmpty: the Practice screen may show an empty selection while editing;
// everywhere else falls back to the first topic.
function selectedTopicIds(allowEmpty = false) {
    const saved = app.store.prefs.topics.korean;
    if (Array.isArray(saved)) {
        const valid = new Set(getTopics().map(t => t.id));
        const ids = saved.filter(id => valid.has(id));
        if (ids.length || allowEmpty) return ids;
    }
    return ['consonants'];
}

function setSelectedTopics(ids) {
    app.store.prefs.topics.korean = ids;
    save();
}

/* ------------------------------------------------------------------ */
/* Number drills                                                       */
/* ------------------------------------------------------------------ */
const fmt = n => n.toLocaleString('en-US');
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COUNTERS = [
    ['개', 'item', 'items'], ['명', 'person', 'people'], ['마리', 'animal', 'animals'],
    ['잔', 'cup', 'cups'], ['권', 'book', 'books'], ['병', 'bottle', 'bottles'], ['장', 'ticket', 'tickets']
];

function sinoValue(max) {
    const digits = rand(1, Math.max(1, String(max).length - 1));
    const n = digits === 1 ? rand(0, 9) : rand(10 ** (digits - 1), Math.min(max, 10 ** digits - 1));
    return n;
}

function nearNumbers(n, min, max) {
    const s = String(n);
    const swapped = s.length > 1 ? Number(s.slice(0, -2) + s.slice(-1) + s.slice(-2, -1)) : n + 2;
    return shuffle([n + 1, n - 1, n + 10, n - 10, n * 10, Math.floor(n / 10), swapped, n + 100, n - 100])
        .filter(v => v !== n && v >= min && v <= max);
}

// Each drill makes a value, turns it into a Korean reading, and suggests near-miss values for wrong choices.
const DRILLS = {
    sino: {
        label: 'Sino-Korean numbers', desc: 'Prices, phone numbers, floors, minutes', sample: 37, levels: true,
        value: lvl => sinoValue(lvl),
        make: n => ({ key: Hangul.sino(n), def: fmt(n), num: String(n) }),
        near: (n, lvl) => nearNumbers(n, 0, lvl)
    },
    native: {
        label: 'Native Korean 1–99', desc: 'The counting numbers: 하나, 둘, 셋…', sample: 24,
        value: () => rand(1, 99),
        make: n => ({ key: Hangul.native(n), def: String(n), num: String(n) }),
        near: n => nearNumbers(n, 1, 99)
    },
    won: {
        label: 'Prices in won', desc: 'Sino-Korean numbers + 원', sample: 4500,
        value: () => pick([rand(1, 9) * 100, rand(1, 19) * 500, rand(1, 99) * 1000, rand(10, 99) * 1000 + pick([0, 500])]),
        make: n => ({ key: `${Hangul.sino(n)} 원`, def: `₩${fmt(n)}`, num: String(n) }),
        near: n => nearNumbers(n, 100, 1000000).filter(v => v % 100 === 0)
    },
    time: {
        label: 'Telling time', desc: 'Native hours (시) + Sino minutes (분)', sample: { h: 3, m: 30 },
        value: () => ({ h: rand(1, 12), m: pick([0, 0, 5, 10, 15, 20, 30, 30, 40, 45, 50, 55]) }),
        make: v => ({
            key: `${Hangul.nativeCounter(v.h)} 시${v.m ? ` ${Hangul.sino(v.m)} 분` : ''}`,
            def: `${v.h}:${String(v.m).padStart(2, '0')}`,
            num: `${v.h}${String(v.m).padStart(2, '0')}`
        }),
        near: v => [{ h: v.h % 12 + 1, m: v.m }, { h: v.h, m: (v.m + 10) % 60 }, { h: (v.h + 10) % 12 + 1, m: v.m }, { h: v.h, m: (v.m + 30) % 60 }]
    },
    count: {
        label: 'Counting & age', desc: 'Native counter forms: 한 개, 두 명, 스무 살', sample: { n: 3, c: 0 },
        value: () => (Math.random() < 0.3 ? { n: rand(1, 99), c: -1 } : { n: rand(1, 20), c: rand(0, COUNTERS.length - 1) }),
        make: v => {
            if (v.c < 0) return { key: `${Hangul.nativeCounter(v.n)} 살`, def: `${v.n} years old`, num: String(v.n) };
            const [counter, one, many] = COUNTERS[v.c];
            return { key: `${Hangul.nativeCounter(v.n)} ${counter}`, def: `${v.n} ${v.n === 1 ? one : many}`, num: String(v.n) };
        },
        near: v => [{ ...v, n: v.n + 1 }, { ...v, n: Math.max(1, v.n - 1) }, { ...v, n: Math.min(99, v.n + 10) }, v.c >= 0 ? { ...v, c: (v.c + 1) % COUNTERS.length } : { ...v, n: Math.max(1, v.n - 10) }]
    },
    dates: {
        label: 'Dates', desc: 'Months and days, including 유월 and 시월', sample: { mo: 6, d: 15 },
        value: () => ({ mo: rand(1, 12), d: rand(1, 31) }),
        make: v => ({ key: `${Hangul.months[v.mo]} ${Hangul.sino(v.d)} 일`, def: `${MONTH_NAMES[v.mo]} ${v.d}`, num: `${v.mo}${String(v.d).padStart(2, '0')}` }),
        near: v => [{ mo: v.mo % 12 + 1, d: v.d }, { mo: v.mo, d: v.d % 31 + 1 }, { mo: (v.mo + 5) % 12 + 1, d: v.d }, { mo: v.mo, d: Math.max(1, v.d - 10) }]
    }
};

function genItem(drillId, value, lvl) {
    const drill = DRILLS[drillId];
    const made = drill.make(value);
    const alts = drill.near(value, lvl).map(drill.make).filter(a => a.key && a.key !== made.key);
    return { ...made, id: `gen:${made.key}`, rom: Hangul.numberRom(made.key), gen: true, alts, topic: drillId };
}

function makeDrillItems(drillId, count) {
    const lvl = app.store.prefs.numLevel;
    const items = new Map();
    let guard = 0;
    while (items.size < count && guard++ < count * 20) {
        const it = genItem(drillId, DRILLS[drillId].value(lvl), lvl);
        if (it.key && !items.has(it.key)) items.set(it.key, it);
    }
    return [...items.values()];
}

/* ------------------------------------------------------------------ */
/* Audio, haptics, confetti                                            */
/* ------------------------------------------------------------------ */
const SFX = {
    ctx: null,
    play(freq, type, dur, gain = 0.1) {
        if (app.store.sfxEnabled === false) return;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            this.ctx = this.ctx || new Ctx();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            g.gain.setValueAtTime(gain, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + dur);
        } catch (e) { /* audio unavailable */ }
    },
    correct() { this.play(659, 'sine', 0.12, 0.12); setTimeout(() => this.play(880, 'sine', 0.22, 0.12), 80); },
    wrong() { this.play(260, 'triangle', 0.18, 0.12); setTimeout(() => this.play(196, 'triangle', 0.25, 0.12), 100); },
    match() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.play(f, 'sine', 0.15, 0.1), i * 80)); },
    levelUp() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.play(f, 'triangle', 0.2, 0.15), i * 100)); }
};

function haptic(type) {
    if (!navigator.vibrate) return;
    navigator.vibrate(type === 'success' ? 12 : [40, 30, 40]);
}

const koreanVoice = () => (window.speechSynthesis ? window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('ko')) : null);

function speak(text) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = LANG.speechLang;
    utt.rate = app.store.speechRate || 1;
    const voice = koreanVoice();
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
}

function confetti(x = window.innerWidth / 2, y = window.innerHeight / 3) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = [LANG.accent, '#12b76a', '#f79009', '#2e90fa', '#7a5af8'];
    for (let i = 0; i < 26; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        const size = 4 + Math.random() * 7;
        Object.assign(p.style, {
            left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px',
            background: colors[i % colors.length], borderRadius: Math.random() > 0.5 ? '50%' : '2px'
        });
        document.body.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 140;
        p.animate([
            { transform: 'translate(0,0) rotate(0)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 30}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.12,.8,.32,1)' }).onfinish = () => p.remove();
    }
}

/* ------------------------------------------------------------------ */
/* Toasts & dialogs                                                    */
/* ------------------------------------------------------------------ */
function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${type === 'success' ? icon('check') : type === 'error' ? icon('x') : ''}<span>${esc(message)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 250); }, 3200);
}

function confirmDialog({ title, body, confirm = 'Confirm', danger = false }) {
    const dlg = $('#confirm-dialog');
    $('#confirm-title').textContent = title;
    $('#confirm-body').textContent = body;
    const ok = $('#confirm-ok');
    ok.textContent = confirm;
    ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    return new Promise(resolve => {
        dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
        dlg.returnValue = '';
        dlg.showModal();
    });
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */
function themePref() {
    try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; }
}

function applyTheme(pref = themePref()) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) { /* ignore */ }
    const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#0d1117' : '#f6f7f9';
}

/* ------------------------------------------------------------------ */
/* Routing                                                             */
/* ------------------------------------------------------------------ */
function currentRoute() {
    const v = location.hash.replace(/^#\/?/, '').split('?')[0];
    return VIEWS.includes(v) ? v : 'home';
}

function renderView() {
    app.view = currentRoute();
    VIEWS.forEach(v => { $(`#view-${v}`).hidden = v !== app.view; });
    $$('[data-nav]').forEach(a => {
        const on = a.dataset.nav === app.view;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    ({ home: renderHome, learn: renderLearn, practice: renderPractice, progress: renderProgress, numbers: renderNumbers, words: renderWords, settings: renderSettings })[app.view]();
    renderHeaderStats();
}

function go(view) {
    if (currentRoute() === view && location.hash) renderView();
    else location.hash = `/${view}`;
    window.scrollTo({ top: 0 });
}

function renderHeaderStats() {
    $('#hdr-streak').textContent = app.store.streak || 0;
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */
function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function progressRing(value, max, size = 120) {
    const r = (size - 12) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.min(1, max ? value / max : 0);
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-track"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fill" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/>
    </svg>`;
}

const bar = pct => `<div class="bar"><span style="width:${pct}%"></span></div>`;

/* First visit: ask for a name, then where to start. */
function renderWelcome() {
    const s = app.store;
    document.body.classList.add('is-welcome');
    const step = app.welcomeStep || 1;
    const name = s.name;
    $('#view-home').innerHTML = step === 1 ? `
        <section class="welcome">
            <div class="welcome-mark"><img src="assets/logo.png" alt=""></div>
            <p class="welcome-hello lang-text">안녕하세요!</p>
            <h1>Welcome to LingaloKR</h1>
            <p class="lead">Learn to read, speak and understand Korean, a few minutes a day.</p>
            <form class="welcome-form" data-form="welcome-name" autocomplete="on">
                <label for="welcome-name">What should we call you?</label>
                <input id="welcome-name" name="given-name" autocomplete="given-name" maxlength="30" placeholder="Your name" value="${esc(name)}" required>
                <button type="submit" class="btn btn-primary btn-lg btn-block">Continue ${icon('arrow-right', 'icon-sm')}</button>
            </form>
            <button type="button" class="link-btn welcome-skip" data-action="welcome-skip">Skip for now</button>
        </section>` : `
        <section class="welcome">
            <h1>${name ? `Nice to meet you, ${esc(name)}!` : 'Nice to meet you!'}</h1>
            <p class="lead">Where would you like to start?</p>
            <div class="start-choices">
                <button type="button" class="start-choice" data-action="welcome-start" data-start="new">
                    <span class="mode-icon">${icon('learn')}</span>
                    <span><strong>I'm completely new</strong><small>Start with the Korean alphabet. Lesson 1 takes about 5 minutes.</small></span>
                    ${icon('arrow-right', 'icon-sm')}
                </button>
                <button type="button" class="start-choice" data-action="welcome-start" data-start="test">
                    <span class="mode-icon">${icon('target')}</span>
                    <span><strong>I can already read Hangul</strong><small>Take a 15-question test and skip ahead if you pass.</small></span>
                    ${icon('arrow-right', 'icon-sm')}
                </button>
                <button type="button" class="start-choice" data-action="welcome-start" data-start="look">
                    <span class="mode-icon">${icon('home')}</span>
                    <span><strong>Just look around</strong><small>Go to your home screen. You can start a lesson any time.</small></span>
                    ${icon('arrow-right', 'icon-sm')}
                </button>
            </div>
        </section>`;
    if (step === 1) setTimeout(() => { const el = $('#welcome-name'); if (el) el.focus(); }, 50);
}

const hasProgress = () => Object.keys(app.store.guided).length > 0 || Object.keys(app.store.history).length > 0;

function welcomeNext(name) {
    app.store.name = name;
    save();
    if (hasProgress()) { finishWelcome('look'); return; }
    app.welcomeStep = 2;
    renderWelcome();
}

function finishWelcome(start) {
    app.store.onboarded = true;
    save();
    document.body.classList.remove('is-welcome');
    if (start === 'new') startLesson(LESSONS[0].id, 'lesson');
    else if (start === 'test') actions['start-test']({ dataset: { unit: 'Read Hangul' } });
    renderView();
}

function renderHome() {
    const s = app.store;
    if (!s.onboarded) { renderWelcome(); return; }
    document.body.classList.remove('is-welcome');

    const steps = planSteps();
    const next = steps.find(st => !st.done);
    const left = steps.filter(st => !st.done).length;
    const started = Object.values(planState()).some(Boolean);
    const st = statsFor(allItems());
    const course = courseLessons();
    const doneLessons = course.filter(l => lessonDone(l.id)).length;
    const nl = nextLesson();
    const earned = ACHIEVEMENTS.filter(a => s.achievements[a.id]).length;
    const goalLeft = Math.max(0, s.dailyGoal - s.todayXP);

    $('#view-home').innerHTML = `
        <section class="home-hero">
            <div class="home-main">
                <h1>${greeting()}${s.name ? `, ${esc(s.name)}` : ''}.</h1>
                <p class="lead">${next ? `Here's your plan for today: about ${left * 5} minutes.` : steps.length ? "You've finished today's plan. 수고했어요!" : 'Nothing scheduled right now. Practice anything you like.'}</p>
                <ol class="plan-steps" aria-label="Today's plan">${steps.map(x => `
                    <li class="${x.done ? 'is-done' : ''} ${x === next ? 'is-current' : ''}">
                        <span class="plan-check">${x.done ? icon('check', 'icon-sm') : icon(x.icon, 'icon-sm')}</span>
                        <span><strong>${esc(x.label)}</strong><small>${x.done ? 'Done' : esc(x.sub)}</small></span>
                    </li>`).join('')}
                </ol>
                <div class="hero-actions">
                    ${next
                        ? `<button type="button" class="btn btn-primary btn-lg" data-action="plan-start">${icon('play')}${started ? 'Continue' : 'Start'}</button>`
                        : `<a class="btn btn-primary btn-lg" href="#/practice">${icon('zap')}Practice more</a>`}
                </div>
            </div>
            <aside class="home-side" aria-label="Today">
                <div class="ring-wrap">
                    ${progressRing(s.todayXP, s.dailyGoal)}
                    <div class="ring-label"><strong>${s.todayXP}</strong><span>/ ${s.dailyGoal} XP</span></div>
                </div>
                <div class="goal-text">
                    <strong>${goalLeft ? 'Daily goal' : 'Goal reached!'}</strong>
                    <span>${goalLeft ? `${goalLeft} XP to go` : 'Great job today'}</span>
                </div>
                <div class="home-streak">${icon('flame', 'icon-sm')}<strong>${plural(s.streak || 0, 'day')}</strong> streak${s.freezes ? ` · ${icon('shield', 'icon-sm')}${s.freezes} ${s.freezes === 1 ? 'freeze' : 'freezes'}` : ''}</div>
            </aside>
        </section>

        <section class="home-cards" aria-label="Shortcuts">
            <a class="home-card" href="#/learn">
                <span class="mode-icon">${icon('learn')}</span>
                <span class="home-card-body">
                    <strong>Course</strong>
                    <small>${nl ? `Next: ${esc(nl.title)}` : 'Every lesson done!'}</small>
                    ${bar(Math.round(doneLessons / course.length * 100))}
                    <small>${doneLessons} of ${course.length} lessons</small>
                </span>
            </a>
            <a class="home-card" href="#/words">
                <span class="mode-icon">${icon('book')}</span>
                <span class="home-card-body">
                    <strong>Words</strong>
                    <small>${st.seen ? `${st.mastered} mastered${st.due ? ` · ${st.due} due` : ''}` : 'Browse every word and add your own'}</small>
                </span>
            </a>
            <a class="home-card" href="#/progress">
                <span class="mode-icon">${icon('trophy')}</span>
                <span class="home-card-body">
                    <strong>Progress</strong>
                    <small>Level ${s.level} · ${earned} of ${ACHIEVEMENTS.length} achievements</small>
                </span>
            </a>
        </section>`;
}

function renderProgress() {
    const s = app.store;
    const st = statsFor(allItems());
    const xpNeeded = s.level * 100;
    $('#view-progress').innerHTML = `
        <header class="page-head">
            <h1>Progress</h1>
            <p class="lead">Your streak, level, skills and achievements.</p>
        </header>
        <section class="stat-grid">
            <div class="stat">
                <span class="stat-label">Streak</span>
                <span class="stat-value">${s.streak || 0}<small> ${s.streak === 1 ? 'day' : 'days'}</small></span>
                <span class="muted small freeze-note" title="A freeze covers one missed day. Earn one every 7 days of streak (up to ${MAX_FREEZES}).">${icon('shield', 'icon-sm')}${plural(s.freezes || 0, 'streak freeze')}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Level ${s.level}</span>
                <span class="stat-value">${s.totalXP}<small> / ${xpNeeded} XP</small></span>
                ${bar(Math.round(s.totalXP / xpNeeded * 100))}
            </div>
            <div class="stat">
                <span class="stat-label">Mastered</span>
                <span class="stat-value">${st.mastered}<small> / ${st.total}</small></span>
                ${bar(st.pct)}
            </div>
            <div class="stat">
                <span class="stat-label">Due today</span>
                <span class="stat-value ${st.due ? 'warn' : ''}">${st.due}</span>
                <span class="muted small">Spaced review keeps words fresh</span>
            </div>
        </section>
        ${renderActivity()}
        ${progressPanel()}
        ${achievementsPanel()}`;
}

/* Activity: XP per day for the last 14 days, plus a 15-week practice calendar. */
function renderActivity() {
    const h = app.store.history;
    const today = dayNum();
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = dayFromNum(today - 13 + i);
        return { d, ...(h[dateKey(d)] || { xp: 0, correct: 0, total: 0 }) };
    });
    const max = Math.max(app.store.dailyGoal, ...days.map(x => x.xp));
    const W = 560, H = 150, padB = 22, padT = 8, gap = 2;
    const bw = W / days.length;
    const scale = v => (v / max) * (H - padB - padT);
    const goalY = H - padB - scale(app.store.dailyGoal);
    const week = days.slice(-7);
    const weekXP = week.reduce((a, x) => a + x.xp, 0);
    const weekCorrect = week.reduce((a, x) => a + x.correct, 0);
    const weekTotal = week.reduce((a, x) => a + x.total, 0);
    const activeDays = Object.values(h).filter(x => x.xp > 0).length;
    const tip = x => `${x.d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}|${x.xp} XP${x.total ? ` · ${x.correct}/${x.total} correct` : ''}`;

    const bars = days.map((x, i) => {
        const bh = scale(x.xp);
        const xPos = i * bw + gap;
        const w = bw - gap * 2;
        const y = H - padB - bh;
        const r = Math.min(4, bh, w / 2);
        const shape = bh > 0
            ? `<path class="xp-bar ${i === 13 ? 'is-today' : ''}" d="M${xPos},${H - padB} V${y + r} Q${xPos},${y} ${xPos + r},${y} H${xPos + w - r} Q${xPos + w},${y} ${xPos + w},${y + r} V${H - padB} Z"/>`
            : '';
        const label = i % 2 === 1 || i === 13 ? `<text class="axis-label" x="${xPos + w / 2}" y="${H - 6}" text-anchor="middle">${i === 13 ? 'Today' : x.d.toLocaleDateString(undefined, { weekday: 'narrow' })}</text>` : '';
        return `<g>${shape}${label}<rect class="hit" x="${i * bw}" y="0" width="${bw}" height="${H - padB}" data-tip="${esc(tip(x))}"/></g>`;
    }).join('');

    // Calendar: columns are weeks (Sunday first), rows are days.
    const weeks = 15;
    const endDay = dayFromNum(today);
    const start = today - endDay.getDay() - (weeks - 1) * 7;
    const level = xp => (xp <= 0 ? 0 : xp < app.store.dailyGoal * 0.34 ? 1 : xp < app.store.dailyGoal * 0.67 ? 2 : xp < app.store.dailyGoal ? 3 : 4);
    let cells = '';
    for (let w = 0; w < weeks; w++) {
        for (let d = 0; d < 7; d++) {
            const n = start + w * 7 + d;
            if (n > today) continue;
            const date = dayFromNum(n);
            const rec = h[dateKey(date)] || { xp: 0, correct: 0, total: 0 };
            cells += `<span class="cal-cell l${level(rec.xp)}" style="grid-column:${w + 1};grid-row:${d + 1}" data-tip="${esc(tip({ d: date, ...rec }))}"></span>`;
        }
    }

    return `<section class="section">
        <div class="section-head"><h2>Activity</h2></div>
        <div class="activity">
            <div class="panel chart-panel">
                <div class="chart-head">
                    <div><strong>XP per day</strong><span class="muted small">Last 14 days</span></div>
                    <div class="chart-kpis">
                        <span><strong>${weekXP}</strong> XP this week</span>
                        <span><strong>${weekTotal ? Math.round(weekCorrect / weekTotal * 100) + '%' : '–'}</strong> accuracy</span>
                    </div>
                </div>
                <div class="chart-wrap">
                    <svg class="xp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="XP earned per day over the last 14 days. ${weekXP} XP this week.">
                        <line class="baseline" x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}"/>
                        <line class="goal-line" x1="0" x2="${W}" y1="${goalY}" y2="${goalY}"/>
                        ${bars}
                    </svg>
                    <span class="goal-tag" style="top:${(goalY / H) * 100}%">Goal ${app.store.dailyGoal}</span>
                </div>
            </div>
            <div class="panel chart-panel">
                <div class="chart-head">
                    <div><strong>Practice calendar</strong><span class="muted small">${plural(activeDays, 'day')} practiced</span></div>
                </div>
                <div class="calendar" role="img" aria-label="Calendar of days practiced over the last ${weeks} weeks">${cells}</div>
                <div class="cal-legend muted small">Less ${[0, 1, 2, 3, 4].map(l => `<span class="cal-cell l${l}"></span>`).join('')} More · darkest = goal met</div>
            </div>
        </div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* Learn (guided path)                                                 */
/* ------------------------------------------------------------------ */
// One tappable row per lesson: the whole row opens it.
function lessonRow(lesson, n, upNext) {
    const rec = app.store.guided[lesson.id];
    const state = rec ? 'is-done' : upNext ? 'is-next' : '';
    const meta = `${plural(lessonItems(lesson).length, lessonNoun(lesson))}${rec ? (rec.tested ? ' · passed by test' : ` · best ${rec.best}%`) : ''}`;
    return `<li>
        <button type="button" class="lesson ${state}" data-action="start-lesson" data-lesson="${lesson.id}">
            <span class="lesson-num" aria-hidden="true">${rec ? icon('check', 'icon-sm') : n}</span>
            <span class="lesson-body">
                <strong>${esc(lesson.title)}${rec ? '<span class="sr-only"> (done)</span>' : ''}</strong>
                <span class="lesson-desc lang-text">${esc(lesson.desc)}</span>
                <span class="muted small">${meta}</span>
            </span>
            <span class="lesson-go">${upNext ? 'Start' : rec ? 'Review' : ''}${icon('arrow-right', 'icon-sm')}</span>
        </button>
    </li>`;
}

function letterTile(item) {
    const mn = mnemonicFor(item);
    return `<button type="button" class="letter-tile" data-action="speak" data-text="${esc(sampleSyllable(item.key))}" aria-label="Play ${esc(item.key)}">
        <span class="letter-key lang-text">${esc(item.key)}</span>
        <span class="letter-sound">${esc(mn ? mn[0] : item.rom)}</span>
        ${mn ? `<span class="letter-mn">${richText(mn[1])}</span>` : ''}
    </button>`;
}

// A unit is a collapsible list; only the unit you're working on starts open.
function unitSection(u, ui, next) {
    const ls = unitLessons(u.name);
    const udone = ls.filter(l => lessonDone(l.id)).length;
    const test = app.store.unitTests[u.name];
    const open = !u.optional && (next ? ls.includes(next) : ui === 0);
    const testRow = u.optional ? '' : `<li>
        <button type="button" class="lesson lesson-test ${test ? 'is-done' : ''}" data-action="start-test" data-unit="${esc(u.name)}">
            <span class="lesson-num" aria-hidden="true">${test ? icon('check', 'icon-sm') : icon('target', 'icon-sm')}</span>
            <span class="lesson-body">
                <strong>Unit test</strong>
                <span class="muted small">15 questions · pass ${UNIT_PASS_PCT}% to complete the whole unit${test ? ` · best ${test.best}%` : ''}</span>
            </span>
            <span class="lesson-go">${test ? 'Retake' : 'Take test'}${icon('arrow-right', 'icon-sm')}</span>
        </button>
    </li>`;
    return `<details class="unit" ${open ? 'open' : ''}>
        <summary class="unit-head">
            <span class="step" aria-hidden="true">${u.optional ? icon('book', 'icon-sm') : udone === ls.length ? icon('check', 'icon-sm') : ui + 1}</span>
            <span class="unit-title"><strong>${esc(u.name)}</strong><small>${esc(u.desc)}</small></span>
            <span class="muted small unit-count">${udone} / ${ls.length}</span>
            ${icon('chevron-down', 'icon-sm summary-chevron')}
        </summary>
        <ol class="lesson-list">${ls.map(l => lessonRow(l, lessonNumber(l), next === l)).join('')}${testRow}</ol>
    </details>`;
}

function renderLearn() {
    const next = nextLesson();
    const course = courseLessons();
    const done = course.filter(l => lessonDone(l.id)).length;
    const tab = app.learnTab;
    const tabs = [['course', 'Course'], ['notes', 'Grammar notes'], ['tools', 'Hangul tools']];

    let body = '';
    if (tab === 'course') {
        body = `
        <section class="panel guided-summary">
            <div>
                <strong>${!next ? 'Course complete. 잘했어요!' : `${done} of ${plural(course.length, 'lesson')} done`}</strong>
                <span class="muted small">${next ? `Up next: ${esc(next.title)} · ${esc(next.unit)}` : 'Keep your words fresh with daily reviews, or work through your class words below.'}</span>
                ${bar(Math.round(done / course.length * 100))}
            </div>
            ${next ? `<button type="button" class="btn btn-primary btn-lg" data-action="start-lesson" data-lesson="${next.id}">${icon('play')}${done ? 'Continue' : 'Start lesson 1'}</button>` : ''}
        </section>
        ${done === 0 ? `<section class="panel placement">
            <span class="mode-icon">${icon('target')}</span>
            <div><strong>Already read Hangul?</strong><span class="muted small">Take the Read Hangul unit test. Pass it and you skip straight to First words.</span></div>
            <button type="button" class="btn btn-secondary" data-action="start-test" data-unit="Read Hangul">Test out</button>
        </section>` : ''}
        ${UNITS.map((u, ui) => unitSection(u, ui, u.optional ? nextClassLesson() : next)).join('')}`;
    } else if (tab === 'notes') {
        const q = normalize(app.notesQuery);
        const notes = courseLessons().flatMap(l => (l.concepts || []).map(c => ({ l, c })))
            .filter(({ l, c }) => !q || normalize([l.title, l.desc, c.title, ...(c.text || []), ...(c.dialogue || []).flat()].join(' ')).includes(q) || [l.desc, ...(c.text || [])].join(' ').includes(app.notesQuery.trim()));
        body = `
        <div class="toolbar">
            <label class="search">${icon('search')}<input type="search" id="notes-search" placeholder="Search notes, e.g. 을, particles, past tense" value="${esc(app.notesQuery)}" autocomplete="off"></label>
        </div>
        <div id="notes-results">${notes.length ? UNITS.filter(u => !u.optional).map(u => {
            const inUnit = notes.filter(n => n.l.unit === u.name);
            return inUnit.length ? `<h3 class="group-title">${esc(u.name)}</h3>
                <div class="notes-list">${inUnit.map(({ l, c }) => `
                    <details class="note-item" ${q ? 'open' : ''}>
                        <summary><strong>${esc(c.title)}</strong><span class="muted small">Lesson ${lessonNumber(l)} · ${esc(l.title)}</span></summary>
                        ${conceptCard(c)}
                    </details>`).join('')}</div>` : '';
        }).join('') : `<div class="empty"><div class="empty-icon">${icon('search')}</div><strong>No notes match</strong><span class="muted small">Try a different word.</span></div>`}</div>`;
    } else {
        const chart = [['consonants', 'Consonants'], ['vowels', 'Vowels'], ['doubleConsonants', 'Double consonants'], ['diphthongs', 'Combined vowels']];
        body = `
        <section class="section section-first">
            <div class="section-head"><h2>Block builder</h2><span class="muted small">Tap letters to build a syllable</span></div>
            <p class="muted small chart-note">Every block is a consonant + a vowel, with an optional final consonant underneath. Try any combination and hear it.</p>
            <div class="panel" id="block-builder"></div>
        </section>

        <section class="section">
            <div class="section-head"><h2>Hangul chart</h2><span class="muted small">Tap a letter to hear it</span></div>
            <p class="muted small chart-note">A picture for every letter. Vowels: follow the short stroke. Two short strokes add a "y": ㅏ → ㅑ, ㅓ → ㅕ, ㅗ → ㅛ, ㅜ → ㅠ.</p>
            ${chart.map(([id, label]) => `
                <div class="group-row"><h3 class="group-title">${label}</h3><button type="button" class="btn btn-sm btn-ghost" data-action="trace-group" data-topic="${id}">${icon('pen', 'icon-sm')}Trace these</button></div>
                <div class="letter-grid">${(topicById(id) || { items: [] }).items.map(letterTile).join('')}</div>`).join('')}
        </section>`;
    }

    $('#view-learn').innerHTML = `
        <header class="page-head">
            <h1>Learn</h1>
            <p class="lead">A guided course from the alphabet to real conversations. Each lesson explains, teaches a few new things, then practices them.</p>
        </header>
        <div class="segmented learn-tabs" role="tablist" aria-label="Learn sections">
            ${tabs.map(([id, label]) => `<button type="button" role="tab" aria-selected="${tab === id}" class="${tab === id ? 'is-on' : ''}" data-action="learn-tab" data-tab="${id}">${label}</button>`).join('')}
        </div>
        ${body}`;
    renderBuilder();
}

const BUILDER_FINALS = ['', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㄲ', 'ㅆ'];
const builderSyllable = () => Hangul.join(app.builder.c, app.builder.v, app.builder.f);

function renderBuilder() {
    const el = $('#block-builder');
    if (!el) return;
    const b = app.builder;
    const row = (part, label, letters) => `<div class="builder-row">
        <span class="builder-label">${label}</span>
        <div class="builder-chips">${letters.map(ch => `<button type="button" class="builder-chip lang-text ${b[part] === ch ? 'is-on' : ''}" data-action="builder" data-part="${part}" data-value="${ch}" aria-pressed="${b[part] === ch}">${ch || 'none'}</button>`).join('')}</div>
    </div>`;
    el.innerHTML = `<div class="builder">
        <div class="builder-out">${blockDiagram(builderSyllable())}</div>
        <div class="builder-pick">
            ${row('c', '1 · Consonant', [...Hangul.CHO])}
            ${row('v', '2 · Vowel', [...Hangul.JUNG])}
            ${row('f', '3 · Final (optional)', BUILDER_FINALS)}
        </div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Practice setup                                                      */
/* ------------------------------------------------------------------ */
// Modes shown up front on Practice; the rest sit under "More ways to practice".
const MAIN_MODES = ['quiz', 'flashcards', 'listening', 'speaking'];

function renderPractice() {
    const p = app.store.prefs;
    const topics = getTopics();
    const sel = new Set(selectedTopicIds(true));
    const groups = [...new Set(topics.map(t => t.group))];
    const pool = poolFor([...sel]);
    const count = pool.length;
    const due = pool.filter(i => isDue(i)).length;
    const sessionCount = p.mode === 'speedMatch' ? 'Up to 60 seconds' : plural(p.length ? Math.min(p.length, count) : count, 'question');
    const noReverse = ['typing', 'matchPairs', 'listening', 'speaking', 'hangulTyping', 'writing'].includes(p.mode);

    const toggle = (key, title, desc, disabled = false) => `
        <label class="switch-row ${disabled ? 'is-disabled' : ''}">
            <span><strong>${title}</strong><small>${desc}</small></span>
            <input type="checkbox" class="switch" data-pref="${key}" ${p[key] ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
        </label>`;
    const modeCard = ([id, m]) => {
        const off = id === 'speaking' && !Speaking.supported;
        return `<button type="button" class="mode-card ${p.mode === id ? 'is-on' : ''}" role="radio" aria-checked="${p.mode === id}" data-action="set-mode" data-mode="${id}" ${off ? 'disabled' : ''}>
            <span class="mode-icon">${icon(m.icon)}</span>
            <strong>${m.label}</strong>
            <small>${off ? 'Needs Chrome, Edge or Safari' : m.desc}</small>
        </button>`;
    };
    const modes = Object.entries(MODES);
    const more = modes.filter(([id]) => !MAIN_MODES.includes(id));
    const optionSummary = [p.length ? `${p.length} questions` : 'All words', p.reverse && !noReverse ? 'English → Korean' : '', p.hints ? 'hints on' : 'hints off'].filter(Boolean).join(' · ');

    $('#view-practice').innerHTML = `
        <header class="page-head">
            <h1>Practice</h1>
            <p class="lead">Pick topics and a way to practice. Words due for review always come first.</p>
        </header>

        <a class="inline-card" href="#/numbers">
            <span class="mode-icon">${icon('hash')}</span>
            <span><strong>Numbers</strong><small>Both number systems, plus drills for prices, time and dates</small></span>
            ${icon('arrow-right', 'icon-sm')}
        </a>

        <section class="panel">
            <div class="panel-head"><span class="step">1</span><h2>What to study</h2></div>
            ${groups.map(g => {
                const gt = topics.filter(t => t.group === g);
                const on = gt.filter(t => sel.has(t.id)).length;
                const allOn = gt.every(t => sel.has(t.id) || !t.items.length);
                return `<details class="topic-group" ${on ? 'open' : ''}>
                    <summary>
                        <span class="topic-group-title">${esc(g)}</span>
                        <span class="muted small">${on ? `${on} selected` : plural(gt.length, 'topic')}</span>
                        ${icon('chevron-down', 'icon-sm summary-chevron')}
                    </summary>
                    <div class="check-chips">
                        ${gt.map(t => `<button type="button" class="check-chip ${sel.has(t.id) ? 'is-on' : ''}" data-action="toggle-topic" data-topic="${t.id}" aria-pressed="${sel.has(t.id)}" ${t.items.length ? '' : 'disabled'} ${t.sub ? `title="${esc(t.sub)}"` : ''}>
                            <span class="check-box">${icon('check', 'icon-xs')}</span>
                            <span>${esc(t.label)}</span>
                            <span class="chip-count">${t.items.length}</span>
                        </button>`).join('')}
                    </div>
                    ${gt.length > 2 ? `<button type="button" class="link-btn group-toggle" data-action="toggle-group" data-group="${esc(g)}" data-on="${allOn ? 0 : 1}">${allOn ? 'Clear these' : 'Select all'}</button>` : ''}
                </details>`;
            }).join('')}
        </section>

        <section class="panel">
            <div class="panel-head"><span class="step">2</span><h2>How to practice</h2></div>
            <div class="mode-grid" role="radiogroup" aria-label="Practice mode">${modes.filter(([id]) => MAIN_MODES.includes(id)).map(modeCard).join('')}</div>
            <details class="more-modes" ${MAIN_MODES.includes(p.mode) ? '' : 'open'}>
                <summary>More ways to practice (${more.length}) ${icon('chevron-down', 'icon-sm summary-chevron')}</summary>
                <div class="mode-grid" role="radiogroup" aria-label="More practice modes">${more.map(modeCard).join('')}</div>
            </details>
        </section>

        <details class="panel options-panel">
            <summary>
                <h2>Options</h2>
                <span class="muted small">${esc(optionSummary)}</span>
                ${icon('chevron-down', 'icon-sm summary-chevron')}
            </summary>
            <div class="options-grid">
                ${toggle('reverse', 'English → Korean', noReverse ? 'Not used in this mode' : 'Show the English, answer in Korean', noReverse)}
                ${toggle('teach', 'Repeat mistakes', 'Missed words come back later in the session')}
                ${toggle('hints', 'Romanization hints', 'Show pronunciation under words')}
                <div class="switch-row">
                    <span><strong>Session length</strong><small>${p.mode === 'speedMatch' ? 'Speed sprint is always 60 seconds' : 'Due words first, then new, then weakest'}</small></span>
                    <div class="segmented" role="radiogroup" aria-label="Session length">
                        ${LENGTHS.map(n => `<button type="button" role="radio" aria-checked="${p.length === n}" class="${p.length === n ? 'is-on' : ''}" data-action="set-length" data-length="${n}" ${p.mode === 'speedMatch' ? 'disabled' : ''}>${n || 'All'}</button>`).join('')}
                    </div>
                </div>
            </div>
        </details>

        <div class="start-bar">
            <div>
                <strong>${count ? plural(count, 'word') + ' selected' : 'Nothing selected'}${due ? ` · <span class="due-text">${due} due</span>` : ''}</strong>
                <span class="muted small">${count ? `${MODES[p.mode].label} · ${sessionCount}` : 'Pick at least one topic above'}</span>
            </div>
            <button type="button" class="btn btn-primary btn-lg" data-action="start-practice" ${count ? '' : 'disabled'}>${icon('play')}Start</button>
        </div>`;
}

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */
function renderNumbers() {
    const p = app.store.prefs;
    const sinoTable = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 100, 1000, 10000];
    const nativeTable = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50];
    const chip = (n, reading) => `<button type="button" class="num-chip" data-action="speak" data-text="${esc(reading)}"><strong>${fmt(n)}</strong><span class="lang-text">${esc(reading)}</span></button>`;
    const styles = [['read', 'Read', 'See Korean, pick the number'], ['listen', 'Listen', 'Hear it, pick the number'], ['write', 'Write', 'See the number, pick the Korean'], ['type', 'Type', 'See Korean, type the digits']];
    const sample = id => { const d = DRILLS[id]; const m = d.make(d.sample); return `${m.def} → <span class="lang-text">${esc(m.key)}</span>`; };

    $('#view-numbers').innerHTML = `
        <header class="page-head">
            <h1>Numbers</h1>
            <p class="lead">Korean has two number systems. Learn both, then drill them in real situations.</p>
        </header>

        <div class="num-systems">
            <section class="panel">
                <div class="panel-head between"><div><h2>Sino-Korean</h2><p class="muted small">From Chinese. Used for money, minutes, dates, floors, phone numbers.</p></div>
                    <button type="button" class="btn btn-sm btn-primary" data-action="start-topic" data-topic="num_sino">${icon('play', 'icon-sm')}Practice</button></div>
                <div class="num-grid">${sinoTable.map(n => chip(n, Hangul.sino(n))).join('')}</div>
            </section>
            <section class="panel">
                <div class="panel-head between"><div><h2>Native Korean</h2><p class="muted small">Used for counting things and people, age, and hours. Only goes up to 99.</p></div>
                    <button type="button" class="btn btn-sm btn-primary" data-action="start-topic" data-topic="num_native">${icon('play', 'icon-sm')}Practice</button></div>
                <div class="num-grid">${nativeTable.map(n => chip(n, Hangul.native(n))).join('')}</div>
            </section>
        </div>

        <section class="panel">
            <div class="panel-head"><h2>Which one do I use?</h2></div>
            <div class="usage-grid">
                <div><span class="tag tag-native">Native</span><p><span class="lang-text">사과 세 개</span> three apples · <span class="lang-text">두 명</span> two people · <span class="lang-text">스무 살</span> 20 years old · <span class="lang-text">세 시</span> 3 o'clock</p></div>
                <div><span class="tag tag-sino">Sino</span><p><span class="lang-text">삼십 분</span> 30 minutes · <span class="lang-text">오천 원</span> ₩5,000 · <span class="lang-text">유월 십오 일</span> June 15 · <span class="lang-text">삼 층</span> 3rd floor</p></div>
                <div><span class="tag">Tip</span><p>Before a counter, 하나·둘·셋·넷·스물 shorten to <span class="lang-text">한·두·세·네·스무</span>. Time mixes both: <span class="lang-text">세 시 삼십 분</span> is 3:30.</p></div>
            </div>
        </section>

        <section class="panel">
            <div class="panel-head"><h2>Number reader</h2></div>
            <div class="converter">
                <label class="search">
                    <input type="text" id="num-input" inputmode="numeric" placeholder="Type a number, e.g. 2026" autocomplete="off" aria-label="Number to read">
                </label>
                <div id="num-output" class="num-output"><span class="muted small">Type any number up to 999,999,999,999 to see how it's read.</span></div>
            </div>
        </section>

        <section class="section">
            <div class="section-head"><h2>Number drills</h2></div>
            <div class="drill-controls">
                <div class="segmented" role="radiogroup" aria-label="Drill style">
                    ${styles.map(([id, label, desc]) => `<button type="button" role="radio" aria-checked="${p.numStyle === id}" class="${p.numStyle === id ? 'is-on' : ''}" data-action="num-style" data-value="${id}" title="${desc}">${label}</button>`).join('')}
                </div>
                <span class="muted small">${esc(styles.find(s => s[0] === p.numStyle)[2])}</span>
            </div>
            <div class="drill-grid">
                ${Object.entries(DRILLS).map(([id, d]) => `
                    <article class="topic-card drill-card">
                        <div class="topic-head"><div><h4>${esc(d.label)}</h4><p>${esc(d.desc)}</p></div></div>
                        <div class="drill-sample">${sample(id)}</div>
                        <div class="topic-foot">
                            ${d.levels ? `<div class="segmented seg-sm" role="radiogroup" aria-label="Range">${[[100, '≤100'], [10000, '≤10k'], [1000000, '≤1M']].map(([v, l]) => `<button type="button" role="radio" aria-checked="${p.numLevel === v}" class="${p.numLevel === v ? 'is-on' : ''}" data-action="num-level" data-value="${v}">${l}</button>`).join('')}</div>` : '<span></span>'}
                            <button type="button" class="btn btn-sm btn-primary" data-action="start-drill" data-drill="${id}">${icon('play', 'icon-sm')}Start</button>
                        </div>
                    </article>`).join('')}
            </div>
        </section>`;
}

function renderNumberReading(raw) {
    const out = $('#num-output');
    const n = Number(String(raw).replace(/[^\d]/g, ''));
    if (!String(raw).trim() || !Number.isFinite(n) || n > 999999999999) {
        out.innerHTML = `<span class="muted small">${String(raw).trim() ? 'Enter a whole number up to 999,999,999,999.' : "Type any number up to 999,999,999,999 to see how it's read."}</span>`;
        return;
    }
    const sino = Hangul.sino(n);
    const nat = Hangul.native(n);
    const row = (label, reading, extra = '') => `<div class="reading">
        <span class="tag ${label === 'Sino' ? 'tag-sino' : 'tag-native'}">${label}</span>
        <div><div class="reading-ko lang-text">${esc(reading)}</div><div class="reading-rom">${esc(Hangul.numberRom(reading))}${extra}</div></div>
        <button type="button" class="icon-btn" data-action="speak" data-text="${esc(reading)}" aria-label="Play">${icon('volume')}</button>
    </div>`;
    out.innerHTML = row('Sino', sino) + (nat ? row('Native', nat, Hangul.nativeCounter(n) !== nat ? ` · before a counter: <span class="lang-text">${esc(Hangul.nativeCounter(n))}</span>` : '') : '');
}

function startDrill(drillId) {
    const p = app.store.prefs;
    const items = makeDrillItems(drillId, p.length || 20);
    const mode = { read: 'quiz', listen: 'listening', write: 'quiz', type: 'typing' }[p.numStyle];
    startSession({ items, mode, reverse: p.numStyle === 'write', drill: drillId });
}

/* ------------------------------------------------------------------ */
/* Words browser                                                       */
/* ------------------------------------------------------------------ */
function stars(score) {
    return `<span class="dots" aria-label="${score} of 5">${[0, 1, 2, 3, 4].map(i => `<i class="${i < score ? 'on' : ''}"></i>`).join('')}</span>`;
}

function dueLabel(item) {
    const c = deck()[item.id];
    if (!c) return '<span class="tag tag-new">New</span>';
    const diff = c.due - dayNum();
    if (diff <= 0) return '<span class="tag tag-due">Due</span>';
    return `<span class="tag">${diff === 1 ? 'Tomorrow' : diff < 30 ? `In ${diff} days` : `In ${Math.round(diff / 30)} mo`}</span>`;
}

function renderWords() {
    const w = app.words;
    const topics = getTopics();
    if (w.topic !== 'all' && !topics.some(t => t.id === w.topic)) w.topic = 'all';
    const groups = [...new Set(topics.map(t => t.group))];

    $('#view-words').innerHTML = `
        <header class="page-head">
            <h1>Words</h1>
            <p class="lead">Everything in LingaloKR. Tap a word to hear it.</p>
        </header>
        <div class="toolbar">
            <label class="search">
                ${icon('search')}
                <input type="search" id="words-search" placeholder="Search Hangul, romanization, or English" value="${esc(w.query)}" autocomplete="off">
            </label>
            <select id="words-topic" class="select" aria-label="Topic">
                <option value="all">All topics</option>
                ${groups.map(g => `<optgroup label="${esc(g)}">${topics.filter(t => t.group === g).map(t => `<option value="${t.id}" ${w.topic === t.id ? 'selected' : ''}>${esc(t.label)}${t.sub && g === 'Class lessons' ? ` — ${esc(t.sub)}` : ''} (${t.items.length})</option>`).join('')}</optgroup>`).join('')}
            </select>
            <div class="segmented" role="radiogroup" aria-label="Filter by progress">
                ${[['all', 'All'], ['new', 'New'], ['due', 'Due'], ['mastered', 'Mastered']].map(([id, label]) =>
                    `<button type="button" role="radio" aria-checked="${w.status === id}" class="${w.status === id ? 'is-on' : ''}" data-action="words-status" data-status="${id}">${label}</button>`).join('')}
            </div>
        </div>
        <div id="words-results"></div>`;
    renderWordResults();
}

function shownWords() {
    const w = app.words;
    const topic = topicById(w.topic);
    const base = topic ? topic.items : allItems();
    const q = normalize(w.query);
    const raw = w.query.trim();
    const t = dayNum();
    return {
        topic, base,
        shown: base.filter(i => {
            if (w.status === 'new' && !isNew(i)) return false;
            if (w.status === 'due' && !isDue(i, t)) return false;
            if (w.status === 'mastered' && masteryOf(i.id) < 4) return false;
            if (q && ![i.key, i.rom, i.def, i.note].some(f => normalize(f).includes(q) || (raw && String(f || '').includes(raw)))) return false;
            return true;
        })
    };
}

function renderWordResults() {
    const { topic, base, shown } = shownWords();
    const st = statsFor(base);
    const isCustom = app.words.topic === 'custom';

    const summary = `<div class="words-summary">
        <div>
            <strong>${topic ? esc(topic.label) : 'All topics'}</strong>
            <span class="muted small">${topic && topic.sub ? esc(topic.sub) + ' · ' : ''}${plural(base.length, 'word')} · ${st.pct}% mastered${st.due ? ` · ${st.due} due` : ''}${shown.length !== base.length ? ` · showing ${shown.length}` : ''}</span>
        </div>
        ${shown.length ? `<button type="button" class="btn btn-sm btn-primary" data-action="practice-shown">${icon('play', 'icon-sm')}Practice ${shown.length !== base.length ? 'these' : 'all'}</button>` : ''}
    </div>`;

    const addPanel = isCustom ? `
        <form class="add-words panel" data-form="add-words">
            <div class="panel-head"><h2>Add words</h2></div>
            <p class="muted small">Type English words separated by commas or new lines and they'll be translated into Korean, with romanization added automatically. To enter your own translation, write <code>사과 = apple</code>, one per line.</p>
            <textarea id="add-words-input" rows="3" placeholder="apple, water, thank you"></textarea>
            <div class="add-words-foot">
                <span class="muted small" id="add-words-status"></span>
                <div class="row-gap">
                    ${base.length ? `<button type="button" class="btn btn-ghost btn-sm danger-text" data-action="clear-custom">${icon('trash', 'icon-sm')}Clear all</button>` : ''}
                    <button type="submit" class="btn btn-primary btn-sm" id="add-words-btn">${icon('plus', 'icon-sm')}Add</button>
                </div>
            </div>
        </form>` : '';

    const empty = `<div class="empty">
        <div class="empty-icon">${icon(isCustom && !base.length ? 'book' : 'search')}</div>
        <strong>${isCustom && !base.length ? 'No words yet' : 'No matches'}</strong>
        <span class="muted small">${isCustom && !base.length ? 'Add some words above to practice them in any mode.' : 'Try a different search or filter.'}</span>
    </div>`;

    $('#words-results').innerHTML = addPanel + summary + (shown.length ? `<div class="word-grid">${shown.map(i => {
        const ex = exampleFor(i);
        return `<div class="word-card" role="button" tabindex="0" data-action="speak" data-text="${esc(i.key)}" aria-label="Play ${esc(i.key)}">
            <div class="word-top">${stars(masteryOf(i.id))}${dueLabel(i)}${i.note ? `<span class="note">${esc(i.note)}</span>` : ''}
                ${isCustom ? `<button type="button" class="icon-btn icon-btn-sm" data-action="delete-word" data-key="${esc(i.key)}" aria-label="Delete ${esc(i.key)}">${icon('trash', 'icon-sm')}</button>` : `<span class="word-audio">${icon('volume', 'icon-sm')}</span>`}
            </div>
            <div class="word-key lang-text">${esc(i.key)}</div>
            ${i.rom && !i.isChar ? `<div class="word-rom">${esc(i.rom)}</div>` : ''}
            <div class="word-def">${esc(i.def)}</div>
            ${mnemonicLine(i, 'mnemonic-sm')}
            ${ex ? `<div class="word-ex"><span class="lang-text">${esc(ex[0])}</span><span>${esc(ex[1])}</span></div>` : ''}
        </div>`;
    }).join('')}</div>` : empty);
}

// MyMemory is a documented free API; Google's endpoint is unofficial and only a fallback.
async function fetchTranslation(word) {
    const local = LANG.basicWords[word.toLowerCase()];
    if (local) return local;
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ko`);
        const data = await res.json();
        const text = data && data.responseData && data.responseData.translatedText;
        if (text && hasHangul(text) && !/MYMEMORY WARNING/i.test(text)) return text.trim();
    } catch (e) { /* try the fallback */ }
    try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(word)}`);
        const data = await res.json();
        const text = data && data[0] && data[0][0] && data[0][0][0];
        if (text && hasHangul(text)) return text.trim();
    } catch (e) { /* give up */ }
    return null;
}

async function addCustomWords(text) {
    const status = $('#add-words-status');
    const btn = $('#add-words-btn');
    const custom = app.store.customList.korean;
    const manual = [];
    const toTranslate = [];
    text.split('\n').forEach(line => {
        if (line.includes('=')) {
            let [a, b] = line.split('=').map(s => s.trim());
            if (!hasHangul(a) && hasHangul(b)) [a, b] = [b, a];
            if (a && b) manual.push([a, b]);
        } else {
            line.split(',').map(s => s.trim()).filter(Boolean).forEach(w => toTranslate.push(w));
        }
    });
    if (!manual.length && !toTranslate.length) return;

    btn.disabled = true;
    const add = (ko, en) => { custom[ko] = { rom: hasHangul(ko) ? Hangul.romanize(ko) : '', def: en }; };
    manual.forEach(([ko, en]) => add(ko, en));
    let added = manual.length, failed = 0;
    for (const [i, english] of toTranslate.entries()) {
        status.textContent = `Translating ${i + 1} of ${toTranslate.length}…`;
        const ko = await fetchTranslation(english);
        if (ko) { add(ko, english); added++; } else failed++;
    }
    invalidateTopics();
    save();
    renderWordResults();
    toast(failed ? `Added ${added}. Couldn't translate ${failed}; try "사과 = apple".` : `Added ${plural(added, 'word')}.`, failed ? 'error' : 'success');
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
function renderSettings() {
    const s = app.store;
    const theme = themePref();
    const seg = (action, current, opts) => `<div class="segmented" role="radiogroup">${opts.map(([v, label, ic]) =>
        `<button type="button" role="radio" aria-checked="${String(current) === String(v)}" class="${String(current) === String(v) ? 'is-on' : ''}" data-action="${action}" data-value="${v}">${ic ? icon(ic, 'icon-sm') : ''}${label}</button>`).join('')}</div>`;
    const voice = koreanVoice();

    $('#view-settings').innerHTML = `
        <header class="page-head">
            <h1>Settings</h1>
            <p class="lead">Your progress is saved in this browser.</p>
        </header>
        <div class="settings">
            <section class="panel">
                <div class="panel-head"><h2>Profile</h2></div>
                <div class="setting-row">
                    <label for="profile-name"><strong>Your name</strong><small>Used to greet you on Home</small></label>
                    <input id="profile-name" class="text-input" maxlength="30" autocomplete="given-name" placeholder="Your name" value="${esc(s.name)}">
                </div>
            </section>

            <section class="panel">
                <div class="panel-head"><h2>Appearance</h2></div>
                <div class="setting-row">
                    <span><strong>Theme</strong><small>System follows your device setting</small></span>
                    ${seg('set-theme', theme, [['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'System', 'monitor']])}
                </div>
            </section>

            <section class="panel">
                <div class="panel-head"><h2>Sound</h2></div>
                <label class="setting-row">
                    <span><strong>Sound effects</strong><small>Short tones for right and wrong answers</small></span>
                    <input type="checkbox" class="switch" data-setting="sfxEnabled" ${s.sfxEnabled !== false ? 'checked' : ''}>
                </label>
                <label class="setting-row">
                    <span><strong>Auto-play pronunciation</strong><small>Speak each word when it appears</small></span>
                    <input type="checkbox" class="switch" data-setting="autoAudio" ${s.autoAudio ? 'checked' : ''}>
                </label>
                <div class="setting-row">
                    <span><strong>Speech speed</strong><small>${voice ? `Voice: ${esc(voice.name)}` : 'No Korean voice found on this device. Listening mode may not work; try Chrome or Edge.'}</small></span>
                    <div class="range-wrap">
                        <input type="range" id="speech-rate" min="0.6" max="1.3" step="0.05" value="${s.speechRate || 1}">
                        <output id="speech-rate-val">${(s.speechRate || 1).toFixed(2)}×</output>
                        <button type="button" class="icon-btn" data-action="test-speech" aria-label="Test speech">${icon('volume')}</button>
                    </div>
                </div>
            </section>

            <section class="panel">
                <div class="panel-head"><h2>Lesson exercises</h2></div>
                <label class="setting-row ${Speaking.supported ? '' : 'is-disabled'}">
                    <span><strong>Speaking</strong><small>${Speaking.supported ? 'Say words out loud. Your browser sends the audio to its speech service (Google in Chrome, Microsoft in Edge, Apple in Safari) to recognize it.' : 'Not available in this browser. Speaking works in Chrome, Edge and Safari.'}</small></span>
                    <input type="checkbox" class="switch" data-pref="speakEx" ${s.prefs.speakEx ? 'checked' : ''} ${Speaking.supported ? '' : 'disabled'}>
                </label>
                <label class="setting-row">
                    <span><strong>Writing</strong><small>Trace letters stroke by stroke in Hangul lessons</small></span>
                    <input type="checkbox" class="switch" data-pref="writeEx" ${s.prefs.writeEx ? 'checked' : ''}>
                </label>
                <label class="setting-row">
                    <span><strong>Hangul typing</strong><small>Type answers on a Korean keyboard (on screen, or your own keys by position)</small></span>
                    <input type="checkbox" class="switch" data-pref="typeEx" ${s.prefs.typeEx ? 'checked' : ''}>
                </label>
            </section>

            <section class="panel">
                <div class="panel-head"><h2>Daily goal</h2></div>
                <div class="setting-row">
                    <span><strong>XP per day</strong><small>About 10 XP per correct answer</small></span>
                    ${seg('set-goal', s.dailyGoal, [[30, 'Casual · 30'], [50, 'Regular · 50'], [100, 'Serious · 100']])}
                </div>
            </section>

            <section class="panel">
                <div class="panel-head"><h2>Keyboard shortcuts</h2></div>
                <dl class="shortcuts">
                    <div><dt><kbd>1</kbd>–<kbd>4</kbd></dt><dd>Choose an answer</dd></div>
                    <div><dt><kbd>Space</kbd></dt><dd>Flip a flashcard</dd></div>
                    <div><dt><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></dt><dd>Rate a flashcard: again, good, easy</dd></div>
                    <div><dt><kbd>Enter</kbd></dt><dd>Check answer / continue</dd></div>
                    <div><dt><kbd>R</kbd></dt><dd>Replay pronunciation</dd></div>
                    <div><dt><kbd>Esc</kbd></dt><dd>Leave the session</dd></div>
                    <div><dt>Letter keys</dt><dd>Type Hangul by key position (Q = ㅂ, W = ㅈ…) in typing exercises</dd></div>
                </dl>
            </section>

            <section class="panel">
                <div class="panel-head"><h2>Move to another device</h2></div>
                <div class="setting-row">
                    <span><strong>Transfer code</strong><small>Copy a code here, then paste it into LingaloKR on your other device</small></span>
                    <div class="row-gap">
                        <button type="button" class="btn btn-secondary btn-sm" data-action="copy-transfer">${icon('copy', 'icon-sm')}Copy code</button>
                        <button type="button" class="btn btn-secondary btn-sm" data-action="enter-transfer">${icon('upload', 'icon-sm')}Enter code</button>
                    </div>
                </div>
                <div class="setting-row">
                    <span><strong>Backup file</strong><small>Save your progress as a file, or restore one</small></span>
                    <div class="row-gap">
                        <button type="button" class="btn btn-secondary btn-sm" data-action="export">${icon('download', 'icon-sm')}Export</button>
                        <button type="button" class="btn btn-secondary btn-sm" data-action="import">${icon('upload', 'icon-sm')}Import</button>
                    </div>
                </div>
            </section>

            <section class="panel">
                <div class="panel-head"><h2>Reset</h2></div>
                <div class="setting-row">
                    <span><strong>Reset progress</strong><small>Deletes XP, streaks, reviews, history, and your custom words</small></span>
                    <button type="button" class="btn btn-danger btn-sm" data-action="reset">${icon('rotate', 'icon-sm')}Reset</button>
                </div>
            </section>
        </div>`;
}

function exportProgress() {
    const blob = new Blob([JSON.stringify({ app: 'lingalokr', exportedAt: new Date().toISOString(), data: app.store }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lingalokr-backup-${dateKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function restoreProgress(data) {
    if (!data || typeof data.mastery !== 'object') throw new Error('bad data');
    const ok = await confirmDialog({ title: 'Replace your progress?', body: 'Your current progress in this browser will be replaced.', confirm: 'Replace' });
    if (!ok) return false;
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    loadProgress();
    invalidateTopics();
    renderView();
    toast('Progress restored.', 'success');
    return true;
}

async function importProgress(file) {
    try {
        const parsed = JSON.parse(await file.text());
        await restoreProgress(parsed && parsed.data ? parsed.data : parsed);
    } catch (e) {
        toast("That file isn't a LingaloKR backup.", 'error');
    }
}

/* Transfer codes: gzip-compressed progress as base64 text. */
const toB64 = bytes => { let s = ''; bytes.forEach(b => { s += String.fromCharCode(b); }); return btoa(s); };
const fromB64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

async function makeTransferCode() {
    const bytes = new TextEncoder().encode(JSON.stringify(app.store));
    if (window.CompressionStream) {
        const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
        return 'LKR1.' + toB64(new Uint8Array(await new Response(stream).arrayBuffer()));
    }
    return 'LKR0.' + toB64(bytes);
}

async function readTransferCode(code) {
    const [tag, body] = code.trim().replace(/\s/g, '').split('.');
    let bytes = fromB64(body);
    if (tag === 'LKR1') {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (tag !== 'LKR0') throw new Error('bad code');
    return JSON.parse(new TextDecoder().decode(bytes));
}

/* ------------------------------------------------------------------ */
/* Study session                                                       */
/* ------------------------------------------------------------------ */
function openStudyScreen(mode) {
    $('#study').hidden = false;
    document.body.classList.add('is-studying');
    // Keyboard shortcuts shouldn't also press the button that opened the session.
    if (document.activeElement) document.activeElement.blur();
    // Snap the progress bar back to empty instead of animating down from the last session.
    const fill = $('#study-progress-fill');
    fill.style.transition = 'none';
    fill.style.width = '0%';
    void fill.offsetWidth;
    fill.style.transition = '';
    $('#study-timer').hidden = mode !== 'speedMatch';
    $('#study-count').hidden = mode === 'speedMatch';
    $('#study-streak').hidden = mode === 'teach';
}

/* Guided lesson: an intro card, concept cards, one teaching card per item, then mixed practice. */
function startLesson(id, plan) {
    const lesson = lessonById(id);
    const items = lesson ? lessonItems(lesson) : [];
    if (!items.length) return;
    stopTimer();
    const steps = [{ intro: true }, ...(lesson.concepts || []).map(concept => ({ concept })), ...items.map(item => ({ item }))];
    app.session = { mode: 'teach', lesson: id, plan, items, steps, queue: items, pool: items, index: 0, item: null, xp: 0 };
    openStudyScreen('teach');
    renderTeach();
}

function conceptCard(c) {
    const table = c.table ? `<div class="concept-table-wrap"><table class="concept-table">
        <thead><tr>${c.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${c.table.rows.map(r => `<tr>${r.map(cell => `<td class="${hasHangul(cell) ? 'lang-text' : ''}">${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>` : '';
    // The first speaker's lines sit on the left, everyone else's on the right.
    const dialogue = c.dialogue ? `<div class="dialogue">${c.dialogue.map(([who, ko, en]) => `
        <button type="button" class="dialogue-line ${who !== c.dialogue[0][0] ? 'is-b' : ''}" data-action="speak" data-text="${esc(ko)}">
            <span class="dialogue-who">${esc(who)}</span>
            <span class="dialogue-text"><span class="lang-text">${esc(ko)}</span><span class="muted small">${esc(Hangul.romanize(ko))}</span><span>${esc(en)}</span></span>
            ${icon('volume', 'icon-sm')}
        </button>`).join('')}</div>` : '';
    return `<div class="prompt concept-card">
        <div class="prompt-label">${c.dialogue ? 'Conversation · tap a line to hear it' : 'How it works'}</div>
        <h2>${esc(c.title)}</h2>
        ${(c.text || []).map(t => `<p>${richText(t)}</p>`).join('')}
        ${c.blocks ? `<div class="block-row">${c.blocks.map(b => blockDiagram(b)).join('')}</div>` : ''}
        ${table}${dialogue}
    </div>`;
}

function renderTeach() {
    const s = app.session;
    const lesson = lessonById(s.lesson);
    const step = s.steps[s.index];
    const n = s.items.length;
    const noun = lessonNoun(lesson);
    const last = s.index === s.steps.length - 1;
    const nextLabel = last ? 'Start practice' : step.intro ? "Let's go" : 'Got it';
    const nav = `<div class="fc-actions">
            ${s.index > 0 ? '<button type="button" class="btn btn-secondary btn-lg" data-action="teach-back">Back</button>' : ''}
            <button type="button" class="btn btn-primary btn-lg teach-next" data-action="teach-next">${nextLabel} <kbd>Enter</kbd></button>
        </div>`;
    updateStudyBar();
    s.item = step.item || null;
    const body = $('#study-body');

    if (step.intro) {
        const p = app.store.prefs;
        const extras = [lesson.build && 'block building', s.items.some(i => i.key.trim().includes(' ')) && 'sentence building', koreanVoice() && 'listening',
            p.speakEx && Speaking.supported && s.items.some(i => !i.isChar) && 'speaking', p.writeEx && s.items.some(canWrite) && 'tracing', p.typeEx && 'Hangul typing'].filter(Boolean);
        body.innerHTML = `<div class="study-card">
            <div class="prompt teach-intro">
                <div class="prompt-label">Lesson ${lessonNumber(lesson)} · ${esc(lesson.unit)}</div>
                <h2>${esc(lesson.title)}</h2>
                <div class="teach-preview lang-text">${esc(lesson.desc)}</div>
                <ul class="teach-tips">${lesson.intro.map(t => `<li>${richText(t)}</li>`).join('')}</ul>
                <span class="muted small">${lesson.concepts ? `${plural(lesson.concepts.length, 'short note')}, ` : ''}${plural(n, `new ${noun}`)}, then practice: quizzes${extras.length ? `, ${extras.join(', ')}` : ''}.</span>
            </div>
            ${nav}
        </div>`;
        return;
    }
    if (step.concept) {
        body.innerHTML = `<div class="study-card">${conceptCard(step.concept)}${nav}</div>`;
        return;
    }

    const it = step.item;
    const mn = mnemonicFor(it);
    const ex = exampleFor(it);
    const syllable = it.isChar && Hangul.split(it.key);
    const len = [...it.key].length;
    body.innerHTML = `<div class="study-card">
        <div class="prompt teach-card">
            <div class="prompt-label">New ${noun} · ${s.items.indexOf(it) + 1} of ${n}</div>
            ${syllable ? blockDiagram(it.key, { speakable: false }) : `<div class="prompt-text lang-text ${len > 14 ? 'is-long' : len > 6 ? 'is-mid' : ''}">${esc(it.key)}</div>`}
            ${it.isChar
                ? (syllable ? '' : `<div class="teach-sound">${esc(mn ? mn[0] : it.rom)}</div>`)
                : `<div class="teach-sound">${esc(it.rom)}</div><div class="back-def">${esc(it.def)}</div>`}
            ${mn ? `<div class="mnemonic mnemonic-lg"><span>${richText(mn[1])}</span></div>` : ''}
            ${ex ? `<div class="back-ex"><span class="lang-text">${esc(ex[0])}</span><span>${esc(ex[1])}</span></div>` : ''}
            <button type="button" class="btn btn-secondary btn-sm teach-play" data-action="replay-audio">${icon('volume', 'icon-sm')}${it.isChar && sampleSyllable(it.key) !== it.key ? `Hear it in <span class="lang-text">${esc(sampleSyllable(it.key))}</span>` : 'Hear it'}</button>
        </div>
        ${nav}
    </div>`;
    speakItem(it);
}

function teachStep(dir) {
    const s = app.session;
    if (!s || s.mode !== 'teach') return;
    if (dir < 0 && s.index <= 0) return;
    s.index += dir;
    if (s.index >= s.steps.length) startSession({ items: s.items, mode: 'lesson', reverse: false, lesson: s.lesson, plan: s.plan });
    else renderTeach();
}

/* Lesson practice: a mix of exercise types over the lesson's items. */
const LETTER_POOL = { c: 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ', v: 'ㅏㅓㅗㅜㅡㅣㅐㅔㅑㅕㅛㅠ' };

function buildItem(syl) {
    const rom = Hangul.romanize(syl);
    return { id: `gen:build:${syl}`, key: syl, rom, def: rom, isChar: true, gen: true };
}

const PARTICLE_PAIRS = { '을': '를', '를': '을', '은': '는', '는': '은', '이': '가', '가': '이', '에': '에서', '에서': '에' };
const PARTICLE_ROLE = {
    '을': 'marks the object', '를': 'marks the object', '은': 'marks the topic', '는': 'marks the topic',
    '이': 'marks the subject', '가': 'marks the subject', '에': 'marks where you go or where something is', '에서': 'marks where an action happens'
};
const wordsOf = item => item.key.trim().split(/\s+/);

// "책＿ 읽어요": pick the particle that fills the gap.
function particleExercise(item) {
    const ws = wordsOf(item);
    const at = ws.slice(0, -1).findIndex(w => Hangul.particleOf(w));
    if (at < 0) return null;
    const p = Hangul.particleOf(ws[at]);
    const pair = PARTICLE_PAIRS[p.particle];
    const others = shuffle(Object.keys(PARTICLE_PAIRS).filter(x => x !== p.particle && x !== pair)).slice(0, 2);
    const rule = ['에', '에서'].includes(p.particle)
        ? `${p.particle} ${PARTICLE_ROLE[p.particle]}.`
        : `${p.particle} ${PARTICLE_ROLE[p.particle]}. ${p.stem} ends in a ${p.final ? 'consonant' : 'vowel'}, so it takes ${p.particle}, not ${pair}.`;
    return {
        kind: 'particle', item, answer: p.particle, options: [p.particle, pair, ...others], rule,
        prompt: ws.map((w, i) => (i === at ? `${p.stem}＿` : w)).join(' ')
    };
}

// Dialogues: given a line, pick the reply that comes next.
function replyExercises(dialogue) {
    return dialogue.map((line, i) => {
        const prev = dialogue[i - 1];
        if (!prev || prev[0] === line[0]) return null;
        const others = shuffle(dialogue.filter((l, j) => j !== i && j !== i - 1).map(l => l[1])).slice(0, 3);
        return { kind: 'reply', prev, options: [line[1], ...others], item: { id: `gen:reply:${line[1]}`, key: line[1], rom: Hangul.romanize(line[1]), def: line[2], gen: true } };
    }).filter(Boolean);
}

function lessonExercises(lesson) {
    const items = lessonItems(lesson);
    const wordItems = items.filter(i => !i.isChar);
    const sentences = wordItems.filter(i => wordsOf(i).length > 1);
    const p = app.store.prefs;
    const some = (list, n) => shuffle(list).slice(0, n);
    const ex = items.map(item => ({ kind: 'choice', item }));
    some(wordItems, Math.ceil(wordItems.length / 2)).forEach(item => ex.push({ kind: 'reverse', item }));
    if (koreanVoice()) some(items, Math.ceil(items.length / 3)).forEach(item => ex.push({ kind: 'listen', item }));
    sentences.forEach(item => ex.push({ kind: 'order', item }));
    (lesson.build || []).forEach(syl => ex.push({ kind: 'build', item: buildItem(syl) }));
    some(sentences.map(particleExercise).filter(Boolean), Math.ceil(sentences.length / 2)).forEach(e => ex.push(e));
    (lesson.concepts || []).filter(c => c.dialogue).forEach(c => some(replyExercises(c.dialogue), 3).forEach(e => ex.push(e)));
    if (p.speakEx && Speaking.supported && wordItems.length) some(wordItems, Math.ceil(wordItems.length / 4)).forEach(item => ex.push({ kind: 'speak', item }));
    if (p.writeEx) some(items.filter(canWrite), 2).forEach(item => ex.push({ kind: 'write', item }));
    if (p.typeEx) some(items.filter(i => [...i.key].length <= 8), 2).forEach(item => ex.push({ kind: 'typeko', item }));
    // Start with plain recognition so every item gets a first look before the harder exercises.
    const choice = shuffle(ex.filter(e => e.kind === 'choice'));
    const half = Math.ceil(choice.length / 2);
    return [...choice.slice(0, half), ...shuffle([...choice.slice(half), ...ex.filter(e => e.kind !== 'choice')])];
}

function lessonQuestion(ex) {
    const it = ex.item;
    const hint = app.store.prefs.hints && it.rom && !it.isChar ? it.rom : '';
    if (ex.kind === 'reverse') return { prompt: it.def, promptLang: false, hint: '', answer: it.key, answerLang: true, label: 'Which is this in Korean?' };
    if (ex.kind === 'listen') return { prompt: '', audio: true, hint: '', answer: it.def, answerLang: false, label: 'What did you hear?' };
    if (ex.kind === 'build') return { prompt: it.rom, label: 'Build this syllable', answer: it.key };
    if (ex.kind === 'order') return { prompt: it.def, label: 'Put the words in order', answer: it.key };
    if (ex.kind === 'particle') return { prompt: ex.prompt, promptLang: true, hint: it.def, answer: ex.answer, answerLang: true, options: shuffle(ex.options), label: 'Fill in the particle', feedback: `${esc(ex.rule)} <span class="lang-text">${esc(it.key)}</span>` };
    if (ex.kind === 'reply') return { prompt: ex.prev[1], promptLang: true, hint: ex.prev[2], answer: it.key, answerLang: true, options: shuffle(ex.options), label: `${ex.prev[0]} says… what comes next?`, feedback: answerText(it) };
    if (ex.kind === 'speak') return { prompt: it.key, label: 'Say it out loud', answer: it.key, promptLang: true };
    if (ex.kind === 'write') return { prompt: it.key, label: 'Trace the letter', answer: it.key };
    if (ex.kind === 'typeko') return { prompt: it.def, label: 'Type it in Hangul', answer: it.key };
    return { prompt: it.key, promptLang: true, hint, answer: it.def, answerLang: false, label: it.isChar ? 'How does this sound?' : 'What does this mean?' };
}

function renderBuild() {
    const s = app.session;
    const p = Hangul.split(s.item.key);
    if (!s.build) {
        const parts = [p.initial, p.vowel, p.final].filter(Boolean);
        const extraC = shuffle([...LETTER_POOL.c].filter(c => !parts.includes(c))).slice(0, 2);
        const extraV = shuffle([...LETTER_POOL.v].filter(v => !parts.includes(v))).slice(0, 2);
        s.build = { tiles: shuffle([...parts, ...extraC, ...extraV]), picked: [], note: 'Start with a consonant, then add a vowel.' };
    }
    const b = s.build;
    const [c, v, f] = b.picked.map(i => b.tiles[i]);
    const made = c && v ? Hangul.join(c, v, f || '') : null;
    const slot = (ch, role, label) => `<span class="part part-${role} ${ch ? '' : 'is-empty'}"><span class="lang-text">${esc(ch || '?')}</span><small>${label}</small></span>`;
    $('#study-body').innerHTML = `<div class="study-card">
        <div class="prompt">
            <div class="prompt-label">${esc(s.q.label)}</div>
            <div class="prompt-text is-mid">${esc(s.q.prompt)}</div>
            <div class="build-stage">
                <div class="block block-${v ? blockShape(v) : 'side'} ${p.final || f ? 'has-final' : ''}">
                    ${slot(c, 'c', 'consonant')}${slot(v, 'v', 'vowel')}${p.final || f ? slot(f, 'f', 'final') : ''}
                </div>
                <div class="build-result lang-text">${made ? `= ${esc(made)}` : ''}</div>
            </div>
            <div class="prompt-hint">${esc(b.note)}</div>
        </div>
        <div class="tile-bank">${b.tiles.map((t, i) => `<button type="button" class="tile lang-text ${Hangul.isVowel(t) ? 'is-vowel' : ''}" data-action="build-tile" data-index="${i}" ${b.picked.includes(i) || s.locked ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>
        <div class="fc-actions">
            <button type="button" class="btn btn-secondary btn-lg" data-action="build-undo" ${b.picked.length && !s.locked ? '' : 'disabled'}>Undo</button>
            <button type="button" class="btn btn-primary btn-lg teach-next" data-action="check-exercise" ${made && !s.locked ? '' : 'disabled'}>Check <kbd>Enter</kbd></button>
        </div>
    </div><div class="feedback-slot" id="feedback"></div>`;
}

// Tiles go in block order: consonant, vowel, then an optional final consonant.
function pickBuildTile(index) {
    const s = app.session;
    const b = s && s.build;
    if (!b || s.locked || b.picked.includes(index) || b.picked.length >= 3) return;
    const ch = b.tiles[index];
    const n = b.picked.length;
    if (n === 0 && !Hangul.isConsonant(ch)) b.note = 'Every block starts with a consonant. Pick one of those first.';
    else if (n === 1 && !Hangul.isVowel(ch)) b.note = 'A block needs a vowel next. Two consonants in a row is not a syllable.';
    else if (n === 2 && !Hangul.join(b.tiles[b.picked[0]], b.tiles[b.picked[1]], ch)) b.note = 'Only a consonant can sit at the bottom as a final.';
    else {
        b.picked.push(index);
        b.note = n === 0 ? 'Now add a vowel.' : n === 1 ? 'Add a final consonant if it needs one, or check.' : 'Ready to check.';
        speak(n === 0 ? sampleSyllable(ch) : Hangul.join(...b.picked.map(i => b.tiles[i])));
    }
    renderBuild();
}

function renderOrder() {
    const s = app.session;
    if (!s.order) {
        const ws = wordsOf(s.item);
        let tiles = ws.map(w => ({ w }));
        // In sentence lessons, add a trap: the same word with the wrong particle.
        const withParticle = ws.slice(0, -1).map(w => Hangul.particleOf(w)).find(Boolean);
        if (withParticle && s.mode === 'lesson') tiles.push({ w: withParticle.stem + PARTICLE_PAIRS[withParticle.particle], decoy: true });
        tiles = shuffle(tiles);
        for (let t = 0; t < 5 && tiles.every((x, n) => x.w === ws[n]); t++) tiles = shuffle(tiles);
        s.order = { tiles, picked: [], size: ws.length, decoy: tiles.some(x => x.decoy) };
    }
    const o = s.order;
    $('#study-body').innerHTML = `<div class="study-card">
        <div class="prompt">
            <div class="prompt-label">${esc(s.q.label)}</div>
            <div class="prompt-text is-long">${esc(s.q.prompt)}</div>
            <div class="order-line ${o.picked.length ? '' : 'is-empty'}">${o.picked.length
                ? o.picked.map((t, n) => `<button type="button" class="tile lang-text" data-action="order-remove" data-pos="${n}" ${s.locked ? 'disabled' : ''}>${esc(o.tiles[t].w)}</button>`).join('')
                : `<span class="muted small">Tap the words below in order. The verb comes last.${o.decoy ? ' One word is a trap.' : ''}</span>`}</div>
        </div>
        <div class="tile-bank">${o.tiles.map((t, i) => `<button type="button" class="tile lang-text" data-action="order-pick" data-index="${i}" ${o.picked.includes(i) || s.locked ? 'disabled' : ''}>${esc(t.w)}</button>`).join('')}</div>
        <div class="fc-actions">
            <button type="button" class="btn btn-secondary btn-lg" data-action="order-remove" data-pos="${o.picked.length - 1}" ${o.picked.length && !s.locked ? '' : 'disabled'}>Undo</button>
            <button type="button" class="btn btn-primary btn-lg teach-next" data-action="check-exercise" ${o.picked.length === o.size && !s.locked ? '' : 'disabled'}>Check <kbd>Enter</kbd></button>
        </div>
    </div><div class="feedback-slot" id="feedback"></div>`;
}

function pickOrderTile(index) {
    const s = app.session;
    const o = s && s.order;
    if (!o || s.locked || o.picked.includes(index) || o.picked.length >= o.size) return;
    o.picked.push(index);
    renderOrder();
}

function removeOrderTile(pos) {
    const s = app.session;
    const o = s && s.order;
    if (!o || s.locked || pos < 0) return;
    o.picked.splice(pos, 1);
    renderOrder();
}

function checkExercise() {
    const s = app.session;
    if (!s || s.locked || !s.ex) return;
    if (s.ex.kind === 'write') return checkWrite();
    if (s.ex.kind === 'typeko') return checkTypeKo();
    if (s.ex.kind === 'speak') return startListening();
    let ok, extra = '';
    if (s.ex.kind === 'build') {
        const b = s.build;
        const [c, v, f] = b.picked.map(i => b.tiles[i]);
        const made = c && v ? Hangul.join(c, v, f || '') : null;
        if (!made) return;
        const p = Hangul.split(s.item.key);
        ok = made === s.item.key;
        extra = `${[p.initial, p.vowel, p.final].filter(Boolean).join(' + ')} = <span class="lang-text">${esc(s.item.key)}</span> <span class="muted">(${esc(s.item.rom)})</span>${ok ? '' : ` · you built <span class="lang-text">${esc(made)}</span>`}`;
    } else if (s.ex.kind === 'order') {
        const o = s.order;
        if (o.picked.length !== o.size) return;
        ok = o.picked.map(i => o.tiles[i].w).join(' ') === wordsOf(s.item).join(' ');
        if (!ok && o.picked.some(i => o.tiles[i].decoy)) extra = `Watch the particle. ${answerText(s.item)}`;
    } else return;
    s.locked = true;
    grade(ok);
    if (s.ex.kind === 'build') renderBuild(); else renderOrder();
    speakItem(s.item);
    showFeedback(ok, extra);
}

function startSession({ topics, items, mode = app.store.prefs.mode, reverse, drill, lesson, plan } = {}) {
    let pool = items || poolFor(topics || selectedTopicIds());
    if (mode === 'speaking') {
        if (!Speaking.supported) { toast('Speaking needs speech recognition: try Chrome, Edge or Safari.', 'error'); return; }
        pool = pool.filter(i => !i.isChar && !i.gen);
        if (!pool.length) { toast('Speaking works with words and phrases. Pick a vocabulary topic.', 'error'); return; }
    }
    if (mode === 'writing') {
        pool = pool.filter(canWrite);
        if (!pool.length) pool = poolFor(['consonants', 'vowels']);
    }
    if (!pool.length) { toast('Pick at least one topic that has words in it.', 'error'); return; }
    if (mode === 'matchPairs' && pool.length < 2) mode = 'flashcards';
    if (mode === 'listening' && !koreanVoice()) toast('No Korean voice found on this device, so audio may not play.', 'error');

    const length = drill || lesson ? 0 : app.store.prefs.length;
    const t = dayNum();
    let queue;
    if (mode === 'lesson' && String(lesson).startsWith('test:')) {
        const all = lessonExercises(lessonById(lesson)).filter(e => !['speak', 'write'].includes(e.kind));
        queue = shuffle([...shuffle(all.filter(e => e.kind !== 'choice')).slice(0, 9), ...shuffle(all.filter(e => e.kind === 'choice'))]).slice(0, 15);
    } else if (mode === 'lesson') {
        queue = lessonExercises(lessonById(lesson));
    } else if (mode === 'speedMatch') {
        queue = shuffle(pool);
    } else {
        // Due words first, then new ones, then the weakest; a little randomness keeps sessions varied.
        const rank = i => (isDue(i, t) ? 0 : isNew(i) ? 10 : 20) + masteryOf(i.id) + Math.random() * 0.9;
        queue = pool.map(i => [rank(i), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
        if (length) queue = queue.slice(0, length);
        queue = shuffle(queue);
    }

    stopTimer();
    app.session = {
        mode, pool, queue, topics, items, drill, lesson, plan,
        test: String(lesson || '').startsWith('test:') ? lesson.slice(5) : null,
        reverse: reverse !== undefined ? reverse : app.store.prefs.reverse,
        index: 0, correct: 0, attempts: 0, streak: 0, best: 0, xp: 0,
        missed: new Map(), repeats: new Map(),
        locked: false, revealed: false, done: false,
        timeLeft: 60, timer: null, board: null
    };
    openStudyScreen(mode);

    if (mode === 'speedMatch') startTimer();
    if (mode === 'matchPairs') nextBoard(); else nextQuestion();
}

function exitSession() {
    stopTimer();
    Speaking.stop();
    app.session = null;
    $('#study').hidden = true;
    document.body.classList.remove('is-studying');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    renderView();
}

function startTimer() {
    const s = app.session;
    $('#study-timer-val').textContent = s.timeLeft;
    $('#study-timer').classList.remove('is-low');
    s.timer = setInterval(() => {
        s.timeLeft--;
        $('#study-timer-val').textContent = s.timeLeft;
        $('#study-timer').classList.toggle('is-low', s.timeLeft <= 10);
        if (s.timeLeft <= 0) finishSession();
    }, 1000);
}

function stopTimer() {
    if (app.session && app.session.timer) clearInterval(app.session.timer);
}

function updateStudyBar() {
    const s = app.session;
    if (s.mode === 'teach') {
        $('#study-progress-fill').style.width = `${(s.index + 1) / s.steps.length * 100}%`;
        $('#study-count').textContent = `${s.index + 1} / ${s.steps.length}`;
        return;
    }
    let pct;
    if (s.mode === 'speedMatch') pct = (60 - s.timeLeft) / 60 * 100;
    else if (s.mode === 'matchPairs') pct = s.correct / s.queue.length * 100;
    else pct = s.index / s.queue.length * 100;
    if (s.done) pct = 100;
    $('#study-progress-fill').style.width = `${pct}%`;
    $('#study-count').textContent = s.mode === 'matchPairs'
        ? `${s.correct} / ${s.queue.length}`
        : `${Math.min(s.index + 1, s.queue.length)} / ${s.queue.length}`;
    $('#study-streak-val').textContent = s.streak;
    $('#study-streak').classList.toggle('is-hot', s.streak >= 3);
}

// Decide what to show and what counts as the right answer for an item.
function buildQuestion(item) {
    const s = app.session;
    const hint = app.store.prefs.hints && item.rom && !item.isChar ? item.rom : '';

    if (s.mode === 'listening') {
        return { prompt: '', audio: true, hint: '', answer: item.def, answerLang: false, label: 'What did you hear?' };
    }
    if (s.mode === 'typing') {
        if (item.gen) return { prompt: item.key, promptLang: true, hint, answer: item.num, digits: true, label: 'Type the number', placeholder: 'Digits' };
        return { prompt: item.key, promptLang: true, hint: item.isChar ? '' : item.def, answer: item.rom, answerLang: false, label: 'Type how it sounds', placeholder: 'Romanization' };
    }
    if (s.reverse && s.mode !== 'matchPairs') {
        return { prompt: item.def, promptLang: false, hint: '', answer: item.key, answerLang: true, label: item.gen ? 'How do you say this in Korean?' : 'Which is this in Korean?' };
    }
    return { prompt: item.key, promptLang: true, hint, answer: item.def, answerLang: false, label: item.gen ? 'What number is this?' : item.isChar ? 'How does this sound?' : 'What does this mean?' };
}

function buildOptions(q, item) {
    const s = app.session;
    const valueOf = i => (q.answerLang ? i.key : i.def);
    const opts = [q.answer];
    const seen = new Set([normalize(q.answer)]);
    const sources = [item.alts ? shuffle(item.alts) : [], shuffle(s.pool), shuffle(allItems())];
    for (const src of sources) {
        for (const i of src) {
            if (opts.length >= 4) break;
            const v = valueOf(i);
            if (v && !seen.has(normalize(v))) { seen.add(normalize(v)); opts.push(v); }
        }
    }
    return shuffle(opts);
}

function promptBlock(q, item) {
    if (q.audio) {
        return `<div class="prompt">
            <div class="prompt-label">${esc(q.label)}</div>
            <button type="button" class="listen-btn" data-action="replay-audio" aria-label="Play again">${icon('volume')}</button>
            <div class="prompt-hint muted">Tap to hear it again <kbd>R</kbd></div>
            ${item.gen ? '' : stars(masteryOf(item.id))}
        </div>`;
    }
    const len = [...q.prompt].length;
    return `<div class="prompt">
        <div class="prompt-label">${esc(q.label)}</div>
        <div class="prompt-text ${q.promptLang ? 'lang-text' : ''} ${len > 14 ? 'is-long' : len > 6 ? 'is-mid' : ''}">${esc(q.prompt)}</div>
        <div class="prompt-hint">${esc(q.hint) || '&nbsp;'}</div>
        ${item.gen ? '' : stars(masteryOf(item.id))}
    </div>`;
}

function nextQuestion() {
    const s = app.session;
    if (!s) return;
    if (s.mode === 'speedMatch' && s.index >= s.queue.length) s.queue.push(...shuffle(s.pool));
    if (s.index >= s.queue.length) return finishSession();

    if (s.mode === 'lesson') {
        s.ex = s.queue[s.index];
        s.item = s.ex.item;
        s.q = lessonQuestion(s.ex);
    } else if (MODE_KIND[s.mode]) {
        s.item = s.queue[s.index];
        s.ex = { kind: MODE_KIND[s.mode], item: s.item };
        s.q = lessonQuestion(s.ex);
    } else {
        s.ex = null;
        s.item = s.queue[s.index];
        s.q = buildQuestion(s.item);
    }
    s.locked = false;
    s.revealed = false;
    s.awaitingContinue = false;
    s.build = s.order = s.speak = s.write = s.kb = null;
    Speaking.stop();
    updateStudyBar();

    const body = $('#study-body');
    const render = { build: renderBuild, order: renderOrder, speak: renderSpeak, write: renderWrite, typeko: renderTypeKo }[s.ex && s.ex.kind];
    if (render) {
        render();
    } else if (['quiz', 'speedMatch', 'listening', 'lesson'].includes(s.mode)) {
        s.q.options = s.q.options || buildOptions(s.q, s.item);
        body.innerHTML = `<div class="study-card">${promptBlock(s.q, s.item)}
            <div class="options">${s.q.options.map((o, i) => `
                <button type="button" class="option" data-action="answer" data-index="${i}">
                    <kbd>${i + 1}</kbd><span class="${s.q.answerLang ? 'lang-text' : ''}">${esc(o)}</span>
                </button>`).join('')}
            </div></div><div class="feedback-slot" id="feedback"></div>`;
    } else if (s.mode === 'flashcards') {
        const it = s.item;
        const ex = exampleFor(it);
        body.innerHTML = `<div class="study-card">
            <div class="flashcard" id="flashcard" data-action="flip" role="button" tabindex="0" aria-label="Flip card">
                <div class="flashcard-inner">
                    <div class="face face-front">${promptBlock(s.q, it)}<span class="muted small flip-hint">Tap to flip</span></div>
                    <div class="face face-back">
                        <div class="prompt-label">Answer</div>
                        <div class="back-key lang-text">${esc(it.key)}</div>
                        ${it.rom && !it.isChar ? `<div class="back-rom">${esc(it.rom)}</div>` : ''}
                        <div class="back-def">${esc(it.def)}</div>
                        ${mnemonicLine(it)}
                        ${ex ? `<div class="back-ex"><span class="lang-text">${esc(ex[0])}</span><span>${esc(ex[1])}</span></div>` : ''}
                    </div>
                </div>
            </div>
            <div class="fc-actions" id="fc-actions">
                <button type="button" class="btn btn-primary btn-lg btn-block" data-action="flip">Show answer <kbd>Space</kbd></button>
            </div></div>`;
    } else if (s.mode === 'typing') {
        body.innerHTML = `<div class="study-card">${promptBlock(s.q, s.item)}
            <form class="type-form" data-form="typing" autocomplete="off">
                <input id="type-input" placeholder="${esc(s.q.placeholder)}" ${s.q.digits ? 'inputmode="numeric"' : ''} autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Your answer">
                <button type="submit" class="btn btn-primary btn-lg">Check</button>
            </form>
            <button type="button" class="link-btn skip" data-action="skip">I don't know</button>
            </div><div class="feedback-slot" id="feedback"></div>`;
        setTimeout(() => { const el = $('#type-input'); if (el) el.focus(); }, 30);
    }

    if (s.q.audio) setTimeout(() => speakItem(s.item), 150);
    else if (app.store.autoAudio && s.q.promptLang) speakItem(s.item);
}

function advance() {
    const s = app.session;
    if (!s || s.done) return;
    s.index++;
    nextQuestion();
}

// Record a result for the current item.
function grade(ok, { xpRight = 10, xpWrong = 2, gain = 1, rating = 'good' } = {}) {
    const s = app.session;
    const item = s.item;
    s.attempts++;
    logActivity({ correct: ok ? 1 : 0, total: 1 });
    logSkill(ok);
    if (ok) {
        s.correct++;
        s.streak++;
        s.best = Math.max(s.best, s.streak);
        bumpMastery(item, gain);
        schedule(item, rating);
        SFX.correct();
        haptic('success');
        addXP(xpRight);
    } else {
        s.streak = 0;
        s.missed.set(item.id, item);
        bumpMastery(item, -1);
        schedule(item, 'again');
        SFX.wrong();
        haptic('error');
        addXP(xpWrong);
        if (app.store.prefs.teach && s.mode !== 'speedMatch' && !s.test) requeue(item, 3);
    }
    updateStudyBar();
}

function skillOf(s) {
    if (s.ex) return KIND_SKILL[s.ex.kind] || 'reading';
    return { listening: 'listening', typing: 'typing', flashcards: 'recall' }[s.mode] || (s.reverse ? 'recall' : 'reading');
}

function logSkill(ok) {
    const k = skillOf(app.session);
    const rec = app.store.skills[k] || (app.store.skills[k] = { c: 0, t: 0 });
    rec.t++;
    if (ok) rec.c++;
}

function requeue(item, gap) {
    const s = app.session;
    const n = s.repeats.get(item.id) || 0;
    if (n >= 2) return;
    s.repeats.set(item.id, n + 1);
    s.queue.splice(Math.min(s.index + gap, s.queue.length), 0, s.mode === 'lesson' ? s.ex : item);
}

function answerText(item) {
    return `<span class="lang-text">${esc(item.key)}</span>${item.rom && !item.isChar ? ` <span class="muted">(${esc(item.rom)})</span>` : ''} = <strong>${esc(item.def)}</strong>`;
}

function showFeedback(ok, extra = '') {
    const s = app.session;
    const slot = $('#feedback');
    if (!slot) return;
    const ex = exampleFor(s.item);
    slot.innerHTML = `<div class="feedback ${ok ? 'is-right' : 'is-wrong'}">
        <div class="feedback-text">
            <strong>${ok ? 'Correct!' : 'Not quite'}</strong>
            <span>${extra || answerText(s.item)}</span>
            ${mnemonicFor(s.item) ? `<span class="feedback-ex">${richText(mnemonicFor(s.item)[1])}</span>` : ''}
            ${ex ? `<span class="feedback-ex"><span class="lang-text">${esc(ex[0])}</span> ${esc(ex[1])}</span>` : ''}
        </div>
        <button type="button" class="btn ${ok ? 'btn-success' : 'btn-primary'}" data-action="continue" id="continue-btn">Continue <kbd>Enter</kbd></button>
    </div>`;
    s.awaitingContinue = true;
    setTimeout(() => { const b = $('#continue-btn'); if (b) b.focus(); }, 30);
}

function continueSession() {
    const s = app.session;
    if (!s || !s.awaitingContinue) return;
    s.awaitingContinue = false;
    advance();
}

function answerQuiz(index) {
    const s = app.session;
    if (!s || s.locked || !s.q.options || index >= s.q.options.length) return;
    s.locked = true;
    const chosen = s.q.options[index];
    const ok = normalize(chosen) === normalize(s.q.answer);
    $$('.option').forEach((btn, i) => {
        btn.disabled = true;
        const isAnswer = normalize(s.q.options[i]) === normalize(s.q.answer);
        if (isAnswer) btn.classList.add('is-right');
        else if (i === index) btn.classList.add('is-wrong');
    });
    grade(ok);
    if (s.mode === 'speedMatch') {
        setTimeout(advance, ok ? 300 : 900);
    } else if (s.q.audio) {
        // Always reveal what was said, so the sound gets linked to the word.
        showFeedback(ok);
    } else if (s.q.feedback) {
        showFeedback(ok, s.q.feedback);
    } else if (ok) {
        const btn = $$('.option')[index];
        if (btn) { const r = btn.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); }
        setTimeout(advance, 750);
    } else {
        showFeedback(false);
    }
}

function checkTyped(value) {
    const s = app.session;
    if (!s || s.locked) return;
    const typed = value.trim();
    s.locked = true;
    const input = $('#type-input');
    if (input) input.disabled = true;

    let ok;
    if (s.q.digits) {
        ok = !!typed && typed.replace(/\D/g, '') === s.q.answer.replace(/\D/g, '');
    } else {
        // Accept the listed romanization, the standard one, any "a/b" alternative, or the Hangul itself.
        const accepted = new Set([s.q.answer, Hangul.romanize(s.item.key), ...s.q.answer.split('/')].map(compact).filter(Boolean));
        ok = !!typed && (accepted.has(compact(typed)) || typed.replace(/\s/g, '') === s.item.key.replace(/\s/g, ''));
    }
    if (input) input.classList.add(ok ? 'is-right' : 'is-wrong');
    grade(ok);
    showFeedback(ok);
}

function flipCard() {
    const s = app.session;
    if (!s || s.revealed) return;
    s.revealed = true;
    $('#flashcard').classList.add('is-flipped');
    speakItem(s.item);
    $('#fc-actions').innerHTML = `
        <button type="button" class="btn btn-rate rate-again" data-action="rate" data-rating="again"><strong>Again</strong><kbd>1</kbd></button>
        <button type="button" class="btn btn-rate rate-good" data-action="rate" data-rating="good"><strong>Good</strong><kbd>2</kbd></button>
        <button type="button" class="btn btn-rate rate-easy" data-action="rate" data-rating="easy"><strong>Easy</strong><kbd>3</kbd></button>`;
}

function rateCard(rating) {
    const s = app.session;
    if (!s || !s.revealed || s.locked) return;
    s.locked = true;
    if (rating === 'again') {
        s.attempts++;
        s.streak = 0;
        s.missed.set(s.item.id, s.item);
        logActivity({ total: 1 });
        logSkill(false);
        bumpMastery(s.item, -1);
        schedule(s.item, 'again');
        SFX.wrong();
        requeue(s.item, 4);
        save();
    } else {
        grade(true, rating === 'easy' ? { xpRight: 10, gain: 2, rating: 'easy' } : { xpRight: 5, gain: 1 });
    }
    advance();
}

/* Match pairs: boards of up to six pairs, two columns. */
function nextBoard() {
    const s = app.session;
    const batch = s.queue.slice(s.index, s.index + 6);
    if (!batch.length) return finishSession();
    s.index += batch.length;
    s.board = { left: shuffle(batch), right: shuffle(batch), selL: null, selR: null, busy: false };
    updateStudyBar();
    $('#study-body').innerHTML = `<div class="study-card study-card-wide">
        <div class="prompt-label center">Match each word to its meaning</div>
        <div class="match-board">
            <div class="match-col">${s.board.left.map((i, n) => `<button type="button" class="match-item lang-text" data-action="match" data-side="L" data-index="${n}">${esc(i.key)}</button>`).join('')}</div>
            <div class="match-col">${s.board.right.map((i, n) => `<button type="button" class="match-item" data-action="match" data-side="R" data-index="${n}">${esc(i.def)}</button>`).join('')}</div>
        </div></div>`;
}

function pickMatch(side, index, el) {
    const s = app.session;
    const b = s.board;
    if (!b || b.busy || el.classList.contains('is-matched')) return;
    $$(`.match-item[data-side="${side}"]`).forEach(x => x.classList.remove('is-selected'));
    b[side === 'L' ? 'selL' : 'selR'] = { index, el };
    el.classList.add('is-selected');
    if (side === 'L') speak(b.left[index].key);
    if (!b.selL || !b.selR) return;

    const L = b.left[b.selL.index];
    const R = b.right[b.selR.index];
    const lEl = b.selL.el;
    const rEl = b.selR.el;
    b.selL = b.selR = null;
    s.item = L;
    s.attempts++;
    if (L.id === R.id || normalize(L.def) === normalize(R.def)) {
        s.correct++;
        s.streak++;
        s.best = Math.max(s.best, s.streak);
        logActivity({ correct: 1, total: 1 });
        if (!s.missed.has(L.id)) { bumpMastery(L, 1); schedule(L, 'good'); }
        SFX.match();
        haptic('success');
        addXP(6);
        [lEl, rEl].forEach(x => { x.classList.remove('is-selected'); x.classList.add('is-matched'); x.disabled = true; });
        updateStudyBar();
        if (!$$('.match-item:not(.is-matched)').length) {
            b.busy = true;
            setTimeout(nextBoard, 600);
        }
    } else {
        s.streak = 0;
        s.missed.set(L.id, L);
        logActivity({ total: 1 });
        schedule(L, 'again');
        SFX.wrong();
        haptic('error');
        b.busy = true;
        [lEl, rEl].forEach(x => x.classList.add('is-wrong'));
        updateStudyBar();
        save();
        setTimeout(() => { [lEl, rEl].forEach(x => x.classList.remove('is-wrong', 'is-selected')); b.busy = false; }, 650);
    }
}

function finishSession() {
    const s = app.session;
    if (!s || s.done) return;
    s.done = true;
    stopTimer();
    save();
    updateStudyBar();
    const acc = s.attempts ? Math.round(s.correct / s.attempts * 100) : 0;
    let title = s.mode === 'speedMatch' ? "Time's up!" : acc >= 90 ? 'Excellent work!' : acc >= 70 ? 'Nice session!' : 'Session complete';
    let msg = acc >= 90 ? 'You really know these.' : acc >= 70 ? 'Solid progress. Keep it up.' : 'Every miss makes the next try easier.';

    // Guided lessons count as done once the quiz is passed; a passed unit test completes the unit.
    let lessonActions = '';
    let planDone = !!s.plan && (!s.lesson || (s.attempts > 0 && acc >= PASS_PCT));
    if (s.test) {
        const passed = s.attempts > 0 && acc >= UNIT_PASS_PCT;
        const prev = app.store.unitTests[s.test];
        if (passed) {
            app.store.unitTests[s.test] = { best: Math.max(acc, prev ? prev.best : 0), date: dateKey() };
            unitLessons(s.test).forEach(l => { if (!app.store.guided[l.id]) app.store.guided[l.id] = { best: acc, date: dateKey(), tested: true }; });
            save();
        }
        title = passed ? 'Unit passed!' : 'Not yet';
        msg = passed ? `Every lesson in ${s.test} is now complete.` : `Score ${UNIT_PASS_PCT}% or more to pass. Review the lessons, then try again.`;
        const next = nextLesson();
        lessonActions = passed && next ? `<button type="button" class="btn btn-primary btn-lg" data-action="start-lesson" data-lesson="${next.id}">${icon('arrow-right')}Next lesson</button>` : '';
    } else if (s.lesson) {
        const passed = s.attempts > 0 && acc >= PASS_PCT;
        const after = lessonAfter(s.lesson);
        if (passed) {
            planState().lesson = true;
            const prev = app.store.guided[s.lesson];
            app.store.guided[s.lesson] = { best: Math.max(acc, prev ? prev.best : 0), date: dateKey() };
            save();
        }
        title = passed ? 'Lesson complete!' : 'Almost there';
        msg = passed
            ? (after ? `Up next: ${after.title}.` : 'You finished the guided path. Keep reviewing on Home.')
            : `Score ${PASS_PCT}% or more to finish the lesson. Have another look, then try again.`;
        lessonActions = passed && after
            ? `<button type="button" class="btn btn-primary btn-lg" data-action="start-lesson" data-lesson="${after.id}">${icon('arrow-right')}Next lesson</button>`
            : !passed ? `<button type="button" class="btn btn-primary btn-lg" data-action="start-lesson" data-lesson="${s.lesson}">${icon('rotate')}Review the lesson</button>` : '';
    }
    if (planDone) { planState()[s.plan] = true; save(); }
    if (acc >= 80 && s.attempts) confetti();
    const dueLeft = statsFor(allItems()).due;
    const planNext = s.plan ? planSteps().find(st => !st.done) : null;
    checkAchievements();

    const missed = [...s.missed.values()];
    $('#study-body').innerHTML = `<div class="results">
        <div class="results-icon">${icon('trophy')}</div>
        <h2>${title}</h2>
        <p class="muted">${s.attempts ? msg : 'No answers this time.'}${!s.drill && dueLeft ? ` ${plural(dueLeft, 'word')} still due.` : ''}</p>
        <div class="result-stats">
            <div><span>Accuracy</span><strong>${acc}%</strong></div>
            <div><span>Correct</span><strong>${s.correct}<small>/${s.attempts}</small></strong></div>
            <div><span>Best streak</span><strong>${s.best}</strong></div>
            <div><span>XP earned</span><strong class="accent">+${s.xp}</strong></div>
        </div>
        ${missed.length ? `<div class="missed">
            <h3>Words to review</h3>
            <div class="missed-list">${missed.map(i => `
                <button type="button" class="missed-item" data-action="speak" data-text="${esc(i.key)}">
                    <span class="lang-text">${esc(i.key)}</span>
                    <span class="muted">${i.rom && !i.isChar ? esc(i.rom) + ' · ' : ''}${esc(i.def)}</span>
                    ${icon('volume', 'icon-sm')}
                </button>`).join('')}
            </div></div>` : ''}
        ${s.plan ? `<p class="plan-note">${planNext ? `Next in today's plan: <strong>${esc(planNext.label)}</strong>` : "That's today's plan done. 수고했어요!"}</p>` : ''}
        <div class="results-actions">
            ${planNext ? `<button type="button" class="btn btn-primary btn-lg" data-action="plan-start">${icon('arrow-right')}Continue plan</button>` : ''}
            ${s.lesson ? `${lessonActions}
                <button type="button" class="btn ${lessonActions || planNext ? 'btn-secondary' : 'btn-primary'} btn-lg" data-action="restart">${icon('rotate')}${s.test ? 'Retake test' : 'Retake quiz'}</button>
                <button type="button" class="btn btn-ghost btn-lg" data-action="exit-to-learn">Back to path</button>`
            : `${missed.length ? `<button type="button" class="btn btn-primary btn-lg" data-action="practice-missed">${icon('target')}Practice ${plural(missed.length, 'missed word')}</button>` : ''}
                <button type="button" class="btn ${missed.length ? 'btn-secondary' : 'btn-primary'} btn-lg" data-action="restart">${icon('rotate')}Go again</button>
                <button type="button" class="btn btn-ghost btn-lg" data-action="exit-study">Done</button>`}
        </div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Event wiring                                                        */
/* ------------------------------------------------------------------ */
const sessionMode = () => (['speedMatch', 'writing'].includes(app.store.prefs.mode) ? 'quiz' : app.store.prefs.mode);

const actions = {
    'quick-start': () => startSession(),
    'review-due': () => startSession({ items: allItems().filter(i => isDue(i)), mode: sessionMode() }),
    'learn-new': () => {
        const fresh = poolFor(selectedTopicIds()).filter(isNew);
        startSession({ items: fresh.slice(0, app.store.prefs.length || fresh.length), mode: 'flashcards' });
    },
    'start-topic': el => startSession({ topics: [el.dataset.topic] }),
    'browse-topic': el => { app.words = { topic: el.dataset.topic, status: 'all', query: '' }; go('words'); },
    'toggle-topic': el => {
        const sel = new Set(selectedTopicIds(true));
        const id = el.dataset.topic;
        if (sel.has(id)) sel.delete(id); else sel.add(id);
        setSelectedTopics([...sel]);
        rerenderKeepScroll(renderPractice);
    },
    'toggle-group': el => {
        const on = el.dataset.on === '1';
        const ids = getTopics().filter(t => t.group === el.dataset.group && t.items.length).map(t => t.id);
        const sel = new Set(selectedTopicIds(true));
        ids.forEach(id => (on ? sel.add(id) : sel.delete(id)));
        setSelectedTopics([...sel]);
        rerenderKeepScroll(renderPractice);
    },
    'set-mode': el => { app.store.prefs.mode = el.dataset.mode; save(); rerenderKeepScroll(renderPractice); },
    'set-length': el => { app.store.prefs.length = Number(el.dataset.length); save(); rerenderKeepScroll(renderPractice); },
    'start-practice': () => startSession({ topics: selectedTopicIds(true) }),
    'num-style': el => { app.store.prefs.numStyle = el.dataset.value; save(); rerenderKeepScroll(renderNumbers); },
    'num-level': el => { app.store.prefs.numLevel = Number(el.dataset.value); save(); rerenderKeepScroll(renderNumbers); },
    'start-drill': el => startDrill(el.dataset.drill),
    'words-status': el => {
        app.words.status = el.dataset.status;
        $$('[data-action="words-status"]').forEach(b => { const on = b === el; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
        renderWordResults();
    },
    'practice-shown': () => startSession({ items: shownWords().shown }),
    'speak': el => { speak(el.dataset.text); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); },
    'delete-word': el => {
        delete app.store.customList.korean[el.dataset.key];
        invalidateTopics();
        save();
        renderWordResults();
        toast('Word removed.');
    },
    'clear-custom': async () => {
        if (!await confirmDialog({ title: 'Clear all your words?', body: 'This removes every word you added yourself.', confirm: 'Clear all', danger: true })) return;
        app.store.customList.korean = {};
        invalidateTopics();
        save();
        renderWordResults();
    },
    'set-theme': el => { applyTheme(el.dataset.value); renderSettings(); },
    'set-goal': el => { app.store.dailyGoal = Number(el.dataset.value); save(); renderSettings(); },
    'test-speech': () => speak('안녕하세요'),
    'export': exportProgress,
    'import': () => $('#import-file').click(),
    'copy-transfer': async () => {
        const code = await makeTransferCode();
        try {
            await navigator.clipboard.writeText(code);
            toast(`Transfer code copied (${Math.round(code.length / 1000) || 1}k characters).`, 'success');
        } catch (e) {
            openTransferDialog(code);
        }
    },
    'enter-transfer': () => openTransferDialog(''),
    'reset': async () => {
        if (!await confirmDialog({ title: 'Reset all progress?', body: 'This permanently deletes your XP, streak, levels, reviews, history, and custom words in this browser.', confirm: 'Reset everything', danger: true })) return;
        app.store = defaults();
        loadProgressFromStore();
        toast('Progress reset.');
    },
    'exit-study': () => exitSession(),
    'replay-audio': () => { if (app.session && app.session.item) speakItem(app.session.item); },
    'start-lesson': el => startLesson(el.dataset.lesson),
    'start-test': el => startSession({ items: lessonItems(lessonById(`test:${el.dataset.unit}`)), mode: 'lesson', reverse: false, lesson: `test:${el.dataset.unit}` }),
    'skip-exercise': () => { const s = app.session; if (s && !s.locked) { Speaking.stop(); advance(); } },
    'plan-start': () => { const step = planSteps().find(st => !st.done); if (step) step.run(); else toast("That's today's plan done!", 'success'); },
    'welcome-skip': () => welcomeNext(''),
    'welcome-start': el => finishWelcome(el.dataset.start),
    'learn-tab': el => { app.learnTab = el.dataset.tab; renderLearn(); },
    'trace-group': el => startSession({ topics: [el.dataset.topic], mode: 'writing' }),
    'teach-next': () => teachStep(1),
    'teach-back': () => teachStep(-1),
    'build-tile': el => pickBuildTile(Number(el.dataset.index)),
    'build-undo': () => { const s = app.session; if (s && s.build && !s.locked) { s.build.picked.pop(); s.build.note = s.build.picked.length ? 'Pick again.' : 'Start with a consonant, then add a vowel.'; renderBuild(); } },
    'order-pick': el => pickOrderTile(Number(el.dataset.index)),
    'order-remove': el => removeOrderTile(Number(el.dataset.pos)),
    'check-exercise': () => checkExercise(),
    'builder': el => { app.builder[el.dataset.part] = el.dataset.value; renderBuilder(); const syl = builderSyllable(); if (syl) speak(syl); },
    'exit-to-learn': () => { exitSession(); go('learn'); },
    'answer': el => answerQuiz(Number(el.dataset.index)),
    'continue': () => continueSession(),
    'flip': () => flipCard(),
    'rate': el => rateCard(el.dataset.rating),
    'skip': () => checkTyped(''),
    'match': el => pickMatch(el.dataset.side, Number(el.dataset.index), el),
    'practice-missed': () => {
        const s = app.session;
        startSession({ items: [...s.missed.values()], mode: s.mode === 'speedMatch' ? 'quiz' : s.mode, reverse: s.reverse });
    },
    'restart': () => {
        const s = app.session;
        if (s.drill) startDrill(s.drill);
        else startSession({ topics: s.topics, items: s.items, mode: s.mode, reverse: s.reverse, lesson: s.lesson });
    }
};

function loadProgressFromStore() {
    save();
    loadProgress();
    invalidateTopics();
    renderView();
}

// The transfer dialog shows a code to copy (when the clipboard is blocked) or takes one to paste.
function openTransferDialog(code) {
    const dlg = $('#transfer-dialog');
    const ta = $('#transfer-text');
    ta.value = code;
    ta.readOnly = !!code;
    $('#transfer-title').textContent = code ? 'Copy this code' : 'Enter a transfer code';
    $('#transfer-hint').textContent = code ? 'Select all and copy it, then paste it on your other device.' : 'Paste the code you copied on your other device. This replaces your progress here.';
    $('#transfer-ok').hidden = !!code;
    dlg.returnValue = '';
    dlg.showModal();
    if (code) ta.select(); else ta.focus();
    dlg.addEventListener('close', async () => {
        if (dlg.returnValue !== 'ok' || code) return;
        try { await restoreProgress(await readTransferCode(ta.value)); }
        catch (e) { toast("That code didn't work. Copy it again and paste the whole thing.", 'error'); }
    }, { once: true });
}

function rerenderKeepScroll(render) {
    const y = window.scrollY;
    render();
    window.scrollTo({ top: y });
}

function showTip(el) {
    const tip = $('#chart-tip');
    const [title, body] = el.dataset.tip.split('|');
    tip.innerHTML = `<strong>${esc(title)}</strong><span>${esc(body)}</span>`;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    tip.style.left = `${Math.max(8, Math.min(window.innerWidth - tr.width - 8, r.left + r.width / 2 - tr.width / 2))}px`;
    tip.style.top = `${r.top - tr.height - 8 < 8 ? r.bottom + 8 : r.top - tr.height - 8}px`;
}

function bindEvents() {
    document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        if (!el || el.disabled) return;
        const fn = actions[el.dataset.action];
        if (fn) { e.preventDefault(); fn(el, e); }
    });

    document.addEventListener('pointerover', e => {
        const el = e.target.closest('[data-tip]');
        if (el) showTip(el); else $('#chart-tip').hidden = true;
    });
    window.addEventListener('scroll', () => { $('#chart-tip').hidden = true; }, { passive: true });

    document.addEventListener('submit', e => {
        const form = e.target.closest('[data-form]');
        if (!form) return;
        e.preventDefault();
        if (form.dataset.form === 'typing') checkTyped($('#type-input').value);
        if (form.dataset.form === 'welcome-name') welcomeNext($('#welcome-name').value.trim().slice(0, 30));
        if (form.dataset.form === 'add-words') {
            const input = $('#add-words-input');
            if (input.value.trim()) addCustomWords(input.value).then(() => { const i = $('#add-words-input'); if (i) i.value = ''; });
        }
    });

    document.addEventListener('input', e => {
        if (e.target.id === 'words-search') { app.words.query = e.target.value; renderWordResults(); }
        if (e.target.id === 'num-input') renderNumberReading(e.target.value);
        if (e.target.id === 'notes-search') {
            app.notesQuery = e.target.value;
            const pos = e.target.selectionStart;
            renderLearn();
            const box = $('#notes-search');
            box.focus();
            box.setSelectionRange(pos, pos);
        }
        if (e.target.id === 'speech-rate') {
            app.store.speechRate = parseFloat(e.target.value);
            $('#speech-rate-val').textContent = `${app.store.speechRate.toFixed(2)}×`;
            save();
        }
    });

    document.addEventListener('change', e => {
        const t = e.target;
        if (t.id === 'words-topic') { app.words.topic = t.value; renderWordResults(); }
        if (t.id === 'profile-name') { app.store.name = t.value.trim().slice(0, 30); save(); toast(app.store.name ? `We'll call you ${app.store.name}.` : 'Name cleared.', 'success'); }
        if (t.dataset.pref) { app.store.prefs[t.dataset.pref] = t.checked; save(); }
        if (t.dataset.setting) { app.store[t.dataset.setting] = t.checked; save(); }
        if (t.id === 'import-file' && t.files[0]) { importProgress(t.files[0]); t.value = ''; }
    });

    document.addEventListener('keydown', e => {
        const s = app.session;
        const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.disabled;

        if (e.key === 'Escape') {
            if ($('dialog[open]')) return;
            if (s) { exitSession(); return; }
        }

        // Role="button" cards respond to Enter/Space like real buttons.
        if (!s && (e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) {
            e.preventDefault();
            e.target.click();
            return;
        }

        if (!s || $('#study').hidden) return;

        if (s.done) {
            if (e.key === 'Enter' && e.target === document.body) actions.restart();
            return;
        }
        if (s.mode === 'teach') {
            const dir = { 'Enter': 1, ' ': 1, 'ArrowRight': 1, 'ArrowLeft': -1 }[e.key];
            if (dir) { e.preventDefault(); teachStep(dir); }
            else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) actions['replay-audio']();
            return;
        }
        if (s.awaitingContinue && (e.key === 'Enter' || (e.key === ' ' && !inField))) {
            e.preventDefault();
            continueSession();
            return;
        }
        // The Hangul keyboard takes letter keys by position, before any other shortcut.
        if (s.kb && handleKoKey(e)) return;
        if (inField) return;

        if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) { actions['replay-audio'](); return; }

        if (s.ex && ['build', 'order', 'write', 'speak'].includes(s.ex.kind)) {
            if (e.key === 'Enter') { e.preventDefault(); checkExercise(); }
            else if (e.key === 'Backspace' && (s.build || s.order)) { e.preventDefault(); actions[s.build ? 'build-undo' : 'order-remove']({ dataset: { pos: s.order ? s.order.picked.length - 1 : 0 } }); }
            return;
        }
        if ((['quiz', 'speedMatch', 'listening'].includes(s.mode) || (s.mode === 'lesson' && s.q.options)) && /^[1-4]$/.test(e.key)) {
            answerQuiz(Number(e.key) - 1);
        } else if (s.mode === 'flashcards') {
            if (!s.revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flipCard(); }
            else if (s.revealed) {
                const r = { '1': 'again', 'ArrowLeft': 'again', '2': 'good', 'ArrowDown': 'good', '3': 'easy', 'ArrowRight': 'easy' }[e.key];
                if (r) { e.preventDefault(); rateCard(r); }
            }
        }
    });

    window.addEventListener('hashchange', () => {
        if (app.session) exitSession(); else renderView();
        window.scrollTo({ top: 0 });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (themePref() === 'system') applyTheme('system');
    });

    // Voices load asynchronously; refresh Settings so the voice name shows up.
    if (window.speechSynthesis) window.speechSynthesis.addEventListener('voiceschanged', () => { if (app.view === 'settings') renderSettings(); });
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
function init() {
    loadProgress();
    applyTheme();
    bindEvents();
    document.documentElement.style.setProperty('--accent', LANG.accent);

    // Old ?tab= links map onto the new views.
    const params = new URLSearchParams(location.search);
    const legacyTab = { dashboard: 'home', practice: 'practice', mastery: 'words', 'class-words': 'words', library: 'words', settings: 'settings' }[params.get('tab')];
    if (params.get('tab') === 'library') app.words.topic = 'custom';
    if (params.has('tab') || params.has('lang')) history.replaceState(null, '', location.pathname + (legacyTab ? `#/${legacyTab}` : location.hash));

    save();
    checkAchievements();
    renderView();
    if (app.freezeUsed) toast('A streak freeze covered yesterday. Your streak is safe.', 'success');

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
    }
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
}

document.addEventListener('DOMContentLoaded', init);
