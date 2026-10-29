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

    return { romanize, sino, native, nativeCounter, months: MONTHS, numberRom };
})();
