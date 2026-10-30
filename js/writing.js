// LingaloKR writing practice: watch the stroke order, then trace the letter.
// Stroke data lives in strokes.js. A trace passes when the ink covers most of the letter
// and stays close to it. Loaded after app.js; uses its helpers and registers its own actions.
'use strict';

const canWrite = item => !!(item && item.isChar && STROKES[item.key]);
const strokePath = pts => `M${pts.map(p => p.join(' ')).join(' L')}`;

// Animated stroke-order diagram: each stroke draws in turn, numbered at its start.
function strokeDemo(letter, { size = 180, animate = true } = {}) {
    const strokes = STROKES[letter] || [];
    const per = 0.7;
    return `<svg class="stroke-demo ${animate ? 'is-animated' : ''}" viewBox="-6 -6 112 112" width="${size}" height="${size}" role="img" aria-label="Stroke order for ${esc(letter)}: ${strokes.length} strokes">
        <rect x="-6" y="-6" width="112" height="112" rx="10" class="stroke-bg"/>
        <path d="M50 -6V106M-6 50H106" class="stroke-grid"/>
        ${strokes.map(s => `<path d="${strokePath(s)}" class="stroke-ghost"/>`).join('')}
        ${strokes.map((s, i) => `<path d="${strokePath(s)}" class="stroke-ink" pathLength="1" style="animation-delay:${(i * per).toFixed(2)}s"/>`).join('')}
        ${strokes.map((s, i) => `<g class="stroke-num" style="animation-delay:${(i * per).toFixed(2)}s"><circle cx="${s[0][0]}" cy="${s[0][1]}" r="5.5"/><text x="${s[0][0]}" y="${s[0][1] + 2.6}" text-anchor="middle">${i + 1}</text></g>`).join('')}
    </svg>`;
}

// Points every 3 units along a stroke.
function sampleStroke(s) {
    const pts = [s[0]];
    for (let i = 1; i < s.length; i++) {
        const [x0, y0] = s[i - 1], [x1, y1] = s[i];
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
        for (let k = 1; k <= steps; k++) pts.push([x0 + (x1 - x0) * k / steps, y0 + (y1 - y0) * k / steps]);
    }
    return pts;
}

// Score a trace against the letter's strokes (points on the 100 × 100 grid). It passes when
// every stroke is mostly covered and the ink stays close to the letter.
function scoreTrace(letter, ink) {
    const strokes = STROKES[letter].map(sampleStroke);
    const target = strokes.flat();
    const drawn = ink.flat();
    if (drawn.length < 3) return { ok: false, coverage: 0, precision: 0, missing: true, strokes: ink.length, expected: strokes.length };
    const near = (p, pts, tol) => pts.some(q => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 <= tol * tol);
    const covered = pts => pts.filter(p => near(p, drawn, 10)).length / pts.length;
    const coverage = covered(target);
    const missing = strokes.some(st => covered(st) < 0.7);
    const precision = drawn.filter(p => near(p, target, 11)).length / drawn.length;
    // Joining two strokes is fine; drawing a 3-stroke letter in one go usually means the wrong shape.
    const tooFew = ink.length < strokes.length - 1;
    return { ok: coverage >= 0.8 && !missing && precision >= 0.8 && !tooFew, coverage, precision, missing: missing || tooFew, strokes: ink.length, expected: strokes.length };
}

