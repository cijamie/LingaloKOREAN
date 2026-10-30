// LingaloKR speaking practice: say the word, the browser's speech recognition checks it.
// Uses the Web Speech API (free, built into Chrome, Edge and Safari; not Firefox).
// Chrome sends the audio to Google and Edge to Microsoft for recognition.
// Loaded after app.js; uses its helpers and registers its own actions.
'use strict';

const Speaking = (() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    let current = null;

    // Resolves with what the browser heard (several guesses), or rejects with an error code.
    function listen() {
        return new Promise((resolve, reject) => {
            if (!Rec) { reject('unsupported'); return; }
            stop();
            const rec = new Rec();
            current = rec;
            rec.lang = LANG.speechLang;
            rec.interimResults = false;
            rec.maxAlternatives = 5;
            let heard = null;
            rec.onresult = e => { heard = [...e.results[0]].map(a => a.transcript); };
            rec.onerror = e => { current = null; reject(e.error || 'error'); };
            rec.onend = () => { current = null; if (heard) resolve(heard); else reject('no-speech'); };
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            rec.start();
        });
    }

    function stop() {
        if (current) { try { current.abort(); } catch (e) { /* already stopped */ } }
        current = null;
    }

    const clean = s => String(s || '').replace(/[^가-힣ㄱ-ㅣ0-9]/g, '');

    // Right if any guess matches the word exactly, or is very close (one small slip in a longer phrase).
    function judge(heard, item) {
        const targets = [item.key, item.num, /^[\d,]+$/.test(item.def) ? item.def.replace(/,/g, '') : ''].map(clean).filter(Boolean);
        let best = { text: heard[0] || '', score: 0 };
        for (const h of heard) {
            for (const t of targets) {
                const score = clean(h) === t ? 1 : Hangul.similarity(clean(h), t);
                if (score > best.score) best = { text: h, score };
            }
        }
        return { ok: best.score >= 0.85, exact: best.score === 1, heard: best.text, score: best.score };
    }

    return { supported: !!Rec, listen, stop, judge };
})();

const ERROR_TEXT = {
    'no-speech': "Didn't catch that. Tap the mic and speak a little louder.",
    'audio-capture': 'No microphone found.',
    'not-allowed': 'The microphone is blocked. Allow it in your browser settings, or skip this one.',
    'service-not-allowed': 'Speech recognition is turned off in this browser.',
    'network': 'Speech recognition needs an internet connection.',
    'unsupported': 'This browser has no speech recognition. Try Chrome, Edge or Safari.'
};

function renderSpeak() {
    const s = app.session;
    const it = s.item;
    if (!s.speak) s.speak = { tries: 0, listening: false, note: 'Tap the mic, then say it out loud.', heard: '' };
    const sp = s.speak;
    const len = [...it.key].length;
    $('#study-body').innerHTML = `<div class="study-card">
        <div class="prompt">
            <div class="prompt-label">Say it out loud</div>
            <div class="prompt-text lang-text ${len > 14 ? 'is-long' : len > 6 ? 'is-mid' : ''}">${esc(it.key)}</div>
            <div class="prompt-hint">${esc(it.isChar ? '' : it.rom)}</div>
            <div class="muted">${esc(it.isChar ? '' : it.def)}</div>
            <button type="button" class="listen-btn mic-btn ${sp.listening ? 'is-listening' : ''}" data-action="speak-listen" aria-label="${sp.listening ? 'Listening' : 'Start speaking'}" ${s.locked ? 'disabled' : ''}>${icon('mic')}</button>
            <div class="speak-note ${sp.heard ? '' : 'muted'}">${sp.heard ? `Heard: <span class="lang-text">${esc(sp.heard)}</span> · ` : ''}${esc(sp.note)}</div>
        </div>
        <div class="fc-actions">
            <button type="button" class="btn btn-secondary btn-lg" data-action="replay-audio">${icon('volume', 'icon-sm')}Hear it</button>
            <button type="button" class="btn btn-ghost btn-lg" data-action="skip-exercise" ${s.locked ? 'disabled' : ''}>Can't speak now</button>
        </div>
    </div><div class="feedback-slot" id="feedback"></div>`;
}

async function startListening() {
    const s = app.session;
    if (!s || !s.speak || s.speak.listening || s.locked) return;
    const sp = s.speak;
    sp.listening = true;
    sp.note = 'Listening…';
    renderSpeak();
    try {
        const heard = await Speaking.listen();
        if (app.session !== s || s.locked) return;
        const r = Speaking.judge(heard, s.item);
        sp.listening = false;
        sp.heard = r.heard;
        sp.tries++;
        if (r.ok || sp.tries >= 3) {
            s.locked = true;
            grade(r.ok);
            renderSpeak();
            showFeedback(r.ok, `${r.ok ? (r.exact ? 'Clear as a bell. ' : 'Close enough! ') : ''}Heard <span class="lang-text">${esc(r.heard)}</span> · ${answerText(s.item)}`);
        } else {
            sp.note = `Not quite. Listen again and try once more (${3 - sp.tries} left).`;
            renderSpeak();
        }
    } catch (code) {
        if (app.session !== s) return;
        sp.listening = false;
        sp.note = ERROR_TEXT[code] || `Speech recognition stopped (${code}).`;
        renderSpeak();
    }
}

Object.assign(actions, {
    'speak-listen': () => startListening()
});
