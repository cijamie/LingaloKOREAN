// LingaloKR achievements, today's plan, and the progress panel on Home.
// Loaded after app.js; uses its helpers and registers its own actions.
'use strict';

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */
const unitDone = unit => unitLessons(unit).every(l => lessonDone(l.id));
const skillCorrect = k => (app.store.skills[k] || { c: 0 }).c;
const knownWords = () => statsFor(allItems()).mastered;
const goalDays = () => Object.values(app.store.history).filter(h => h.xp >= app.store.dailyGoal).length;

const ACHIEVEMENTS = [
    { id: 'first_lesson', icon: 'learn', title: 'First steps', desc: 'Finish your first lesson', test: () => Object.keys(app.store.guided).length >= 1 },
    { id: 'hangul', icon: 'book', title: 'Hangul reader', desc: 'Finish the Read Hangul unit', test: () => unitDone('Read Hangul') },
    { id: 'first_words', icon: 'book', title: 'Word collector', desc: 'Finish the First words unit', test: () => unitDone('First words') },
    { id: 'sentences', icon: 'book', title: 'Sentence builder', desc: 'Finish the Sentences unit', test: () => unitDone('Sentences') },
    { id: 'conversations', icon: 'book', title: 'Conversationalist', desc: 'Finish the Conversations unit', test: () => unitDone('Conversations') },
    { id: 'course', icon: 'trophy', title: 'Course complete', desc: 'Finish every lesson in the course', test: () => !nextLesson() },
    { id: 'unit_test', icon: 'target', title: 'Tested', desc: 'Pass a unit test', test: () => Object.keys(app.store.unitTests).length >= 1 },
    { id: 'perfect', icon: 'star', title: 'Flawless', desc: 'Score 100% on a lesson', test: () => Object.values(app.store.guided).some(g => g.best === 100 && !g.tested) },
    { id: 'streak3', icon: 'flame', title: 'Warming up', desc: 'Reach a 3-day streak', test: () => app.store.streak >= 3 },
    { id: 'streak7', icon: 'flame', title: 'On fire', desc: 'Reach a 7-day streak', test: () => app.store.streak >= 7 },
    { id: 'streak30', icon: 'flame', title: 'Unstoppable', desc: 'Reach a 30-day streak', test: () => app.store.streak >= 30 },
    { id: 'goal7', icon: 'target', title: 'Goal getter', desc: 'Meet your daily goal on 7 days', test: () => goalDays() >= 7 },
    { id: 'words50', icon: 'star', title: '50 words', desc: 'Master 50 words', test: () => knownWords() >= 50 },
    { id: 'words150', icon: 'star', title: '150 words', desc: 'Master 150 words', test: () => knownWords() >= 150 },
    { id: 'words300', icon: 'star', title: '300 words', desc: 'Master 300 words', test: () => knownWords() >= 300 },
    { id: 'speaker', icon: 'mic', title: 'Speaking up', desc: 'Say 10 words correctly', test: () => skillCorrect('speaking') >= 10 },
    { id: 'scribe', icon: 'pen', title: 'Scribe', desc: 'Trace 10 letters correctly', test: () => skillCorrect('writing') >= 10 },
    { id: 'typist', icon: 'keyboard', title: 'Typist', desc: 'Type 10 answers in Hangul', test: () => skillCorrect('typing') >= 10 },
    { id: 'xp1000', icon: 'zap', title: '1,000 XP', desc: 'Earn 1,000 XP in total', test: () => (app.store.lifetimeXP || 0) >= 1000 },
    { id: 'plan', icon: 'check', title: 'Planner', desc: "Finish all of today's plan", test: () => planSteps().every(st => st.done) && Object.values(planState()).some(Boolean) }
];

// Unlock anything newly earned; announce each one.
function checkAchievements() {
    const got = app.store.achievements;
    const fresh = ACHIEVEMENTS.filter(a => !got[a.id] && a.test());
    if (!fresh.length) return;
    fresh.forEach(a => { got[a.id] = dateKey(); });
    save();
    fresh.forEach((a, i) => setTimeout(() => toast(`Achievement unlocked: ${a.title}`, 'success'), 400 + i * 700));
}