function renderWrite() {
    const s = app.session;
    const letter = s.item.key;
    if (!s.write) s.write = { ink: [] };
    const mn = mnemonicFor(s.item);
    const n = STROKES[letter].length;
    $('#study-body').innerHTML = `<div class="study-card study-card-wide">
        <div class="prompt write-prompt">
            <div class="prompt-label">Trace the letter · ${plural(n, 'stroke')}</div>
            <div class="write-row">
                <div class="write-demo">
                    ${strokeDemo(letter)}
                    <button type="button" class="btn btn-ghost btn-sm" data-action="replay-strokes">${icon('rotate', 'icon-sm')}Replay</button>
                    <div class="muted small">${esc(mn ? mn[0] : s.item.rom)}${mn ? ` · ${richText(mn[1])}` : ''}</div>
                </div>
                <div class="write-pad-wrap">
                    <svg class="write-guide" viewBox="-6 -6 112 112" aria-hidden="true">
                        <path d="M50 -6V106M-6 50H106" class="stroke-grid"/>
                        ${STROKES[letter].map(st => `<path d="${strokePath(st)}" class="stroke-ghost"/>`).join('')}
                    </svg>
                    <canvas id="write-pad" class="write-pad" width="600" height="600" aria-label="Drawing area: trace ${esc(letter)}"></canvas>
                </div>
            </div>
            <div class="prompt-hint" id="write-note">Follow the numbers: top to bottom, left to right.</div>
        </div>
        <div class="fc-actions">
            <button type="button" class="btn btn-secondary btn-lg" data-action="write-clear" ${s.locked ? 'disabled' : ''}>Clear</button>
            <button type="button" class="btn btn-ghost btn-lg" data-action="skip-exercise" ${s.locked ? 'disabled' : ''}>Can't draw now</button>
            <button type="button" class="btn btn-primary btn-lg teach-next" data-action="check-exercise" ${s.locked ? 'disabled' : ''}>Check <kbd>Enter</kbd></button>
        </div>
    </div><div class="feedback-slot" id="feedback"></div>`;
    bindPad();
}

function bindPad() {
    const s = app.session;
    const canvas = $('#write-pad');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const toGrid = e => {
        const r = canvas.getBoundingClientRect();
        // The canvas spans the same -6…106 range as the guide underneath it.
        return [(e.clientX - r.left) / r.width * 112 - 6, (e.clientY - r.top) / r.height * 112 - 6];
    };
    const toPx = ([x, y]) => [(x + 6) / 112 * canvas.width, (y + 6) / 112 * canvas.height];
    const redraw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = ctx.lineJoin = 'round';
        ctx.lineWidth = canvas.width * 0.045;
        ctx.strokeStyle = css.getPropertyValue('--accent').trim() || '#d97706';
        s.write.ink.forEach(st => {
            ctx.beginPath();
            st.forEach((p, i) => { const [x, y] = toPx(p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
            if (st.length === 1) { const [x, y] = toPx(st[0]); ctx.lineTo(x + 0.1, y); }
            ctx.stroke();
        });
    };
    let drawing = null;
    canvas.addEventListener('pointerdown', e => {
        if (s.locked) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        drawing = [toGrid(e)];
        s.write.ink.push(drawing);
        redraw();
    });
    canvas.addEventListener('pointermove', e => {
        if (!drawing) return;
        drawing.push(toGrid(e));
        redraw();
    });
    const end = () => { drawing = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    redraw();
}

function checkWrite() {
    const s = app.session;
    const r = scoreTrace(s.item.key, s.write.ink);
    if (!s.write.ink.length) { $('#write-note').textContent = 'Trace the letter in the box first.'; return; }
    s.locked = true;
    grade(r.ok);
    const countNote = r.strokes !== r.expected ? ` ${s.item.key} has ${plural(r.expected, 'stroke')}; you drew ${r.strokes}.` : '';
    const why = r.ok ? '' : r.missing || r.coverage < 0.8 ? ' A stroke is missing or too short.' : ' Try to stay closer to the grey guide.';
    $$('.fc-actions .btn').forEach(b => { b.disabled = true; });
    showFeedback(r.ok, `<span class="lang-text">${esc(s.item.key)}</span> · ${Math.round(Math.min(r.coverage, r.precision) * 100)}% match.${why}${countNote}`);
}

Object.assign(actions, {
    'write-clear': () => { const s = app.session; if (s && s.write && !s.locked) { s.write.ink = []; renderWrite(); } },
    'replay-strokes': () => {
        const svg = $('.stroke-demo');
        if (!svg) return;
        svg.classList.remove('is-animated');
        void svg.getBoundingClientRect();
        svg.classList.add('is-animated');
    }
});
