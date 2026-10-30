// LingaloKR Hangul helpers: Revised Romanization and Korean number readings.

const Hangul = (() => {
    const INITIALS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
    const VOWELS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
    // Sound of each final consonant (jongseong index) before a consonant or at the end of a word.
    const FINAL_SOUND = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
    // Before a vowel (next syllable starts with ㅇ): [what stays, what moves over].
    const LINK = {
        1: ['', 'g'], 2: ['', 'kk'], 3: ['k', 's'], 4: ['', 'n'], 5: ['n', 'j'], 6: ['n', ''], 7: ['', 'd'], 8: ['', 'r'],
        9: ['l', 'g'], 10: ['l', 'm'], 11: ['l', 'b'], 12: ['l', 's'], 13: ['l', 't'], 14: ['l', 'p'], 15: ['l', ''],
        16: ['', 'm'], 17: ['', 'b'], 18: ['p', 's'], 19: ['', 's'], 20: ['', 'ss'], 21: ['ng', ''], 22: ['', 'j'],
        23: ['', 'ch'], 24: ['', 'k'], 25: ['', 't'], 26: ['', 'p'], 27: ['', '']
    };
    // ㄱ/ㄷ/ㅂ + ㅎ keeps the h in writing (백화점 = baekhwajeom), as RR does for nouns.
    const NASAL = { k: 'ng', t: 'n', p: 'm' };

    function parse(ch) {
        const code = ch.charCodeAt(0) - 0xac00;
        if (code < 0 || code > 11171) return null;
        return { ini: Math.floor(code / 588), vow: Math.floor((code % 588) / 28), fin: code % 28 };
    }

    function romanize(text) {
        const chars = [...String(text || '')];
        const syl = chars.map(parse);
        // Default spelling of every syllable, then sound changes at each boundary.
        const parts = syl.map((s, n) => s && {
            ini: s.ini === 5 && !(syl[n - 1] && syl[n - 1].fin) ? 'r' : INITIALS[s.ini],
            vow: VOWELS[s.vow],
            fin: FINAL_SOUND[s.fin]
        });

        for (let n = 0; n < syl.length - 1; n++) {
            const a = syl[n], b = syl[n + 1];
            if (!a || !b || !a.fin) continue;
            const pa = parts[n], pb = parts[n + 1];
            const sound = FINAL_SOUND[a.fin];

            if (b.ini === 11) {                                   // next starts with a vowel: link
                [pa.fin, pb.ini] = LINK[a.fin];
            } else if ([6, 15, 27].includes(a.fin) && [0, 3, 12].includes(b.ini)) { // ㅎ + ㄱ/ㄷ/ㅈ
                pa.fin = a.fin === 6 ? 'n' : a.fin === 15 ? 'l' : '';
                pb.ini = b.ini === 0 ? 'k' : b.ini === 3 ? 't' : 'ch';
            } else if (b.ini === 5) {                             // ㄹ after a final
                if (sound === 'n' || sound === 'l') { pa.fin = 'l'; pb.ini = 'l'; }
                else { pa.fin = NASAL[sound] || sound; pb.ini = 'n'; }
            } else if (b.ini === 2 && sound === 'l') {            // ㄹ + ㄴ
                pb.ini = 'l';
            } else if ((b.ini === 2 || b.ini === 6) && NASAL[sound]) { // nasalization
                pa.fin = NASAL[sound];
            }
        }
        return chars.map((c, n) => (parts[n] ? parts[n].ini + parts[n].vow + parts[n].fin : c)).join('');
    }

    /* ---- Syllable blocks ---- */
    const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
    const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
    const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

    // 강 → { initial: 'ㄱ', vowel: 'ㅏ', final: 'ㅇ' }
    function split(ch) {
        const p = parse(ch || '');
        return p && { initial: CHO[p.ini], vowel: JUNG[p.vow], final: JONG[p.fin] };
    }

    // ('ㄱ', 'ㅏ', 'ㅇ') → 강, or null when the letters can't form a block.
    function join(initial, vowel, final = '') {
        const i = CHO.indexOf(initial), v = JUNG.indexOf(vowel), f = JONG.indexOf(final);
        return i < 0 || v < 0 || f < 0 || !initial || !vowel ? null : String.fromCharCode(0xac00 + i * 588 + v * 28 + f);
    }

    const isConsonant = ch => !!ch && CHO.includes(ch);
    const isVowel = ch => !!ch && JUNG.includes(ch);

    /* ---- Typing: turn a list of keyed letters into text, like a Korean keyboard does ---- */
    const VOWEL_PAIRS = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ' };
    const FINAL_PAIRS = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };
    const FINAL_SPLIT = Object.fromEntries(Object.entries(FINAL_PAIRS).map(([pair, f]) => [f, [...pair]]));

    // ['ㄷ','ㅏ','ㄹ','ㄱ'] → 닭 · ['ㅇ','ㅣ','ㄹ','ㄱ','ㅓ'] → 일거 (a final moves to the next block before a vowel).
    function compose(keys) {
        let out = '';
        let cur = null;
        const flush = () => {
            if (cur) out += cur.i && cur.v ? join(cur.i, cur.v, cur.f || '') : cur.i || cur.v;
            cur = null;
        };
        for (const k of keys) {
            if (isConsonant(k)) {
                if (cur && cur.i && cur.v && !cur.f && JONG.includes(k)) cur.f = k;
                else if (cur && cur.f && FINAL_PAIRS[cur.f + k]) cur.f = FINAL_PAIRS[cur.f + k];
                else { flush(); cur = { i: k }; }
            } else if (isVowel(k)) {
                if (cur && cur.i && !cur.v) cur.v = k;
                else if (cur && cur.v && !cur.f && VOWEL_PAIRS[cur.v + k]) cur.v = VOWEL_PAIRS[cur.v + k];
                else if (cur && cur.i && cur.f) {
                    const [keep, move] = FINAL_SPLIT[cur.f] || ['', cur.f];
                    cur.f = keep;
                    flush();
                    cur = { i: move, v: k };
                } else { flush(); cur = { v: k }; }
            } else { flush(); out += k; }
        }
        flush();
        return out;
    }

    /* ---- Particles: 책을 → { stem: '책', particle: '을' } ---- */
    const PARTICLES = ['에서', '을', '를', '은', '는', '이', '가', '에'];
    // Which particles need a final consonant before them (true), no final (false), or either (null).
    const PARTICLE_NEEDS_FINAL = { '을': true, '은': true, '이': true, '를': false, '는': false, '가': false, '에': null, '에서': null };
    const NOT_PARTICLES = new Set(['같이', '여기', '거기', '저기', '아이', '오이']);

    function particleOf(token) {
        const word = String(token || '').replace(/[?.!,]/g, '');
        if (NOT_PARTICLES.has(word)) return null;
        for (const p of PARTICLES) {
            if (!word.endsWith(p) || word.length <= p.length) continue;
            const stem = word.slice(0, -p.length);
            const last = split(stem[stem.length - 1]);
            if (!last) continue;
            const need = PARTICLE_NEEDS_FINAL[p];
            if (need !== null && need !== !!last.final) continue;
            return { stem, particle: p, final: !!last.final };
        }
        return null;
    }

    /* ---- How alike two Korean strings are (0–1), compared letter by letter ---- */
    const letters = s => [...String(s || '')].flatMap(ch => {
        const p = split(ch);
        return p ? [p.initial, p.vowel, p.final].filter(Boolean) : /[가-힣ㄱ-ㅣ0-9a-z]/i.test(ch) ? [ch] : [];
    });

    function similarity(a, b) {
        const x = letters(a), y = letters(b);
        if (!x.length && !y.length) return 1;
        const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
        for (let j = 1; j <= y.length; j++) d[0][j] = j;
        for (let i = 1; i <= x.length; i++) {
            for (let j = 1; j <= y.length; j++) {
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
            }
        }
        return 1 - d[x.length][y.length] / Math.max(x.length, y.length);
    }

    /* ---- Numbers ---- */
    const SINO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const SINO_UNITS = ['', '십', '백', '천'];
    const BIG_UNITS = ['', '만', '억', '조'];

    // Sino-Korean reading, spaced by 만 groups as in standard spelling (e.g. 이만 오천).
    function sino(num) {
        let n = Math.floor(Math.abs(num));
        if (n === 0) return '영';
        const groups = [];
        let g = 0;
        while (n > 0) {
            const chunk = n % 10000;
            if (chunk) {
                let s = '';
                const digits = String(chunk).padStart(4, '0');
                for (let i = 0; i < 4; i++) {
                    const d = +digits[i];
                    const unit = SINO_UNITS[3 - i];
                    if (d) s += (d === 1 && unit ? '' : SINO_DIGITS[d]) + unit;
                }
                if (g === 1 && chunk === 1) s = '';
                groups.unshift(s + BIG_UNITS[g]);
            }
            n = Math.floor(n / 10000);
            g++;
        }
        return groups.join(' ');
    }

    const NATIVE_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
    const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
    const COUNTER_FORM = { '하나': '한', '둘': '두', '셋': '세', '넷': '네' };

    // Native Korean reading for 1–99.
    function native(n) {
        if (n < 1 || n > 99) return null;
        return NATIVE_TENS[Math.floor(n / 10)] + NATIVE_ONES[n % 10];
    }

    // The shortened form used right before a counter: 한 개, 두 명, 스무 살, 스물한 살.
    function nativeCounter(n) {
        if (n < 1 || n > 99) return null;
        if (n === 20) return '스무';
        const ones = NATIVE_ONES[n % 10];
        return NATIVE_TENS[Math.floor(n / 10)] + (COUNTER_FORM[ones] || ones);
    }

    const MONTHS = ['', '일월', '이월', '삼월', '사월', '오월', '유월', '칠월', '팔월', '구월', '시월', '십일월', '십이월'];

    // Romanization of a number reading. 육 after 십/백/천/만/억 is pronounced 뉵 (십육 = simnyuk).
    function numberRom(reading) {
        return romanize(String(reading).replace(/([십백천만억])육/g, '$1뉵'));
    }

    return { romanize, split, join, compose, particleOf, similarity, isConsonant, isVowel, CHO, JUNG, sino, native, nativeCounter, months: MONTHS, numberRom };
})();
