// LingaloKR data and helper checks. Run with:  node tests/check.js
// Loads the data files the way the browser does and checks that lessons, letters,
// stroke data and the Korean helpers all hold together. Exits non-zero on any failure.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const files = ['js/hangul.js', 'js/data.js', 'js/korean_class_words.js', 'js/examples.js', 'js/lessons.js', 'js/strokes.js'];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n') +
    '\n;this.out = { Hangul, TOPICS, LESSONS, UNITS, MNEMONICS, STROKES, KOREAN_CLASS_LESSONS };', ctx);
const { Hangul, TOPICS, LESSONS, UNITS, MNEMONICS, STROKES, KOREAN_CLASS_LESSONS } = ctx.out;

let failures = 0;
let checks = 0;
function check(ok, message) {
    checks++;
    if (!ok) { failures++; console.log('FAIL', message); }
}
const eq = (actual, expected, message) => check(actual === expected, `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

/* Lessons */
const topicKeys = id => {
    const t = TOPICS.find(x => x.id === id);
    if (t) return new Set(Object.keys(t.words));
    const l = KOREAN_CLASS_LESSONS.find(x => `class_${x.id}` === id);
    return l ? new Set(l.words.map(w => w.word)) : null;
};
const ids = new Set();
LESSONS.forEach(l => {
    check(!ids.has(l.id), `duplicate lesson id ${l.id}`);
    ids.add(l.id);
    check(UNITS.some(u => u.name === l.unit), `${l.id}: unknown unit ${l.unit}`);
    check(l.items.length > 0, `${l.id}: no items`);
    l.items.forEach(([topic, keys]) => {
        const known = topicKeys(topic);
        check(!!known, `${l.id}: unknown topic ${topic}`);
        if (known) keys.forEach(k => check(known.has(k), `${l.id}: ${topic} has no "${k}"`));
    });
    (l.build || []).forEach(b => check(!!Hangul.split(b), `${l.id}: build "${b}" is not a syllable`));
    (l.concepts || []).forEach(c => {
        check(!!c.title, `${l.id}: concept without a title`);
        (c.blocks || []).forEach(b => check(!!Hangul.split(b), `${l.id}: block "${b}" is not a syllable`));
        if (c.table) c.table.rows.forEach(r => check(r.length === c.table.head.length, `${l.id}: table row width in "${c.title}"`));
    });
});

/* Letters: every letter has a mnemonic and stroke data with points on the grid */
['consonants', 'vowels', 'doubleConsonants', 'diphthongs'].forEach(id => {
    Object.keys(TOPICS.find(t => t.id === id).words).forEach(letter => {
        check(!!MNEMONICS[letter], `no mnemonic for ${letter}`);
        const strokes = STROKES[letter];
        check(Array.isArray(strokes) && strokes.length > 0, `no strokes for ${letter}`);
        (strokes || []).forEach(s => s.forEach(([x, y]) => check(x >= 0 && x <= 100 && y >= 0 && y <= 100, `${letter}: point off the grid`)));
    });
});

/* Syllable blocks */
eq(Hangul.join('ㄱ', 'ㅏ', 'ㅇ'), '강', 'join');
eq(Hangul.join('ㄱ', 'ㄱ'), null, 'join rejects two consonants');
eq(JSON.stringify(Hangul.split('읽')), JSON.stringify({ initial: 'ㅇ', vowel: 'ㅣ', final: 'ㄺ' }), 'split');

/* Typing: keys → text, as a Korean keyboard composes them */
const typed = keys => Hangul.compose([...keys]);
eq(typed('ㄱㅏㅇ'), '강', 'compose one block');
eq(typed('ㅎㅏㄴㄱㅜㄱ'), '한국', 'compose two blocks');
eq(typed('ㅇㅣㄹㄱㅇㅓㅇㅛ'), '읽어요', 'compose double final');
eq(typed('ㄷㅏㄹㄱ'), '닭', 'compose double final at the end');
eq(typed('ㅇㅓㅂㅅㅇㅓㅇㅛ'), '없어요', 'compose ㅄ');
eq(typed('ㄱㅏㄴㅏ'), '가나', 'final moves to the next block');
eq(typed('ㅇㅗㅏ'), '와', 'compound vowel');
eq(typed('ㄱㅏㄸ'), '가ㄸ', 'ㄸ cannot be a final');
eq(typed('ㅎㅏㄴ ㄱㅜㄱ'), '한 국', 'space');
eq(typed('ㄱ'), 'ㄱ', 'lone consonant');

/* Particles */
const particle = w => (Hangul.particleOf(w) || {}).particle || null;
eq(particle('책을'), '을', 'particle 을');
eq(particle('커피를'), '를', 'particle 를');
eq(particle('저는'), '는', 'particle 는');
eq(particle('날씨가'), '가', 'particle 가');
eq(particle('카페에서'), '에서', 'particle 에서');
eq(particle('학교에'), '에', 'particle 에');
eq(particle('같이'), null, '같이 is not a particle');
eq(particle('읽어요'), null, 'verb has no particle');
eq(particle('아이'), null, '아이 is a noun');

/* Speech matching */
eq(Hangul.similarity('감사합니다', '감사합니다'), 1, 'identical');
check(Hangul.similarity('감사합니다', '감사함니다') >= 0.85, 'one-letter slip counts as close');
check(Hangul.similarity('가요', '나요') < 0.85, 'different short words are not close');

/* Romanization spot checks */
eq(Hangul.romanize('한국어'), 'hangugeo', 'romanize linking');
eq(Hangul.romanize('감사합니다'), 'gamsahamnida', 'romanize nasalization');

console.log(`${checks - failures}/${checks} checks passed · ${LESSONS.length} lessons`);
process.exit(failures ? 1 : 0);