function achievementsPanel() {
    const got = app.store.achievements;
    const count = ACHIEVEMENTS.filter(a => got[a.id]).length;
    return `<section class="section">
        <div class="section-head"><h2>Achievements</h2><span class="muted small">${count} of ${ACHIEVEMENTS.length}</span></div>
        <div class="badge-grid">${ACHIEVEMENTS.map(a => `
            <div class="badge ${got[a.id] ? 'is-earned' : ''}" title="${esc(a.desc)}${got[a.id] ? ` · earned ${esc(got[a.id])}` : ''}">
                <span class="badge-icon">${icon(a.icon)}</span>
                <span><strong>${esc(a.title)}</strong><small>${esc(a.desc)}</small></span>
            </div>`).join('')}
        </div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* Today's plan: review, one lesson, one skill drill                   */
/* ------------------------------------------------------------------ */
function planState() {
    const today = dateKey();
    if (app.store.daily.date !== today) app.store.daily = { date: today, done: {} };
    return app.store.daily.done;
}

// The drill rotates by day between the skills this device supports, using words you've already met.
function todaysDrill() {
    const learned = allItems().filter(i => deck()[i.id]);
    const options = [
        Speaking.supported && { mode: 'speaking', label: 'Speaking drill', sub: 'Say 6 words you know out loud', items: learned.filter(i => !i.isChar) },
        { mode: 'hangulTyping', label: 'Typing drill', sub: 'Type 6 words in Hangul', items: learned },
        { mode: 'writing', label: 'Writing drill', sub: 'Trace 6 letters', items: !learned.length ? [] : learned.filter(canWrite).length ? learned.filter(canWrite) : poolFor(['consonants', 'vowels']) },
        koreanVoice() && { mode: 'listening', label: 'Listening drill', sub: 'Hear 6 words and pick the meaning', items: learned }
    ].filter(o => o && o.items.length);
    if (!options.length) return null;
    const pick = options[dayNum() % options.length];
    return { ...pick, items: shuffle(pick.items).slice(0, 6) };
}

function planSteps() {
    const done = planState();
    const due = allItems().filter(i => isDue(i));
    const next = nextLesson() || nextClassLesson();
    const drill = todaysDrill();
    return [
        {
            id: 'review', icon: 'rotate', label: due.length ? `Review ${plural(due.length, 'due word')}` : 'Review', sub: due.length ? 'Words you are about to forget' : 'Nothing due right now',
            done: !!done.review || !due.length, run: () => startSession({ items: due, mode: sessionMode(), plan: 'review' })
        },
        {
            id: 'lesson', icon: 'learn', label: next ? `Lesson: ${next.title}` : 'Lesson', sub: next ? next.unit : 'Every lesson is done',
            done: !!done.lesson || !next, run: () => startLesson(next.id, 'lesson')
        },
        {
            id: 'drill', icon: drill ? MODES[drill.mode].icon : 'zap', label: drill ? drill.label : 'Skill drill', sub: drill ? drill.sub : 'Unlocks after your first lesson',
            done: !!done.drill || !drill, run: () => startSession({ items: drill.items, mode: drill.mode, plan: 'drill' })
        }
    ];
}

function planPanel() {
    const steps = planSteps();
    const left = steps.filter(st => !st.done).length;
    const course = courseLessons();
    const doneLessons = course.filter(l => lessonDone(l.id)).length;
    return `<section class="panel plan">
        <div class="plan-head">
            <div>
                <strong>Today's plan</strong>
                <span class="muted small">${left ? `${plural(left, 'step')} left · about ${left * 5} minutes` : 'All done for today. 수고했어요!'}</span>
            </div>
            ${left ? `<button type="button" class="btn btn-primary" data-action="plan-start">${icon('play', 'icon-sm')}${Object.values(planState()).some(Boolean) ? 'Continue' : 'Start'}</button>` : ''}
        </div>
        <ol class="plan-steps">${steps.map(st => `
            <li class="${st.done ? 'is-done' : ''}">
                <span class="plan-check">${st.done ? icon('check', 'icon-sm') : icon(st.icon, 'icon-sm')}</span>
                <span><strong>${esc(st.label)}</strong><small>${esc(st.sub)}</small></span>
            </li>`).join('')}
        </ol>
        <div class="plan-course"><span class="muted small">Course: ${doneLessons} of ${course.length} lessons</span>${bar(Math.round(doneLessons / course.length * 100))}</div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* Progress panel                                                      */
/* ------------------------------------------------------------------ */
function progressPanel() {
    const units = UNITS.map(u => {
        const ls = unitLessons(u.name);
        const done = ls.filter(l => lessonDone(l.id)).length;
        return `<div class="progress-row">
            <span>${esc(u.name)}${app.store.unitTests[u.name] ? ` <span class="tag tag-native">Test ${app.store.unitTests[u.name].best}%</span>` : ''}</span>
            ${bar(ls.length ? Math.round(done / ls.length * 100) : 0)}
            <span class="muted small">${done}/${ls.length}</span>
        </div>`;
    }).join('');
    const skills = Object.entries(SKILLS).map(([k, label]) => {
        const r = app.store.skills[k];
        return `<div class="progress-row">
            <span>${label}</span>
            ${bar(r && r.t ? Math.round(r.c / r.t * 100) : 0)}
            <span class="muted small">${r && r.t ? `${Math.round(r.c / r.t * 100)}% of ${r.t}` : '–'}</span>
        </div>`;
    }).join('');
    const classItems = uniqueItems(getTopics().filter(t => t.group === 'Class lessons').map(t => t.items));
    const cls = statsFor(classItems);
    const all = statsFor(allItems());
    return `<section class="section">
        <div class="section-head"><h2>Progress</h2></div>
        <div class="progress-grid">
            <div class="panel">
                <div class="panel-head"><h2>Course</h2></div>
                ${units}
            </div>
            <div class="panel">
                <div class="panel-head"><h2>Skills</h2><span class="muted small">accuracy</span></div>
                ${skills}
            </div>
            <div class="panel progress-words">
                <div class="panel-head"><h2>Words</h2></div>
                <div class="big-stat"><strong>${all.mastered}</strong><span>words mastered</span></div>
                <div class="big-stat"><strong>${all.seen}</strong><span>words met</span></div>
                <div class="big-stat"><strong>${cls.pct}%</strong><span>of your class word list mastered</span></div>
            </div>
        </div>
    </section>`;
}
