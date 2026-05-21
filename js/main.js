document.addEventListener('DOMContentLoaded', () => {

    // =====================
    // THEME TOGGLE
    // =====================
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon   = document.getElementById('themeIcon');
    const savedTheme  = localStorage.getItem('jf-theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        if (themeIcon) themeIcon.className = 'ph-fill ph-sun';
    }
    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        if (themeIcon) themeIcon.className = isDark ? 'ph-fill ph-sun' : 'ph-fill ph-moon';
        localStorage.setItem('jf-theme', isDark ? 'dark' : 'light');
    });

    // =====================
    // SCROLL PROGRESS
    // =====================
    const scrollBar = document.getElementById('scrollProgress');
    function updateScrollProgress() {
        if (!scrollBar) return;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        scrollBar.style.transform = `scaleX(${Math.min(window.scrollY / total, 1)})`;
    }
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // =====================
    // FADE-IN OBSERVER
    // =====================
    const fadeObserver = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 70);
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });
    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

    // =====================
    // CHAPTER NAV DOTS
    // =====================
    const chapterDots = document.querySelectorAll('.cn-dot');
    const chapterSections = document.querySelectorAll('[data-chapter]');

    const chapterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = parseInt(entry.target.dataset.chapter || 0);
                chapterDots.forEach((d, i) => d.classList.toggle('active', i === idx));
            }
        });
    }, { threshold: 0.4 });
    chapterSections.forEach(s => chapterObserver.observe(s));

    chapterDots.forEach(dot => {
        dot.addEventListener('click', e => {
            e.preventDefault();
            const href = dot.getAttribute('href');
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // =====================
    // SMOOTH SCROLL ALL ANCHORS
    // =====================
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        });
    });

    // =====================
    // STAT COUNTERS
    // =====================
    const counters = document.querySelectorAll('.stat-num[data-count]');
    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count);
            const duration = 1400;
            const step = Math.ceil(target / (duration / 16));
            let current = 0;
            const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = current.toLocaleString();
                if (current >= target) clearInterval(timer);
            }, 16);
            counterObserver.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));

    // =====================
    // SIMULATOR ENGINE
    // =====================
    const canvas = document.getElementById('simulatorCanvas');
    if (!canvas) return;

    const ctx        = canvas.getContext('2d');
    const canvasInfo = document.getElementById('canvasInfo');
    const input      = document.getElementById('siteswapInput');

    const W  = canvas.width;
    const H  = canvas.height;
    const LX = W * 0.30;
    const RX = W * 0.70;
    const HY = H - 60;

    const BEAT_MS = 380;
    const PERIODS = 20;
    const H_SCALE = 10;
    const BALL_R  = 13;
    const BOB     = 10;
    const COLORS  = ['#e11d48','#22d3ee','#a3e635','#f97316','#c084fc','#38bdf8','#86efac','#fb7185'];

    let animId    = null;
    let running   = false;
    let startTime = 0;
    let speedMult = 1;
    let events    = [];
    let loopLen   = 0;
    let simMode      = 'canvas';
    let activePattern = null; // tracks the last pattern that ran

    // ---- MODE SWITCH (Canvas / JugglingLab) ----
    const canvasView  = document.getElementById('canvasView');
    const jlabView    = document.getElementById('jlabView');
    const jlabImg     = document.getElementById('jlabImg');
    const jlabIdle    = document.getElementById('jlabIdle');
    const jlabLoading = document.getElementById('jlabLoading');
    const jlabInfo    = document.getElementById('jlabInfo');
    const speedCtrl   = document.getElementById('speedControl');

    function setMode(mode) {
        simMode = mode;
        document.querySelectorAll('.sim-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.mode === mode)
        );
        if (mode === 'canvas') {
            canvasView.style.display = '';
            jlabView.style.display   = 'none';
            if (speedCtrl) speedCtrl.style.display = '';
        } else {
            canvasView.style.display = 'none';
            jlabView.style.display   = '';
            if (speedCtrl) speedCtrl.style.display = 'none';
            cancelAnimationFrame(animId);
            running = false;
            // Auto-load whatever pattern was last active on canvas
            if (activePattern) loadJlab(activePattern);
        }
    }

    function loadJlab(pattern) {
        if (!jlabIdle || !jlabLoading || !jlabImg) return;
        jlabIdle.style.display    = 'none';
        jlabLoading.style.display = 'flex';
        jlabImg.style.display     = 'none';
        if (jlabInfo) jlabInfo.textContent = `${pattern.toUpperCase()} | Cargando...`;

        const url = `https://jugglinglab.org/anim?pattern=${encodeURIComponent(pattern)};redirect=true`;
        jlabImg.onload = () => {
            jlabLoading.style.display = 'none';
            jlabImg.style.display     = 'block';
            if (jlabInfo) jlabInfo.textContent = `${pattern.toUpperCase()} | jugglinglab.org`;
            window.sileo?.success({ title: `Patrón ${pattern.toUpperCase()}`, message: 'Animación JugglingLab cargada' });
        };
        jlabImg.onerror = () => {
            jlabLoading.style.display = 'none';
            jlabIdle.textContent      = '⚠ No se pudo cargar — verifica tu conexión';
            jlabIdle.style.display    = 'flex';
            if (jlabInfo) jlabInfo.textContent = 'Requiere conexión a internet';
            window.sileo?.error({ title: 'Sin conexión', message: 'JugglingLab requiere internet.' });
        };
        jlabImg.src = url;
    }

    function stopJlab() {
        if (!jlabImg || !jlabIdle || !jlabLoading) return;
        jlabImg.src = '';
        jlabImg.style.display     = 'none';
        jlabLoading.style.display = 'none';
        jlabIdle.textContent      = 'Selecciona un patrón para ver la animación';
        jlabIdle.style.display    = 'flex';
        if (jlabInfo) jlabInfo.textContent = 'Requiere conexión a internet';
    }

    document.querySelectorAll('.sim-tab').forEach(t => {
        t.addEventListener('click', () => setMode(t.dataset.mode));
    });

    // ---- PARSER ----
    function parse(s) {
        return s.replace(/\s/g, '').toLowerCase().split('')
            .filter(c => /[0-9a-f]/.test(c))
            .map(c => parseInt(c, 16));
    }

    // ---- VALIDATOR ----
    function validate(p) {
        if (!p.length) return { ok: false, msg: 'Ingresa un patrón' };
        const sum = p.reduce((a, b) => a + b, 0);
        if (sum % p.length !== 0)
            return { ok: false, msg: 'Inválido: la suma no es divisible por el período' };
        const mods = p.map((v, i) => (v + i) % p.length);
        if (new Set(mods).size !== p.length)
            return { ok: false, msg: 'Inválido: colisión entre bolas' };
        return { ok: true, n: sum / p.length };
    }

    // ---- EVENT BUILDER ----
    function buildEvents(pattern, N) {
        const period     = pattern.length;
        const maxVal     = Math.max(...pattern);
        const prePeriods = Math.ceil(maxVal / period) + 2;
        const startBeat  = -prePeriods * period;
        const endBeat    =  PERIODS * period + maxVal;
        const firstHand  = ((startBeat % 2) + 2) % 2;
        const hands = [[], []];
        for (let i = 0; i < N; i++)
            hands[i < Math.ceil(N / 2) ? firstHand : 1 - firstHand].push(i);

        const inFlight = [], evs = [];
        for (let beat = startBeat; beat < endBeat; beat++) {
            for (let i = inFlight.length - 1; i >= 0; i--) {
                if (inFlight[i].landBeat === beat) {
                    const f = inFlight.splice(i, 1)[0];
                    hands[f.ch].push(f.ballId);
                }
            }
            const hand   = ((beat % 2) + 2) % 2;
            const patIdx = ((beat % period) + period) % period;
            const val    = pattern[patIdx];
            if (val === 0 || !hands[hand].length) continue;
            const ballId   = hands[hand].shift();
            const landBeat = beat + val;
            const landHand = ((landBeat % 2) + 2) % 2;
            const ev = { ballId, beat, val, th: hand, ch: landHand, landBeat };
            inFlight.push(ev);
            evs.push(ev);
        }
        return evs;
    }

    // ---- DRAW HELPERS ----
    function drawArc(sx, ex, height, color) {
        const mx = (sx + ex) / 2;
        ctx.beginPath();
        ctx.moveTo(sx, HY);
        ctx.quadraticCurveTo(mx, HY - 2 * height, ex, HY);
        ctx.strokeStyle = color + '28';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
    }

    function drawBall(x, y, color) {
        const r = BALL_R;
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, color + '44');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.28, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.fill();
    }

    function drawHand(x, y, active) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle   = active ? 'rgba(255,107,53,0.35)' : 'rgba(255,255,255,0.05)';
        ctx.fill();
        ctx.strokeStyle = active ? '#ff6b35' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth   = 2;
        ctx.stroke();
    }

    function drawJuggler(LY, RY, activeH, frac) {
        const cx = W / 2;
        const headCY = HY - 230;
        const headRX = 22, headRY = 27;
        const shouldY = headCY + headRY + 12;
        const sLX = cx - 62, sRX = cx + 62;
        const hipY = shouldY + 112;
        const hLX = cx - 24, hRX = cx + 24;
        const kneeY = hipY + 58;
        const footY = kneeY + 44;

        const pulse  = activeH >= 0 ? Math.sin(frac * Math.PI) * 0.15 : 0;
        const body   = 'rgba(200,240,255,0.72)';
        const tFill  = 'rgba(162,155,254,0.08)';
        const fired  = 'rgba(225,29,72,0.9)';
        const lFired = activeH === 1 && frac < 0.45;
        const rFired = activeH === 0 && frac < 0.45;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const grd = ctx.createRadialGradient(cx, shouldY + 50, 0, cx, shouldY + 50, 120);
        grd.addColorStop(0, `rgba(162,155,254,${0.05 + pulse * 0.05})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(cx - 180, headCY - 30, 360, footY - headCY + 45);

        ctx.beginPath();
        ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = body; ctx.lineWidth = 2.2; ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, headCY + headRY); ctx.lineTo(cx, shouldY);
        ctx.lineWidth = 2.2; ctx.strokeStyle = body; ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sLX, shouldY); ctx.lineTo(sRX, shouldY);
        ctx.lineTo(hRX, hipY); ctx.lineTo(hLX, hipY); ctx.closePath();
        ctx.fillStyle = tFill; ctx.fill();
        ctx.strokeStyle = body; ctx.lineWidth = 2.2; ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sLX, shouldY); ctx.lineTo(LX, LY);
        ctx.strokeStyle = lFired ? fired : body; ctx.lineWidth = 2.2; ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sRX, shouldY); ctx.lineTo(RX, RY);
        ctx.strokeStyle = rFired ? fired : body; ctx.lineWidth = 2.2; ctx.stroke();

        ctx.strokeStyle = body; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(hLX, hipY); ctx.lineTo(cx - 26, kneeY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hRX, hipY); ctx.lineTo(cx + 26, kneeY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 26, kneeY); ctx.lineTo(cx - 34, footY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 26, kneeY); ctx.lineTo(cx + 34, footY); ctx.stroke();
        ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(cx - 48, footY); ctx.lineTo(cx - 24, footY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 24, footY); ctx.lineTo(cx + 48, footY); ctx.stroke();

        ctx.restore();
    }

    function drawScene(t) {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1a0018');
        bg.addColorStop(1, '#0d0009');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const beat    = Math.floor(t);
        const frac    = t - beat;
        const activeH = beat % 2;
        const bobR    =  BOB * Math.cos(t * Math.PI);
        const bobL    = -BOB * Math.cos(t * Math.PI);
        const RY      = HY + bobR;
        const LY      = HY + bobL;

        const glowX = activeH === 0 ? RX : LX;
        const glowY = activeH === 0 ? RY : LY;
        const ga    = Math.sin(frac * Math.PI) * 0.22;
        const grd   = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 80);
        grd.addColorStop(0, `rgba(225,29,72,${ga})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        const visible = [];
        for (const ev of events) {
            let dt = t - ev.beat;
            if (dt < 0) dt += loopLen;
            if (dt < 0 || dt >= ev.val) continue;
            const prog   = dt / ev.val;
            const sx     = ev.th === 0 ? RX : LX;
            const ex     = ev.ch === 0 ? RX : LX;
            const height = Math.min(ev.val * ev.val * H_SCALE, HY - 20);
            const bx     = sx + (ex - sx) * prog;
            const by     = HY - 4 * prog * (1 - prog) * height;
            const color  = COLORS[ev.ballId % COLORS.length];
            visible.push({ bx, by, sx, ex, height, color, val: ev.val });
        }

        for (const v of visible) if (v.val >= 2) drawArc(v.sx, v.ex, v.height, v.color);
        drawJuggler(LY, RY, activeH, frac);
        for (const v of visible) drawBall(v.bx, v.by, v.color);
        drawHand(LX, LY, activeH === 1 && frac < 0.22);
        drawHand(RX, RY, activeH === 0 && frac < 0.22);
    }

    function drawIdle() {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1a0018');
        bg.addColorStop(1, '#0d0009');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        drawJuggler(HY, HY, -1, 0);
        drawHand(LX, HY, false);
        drawHand(RX, HY, false);
        ctx.fillStyle    = '#4a4a5a';
        ctx.font         = '14px DM Sans, sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Desplázate para ver los patrones', W / 2, H - 14);
    }

    function frame() {
        if (!running) return;
        const beatMs = BEAT_MS / speedMult;
        const t = ((performance.now() - startTime) / beatMs) % loopLen;
        drawScene(t);
        animId = requestAnimationFrame(frame);
    }

    function startSim(s) {
        if (simMode === 'jlab') { activePattern = s; loadJlab(s); return; }
        cancelAnimationFrame(animId);
        running = false;
        const pat = parse(s);
        const v   = validate(pat);
        if (!v.ok) {
            window.sileo?.error({ title: 'Patrón inválido', message: v.msg });
            drawIdle();
            return;
        }
        activePattern = s;
        loopLen = pat.length * PERIODS;
        events  = buildEvents(pat, v.n);
        if (canvasInfo)
            canvasInfo.textContent = `${s.toUpperCase()} · ${v.n} bola${v.n !== 1 ? 's' : ''} · período ${pat.length}`;
        startTime = performance.now();
        running   = true;
        frame();
    }

    function stopSim() {
        if (simMode === 'jlab') { stopJlab(); return; }
        cancelAnimationFrame(animId);
        running = false;
        drawIdle();
        if (canvasInfo) canvasInfo.textContent = '—';
    }

    // Always runs on canvas regardless of simMode — used for scroll-triggered auto-load.
    // Resets to canvas mode so the view and tab state stay consistent.
    function startCanvasSim(s) {
        setMode('canvas');
        cancelAnimationFrame(animId);
        running = false;
        const pat = parse(s);
        const v   = validate(pat);
        if (!v.ok) { drawIdle(); return; }
        activePattern = s;
        loopLen = pat.length * PERIODS;
        events  = buildEvents(pat, v.n);
        if (canvasInfo)
            canvasInfo.textContent = `${s.toUpperCase()} · ${v.n} bola${v.n !== 1 ? 's' : ''} · período ${pat.length}`;
        startTime = performance.now();
        running   = true;
        frame();
    }

    // ---- CONTROLS ----
    document.getElementById('playBtn')?.addEventListener('click', () => {
        const val = input?.value.trim();
        if (val) startSim(val);
        else window.sileo?.warning({ title: 'Sin patrón', message: 'Escribe un patrón primero.' });
    });
    document.getElementById('stopBtn')?.addEventListener('click', stopSim);
    input?.addEventListener('keypress', e => { if (e.key === 'Enter') { const v = input.value.trim(); if (v) startSim(v); } });

    document.querySelectorAll('.preset-btn').forEach(b => {
        b.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            if (input) input.value = b.dataset.pattern;
            startSim(b.dataset.pattern);
        });
    });

    document.querySelectorAll('.speed-btn').forEach(b => {
        b.addEventListener('click', () => {
            document.querySelectorAll('.speed-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            speedMult = parseFloat(b.dataset.speed);
        });
    });

    drawIdle();

    // =====================
    // SCROLLYTELLING
    // Scroll-based: finds the panel whose center is closest to the
    // viewport's 40% mark (slightly above center feels more natural).
    // More reliable than IntersectionObserver threshold for tall panels.
    // =====================
    const scrollySection  = document.querySelector('.scrolly-section');
    const scrollyPanels   = document.querySelectorAll('.scrolly-panel');
    let lastActivePanel   = null;

    function getActivePanel() {
        if (!scrollySection) return null;
        const sr = scrollySection.getBoundingClientRect();
        // Only process while the section is anywhere in the viewport
        if (sr.bottom < 0 || sr.top > window.innerHeight) return null;

        const focus = window.innerHeight * 0.42; // target line in viewport
        let best = null, bestDist = Infinity;

        scrollyPanels.forEach(panel => {
            const r = panel.getBoundingClientRect();
            const visTop    = Math.max(r.top, 0);
            const visBottom = Math.min(r.bottom, window.innerHeight);
            if (visBottom <= visTop) return;              // fully off-screen
            const panelMid  = (r.top + r.bottom) / 2;
            const dist      = Math.abs(panelMid - focus);
            if (dist < bestDist) { bestDist = dist; best = panel; }
        });
        return best;
    }

    function tickScrollytelling() {
        const active = getActivePanel();
        if (!active) return;

        scrollyPanels.forEach(p => p.classList.remove('active'));
        active.classList.add('active');

        const pattern = active.dataset.pattern;
        if (pattern && pattern !== lastActivePanel) {
            lastActivePanel = pattern;
            if (!active.classList.contains('panel-interactive')) {
                startCanvasSim(pattern);
            }
        }
    }

    window.addEventListener('scroll', tickScrollytelling, { passive: true });
    // Run once on load in case user arrives mid-page
    tickScrollytelling();

    // =====================
    // NEWSLETTER
    // =====================
    document.getElementById('newsletterForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const email = e.target.querySelector('input')?.value;
        if (email?.includes('@')) {
            window.sileo?.success({ title: '¡Suscripción confirmada!', message: 'Recibirás tips semanales.' });
            e.target.reset();
        } else {
            window.sileo?.error({ title: 'Email inválido', message: 'Ingresa un correo válido.' });
        }
    });

});
