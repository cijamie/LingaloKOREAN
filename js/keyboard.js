// LingaloKR Hangul typing: an on-screen Korean keyboard (standard 2-set layout) that also
// works from a physical keyboard, with no Korean input method needed.
// Loaded after app.js; uses its helpers and registers its own actions.
'use strict';

// Physical key → letter, by key position, so it works whatever layout or input method is on.
const KEY_LAYOUT = [
    [['KeyQ', 'ㅂ', 'ㅃ'], ['KeyW', 'ㅈ', 'ㅉ'], ['KeyE', 'ㄷ', 'ㄸ'], ['KeyR', 'ㄱ', 'ㄲ'], ['KeyT', 'ㅅ', 'ㅆ'], ['KeyY', 'ㅛ'], ['KeyU', 'ㅕ'], ['KeyI', 'ㅑ'], ['KeyO', 'ㅐ', 'ㅒ'], ['KeyP', 'ㅔ', 'ㅖ']],
    [['KeyA', 'ㅁ'], ['KeyS', 'ㄴ'], ['KeyD', 'ㅇ'], ['KeyF', 'ㄹ'], ['KeyG', 'ㅎ'], ['KeyH', 'ㅗ'], ['KeyJ', 'ㅓ'], ['KeyK', 'ㅏ'], ['KeyL', 'ㅣ']],
    [['KeyZ', 'ㅋ'], ['KeyX', 'ㅌ'], ['KeyC', 'ㅊ'], ['KeyV', 'ㅍ'], ['KeyB', 'ㅠ'], ['KeyN', 'ㅜ'], ['KeyM', 'ㅡ']]
];
const KEY_BY_CODE = Object.fromEntries(KEY_LAYOUT.flat().map(([code, plain, shifted]) => [code, [plain, shifted || plain]]));

const typedText = () => Hangul.compose(app.session.kb.keys);
const compactKo = s => String(s || '').replace(/[^가-힣ㄱ-ㅣ0-9]/g, '');

function renderTypeKo() {
    const s = app.session;
    const it = s.item;
    if (!s.kb) s.kb = { keys: [], shift: false };
    const kb = s.kb;
    const hint = it.isChar ? 'Type the letter for this sound' : app.store.prefs.hints ? it.rom : '';
    $('#study-body').innerHTML = `<div class="study-card">
        <div class="prompt">
            <div class="prompt-label">Type it in Hangul</div>
            <div class="prompt-text ${it.def.length > 14 ? 'is-long' : 'is-mid'}">${esc(it.def)}</div>
            <div class="prompt-hint">${esc(hint) || '&nbsp;'}</div>
            <div class="ko-field lang-text ${s.locked ? (s.kb.ok ? 'is-right' : 'is-wrong') : ''}" role="textbox" aria-label="Your answer" aria-readonly="true">${esc(typedText())}<span class="ko-caret"></span></div>
        </div>
        <div class="ko-keyboard" role="group" aria-label="Korean keyboard">
            ${KEY_LAYOUT.map((row, r) => `<div class="ko-row">
                ${r === 2 ? `<button type="button" class="ko-key ko-wide ${kb.shift ? 'is-on' : ''}" data-action="kb-shift" aria-label="Shift for double letters">⇧</button>` : ''}
                ${row.map(([code, plain, shifted]) => {
                    const ch = kb.shift && shifted ? shifted : plain;
                    return `<button type="button" class="ko-key lang-text ${Hangul.isVowel(ch) ? 'is-vowel' : ''}" data-action="kb-key" data-key="${ch}" ${s.locked ? 'disabled' : ''}>${ch}<small>${code.slice(3).toLowerCase()}</small></button>`;
                }).join('')}
                ${r === 2 ? `<button type="button" class="ko-key ko-wide" data-action="kb-back" aria-label="Backspace" ${s.locked ? 'disabled' : ''}>⌫</button>` : ''}
            </div>`).join('')}
            <div class="ko-row"><button type="button" class="ko-key ko-space" data-action="kb-key" data-key=" " ${s.locked ? 'disabled' : ''}>space</button></div>
        </div>
        <div class="fc-actions">
            <button type="button" class="btn btn-secondary btn-lg" data-action="replay-audio">${icon('volume', 'icon-sm')}Hear it</button>
            <button type="button" class="btn btn-ghost btn-lg" data-action="kb-giveup" ${s.locked ? 'disabled' : ''}>I don't know</button>
            <button type="button" class="btn btn-primary btn-lg teach-next" data-action="check-exercise" ${s.locked || !kb.keys.length ? 'disabled' : ''}>Check <kbd>Enter</kbd></button>
        </div>
    </div><div class="feedback-slot" id="feedback"></div>`;
}

function typeKey(ch) {
    const s = app.session;
    if (!s || !s.kb || s.locked) return;
    s.kb.keys.push(ch);
    s.kb.shift = false;
    renderTypeKo();
}

function checkTypeKo(giveUp = false) {
    const s = app.session;
    if (!s || !s.kb || s.locked) return;
    const typed = typedText();
    if (!giveUp && !compactKo(typed)) return;
    const ok = !giveUp && compactKo(typed) === compactKo(s.item.key);
    s.locked = true;
    s.kb.ok = ok;
    grade(ok);
    renderTypeKo();
    speakItem(s.item);
    showFeedback(ok, `${giveUp || ok ? '' : `You typed <span class="lang-text">${esc(typed)}</span> · `}${answerText(s.item)}`);
}

// Physical keyboard: letters by key position, Backspace, space and Enter. Returns true if handled.
function handleKoKey(e) {
    const s = app.session;
    if (!s || !s.kb || s.locked || e.ctrlKey || e.metaKey || e.altKey) return false;
    const mapped = KEY_BY_CODE[e.code];
    if (mapped) { e.preventDefault(); typeKey(mapped[e.shiftKey ? 1 : 0]); return true; }
    if (e.key === 'Backspace') { e.preventDefault(); actions['kb-back'](); return true; }
    if (e.code === 'Space') { e.preventDefault(); typeKey(' '); return true; }
    if (e.key === 'Enter') { e.preventDefault(); checkTypeKo(); return true; }
    return false;
}

Object.assign(actions, {
    'kb-key': el => typeKey(el.dataset.key),
    'kb-shift': () => { const s = app.session; if (s && s.kb) { s.kb.shift = !s.kb.shift; renderTypeKo(); } },
    'kb-back': () => { const s = app.session; if (s && s.kb && !s.locked) { s.kb.keys.pop(); renderTypeKo(); } },
    'kb-giveup': () => checkTypeKo(true)
});
