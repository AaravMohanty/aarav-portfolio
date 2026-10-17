import io

LOOP_PATH = "M 57 124 C 96 48 168 49 200 120 C 232 191 304 192 343 116 C 304 40 232 41 200 112 C 168 183 96 184 57 124"

# ---------------------------------------------------------------- journal.js
p = 'dist/journal.js'
s = io.open(p, encoding='utf-8').read()

start = s.index('  /* ========================== departure board ==========================')
end = s.index('  /* ============================== trivia ==============================')

new_js = '''  /* ============================= the loop =============================
     Trace the infinity path without leaving it. Every completed lap
     narrows the line. Same shape the plane flies in the intro. */

  const loopSvg = document.querySelector('.loop-stage svg');
  const loopGuide = document.querySelector('.loop-guide');
  const loopTrail = document.querySelector('.loop-trail');
  const loopHead = document.querySelector('.loop-head');
  const loopStart = document.querySelector('.loop-start');
  const loopLaps = document.querySelector('.loop-laps');
  const loopBest = document.querySelector('.loop-best');
  const loopDrift = document.querySelector('.loop-drift');
  const loopMessage = document.querySelector('.loop-message');
  const loopReset = document.querySelector('.loop-reset');

  if (loopSvg && loopGuide && loopTrail) {
    const SAMPLES = 600;
    const LOOK_AHEAD = 36;
    const total = loopGuide.getTotalLength();
    const points = Array.from({ length: SAMPLES }, (_, i) => {
      const point = loopGuide.getPointAtLength((i / SAMPLES) * total);
      return { x: point.x, y: point.y };
    });

    let laps = 0;
    let index = 0;
    let tracing = false;
    let driftSum = 0;
    let driftCount = 0;
    let best = store.get('aarav-loop-best');
    if (loopBest) loopBest.textContent = String(best);

    loopTrail.style.strokeDasharray = String(total);
    loopTrail.style.strokeDashoffset = String(total);

    const tolerance = () => Math.max(9, 17 - laps * 1.5);

    const toUserSpace = (event) => {
      const box = loopSvg.getBoundingClientRect();
      const viewBox = loopSvg.viewBox.baseVal;
      // the svg uses preserveAspectRatio="none", so each axis scales on its own
      return {
        x: ((event.clientX - box.left) / box.width) * viewBox.width,
        y: ((event.clientY - box.top) / box.height) * viewBox.height
      };
    };

    const paintTrail = () => {
      const progress = index / SAMPLES;
      loopTrail.style.strokeDashoffset = String(total * (1 - progress));
    };

    const moveHead = (point) => {
      if (!loopHead) return;
      loopHead.setAttribute('cx', String(point.x));
      loopHead.setAttribute('cy', String(point.y));
    };

    const setMessage = (text) => { if (loopMessage) loopMessage.textContent = text; };

    const stop = (reason) => {
      if (!tracing) return;
      tracing = false;
      loopSvg.classList.remove('is-tracing');
      loopSvg.classList.add('is-broken');
      if (laps > best) {
        best = laps;
        store.set('aarav-loop-best', best);
        if (loopBest) loopBest.textContent = String(best);
      }
      setMessage(laps === 0
        ? `${reason} No laps yet.`
        : `${reason} ${laps} ${laps === 1 ? 'lap' : 'laps'}.`);
    };

    const reset = () => {
      tracing = false;
      laps = 0;
      index = 0;
      driftSum = 0;
      driftCount = 0;
      loopSvg.classList.remove('is-tracing', 'is-broken');
      loopTrail.style.strokeDashoffset = String(total);
      moveHead(points[0]);
      if (loopLaps) loopLaps.textContent = '0';
      if (loopDrift) loopDrift.textContent = '100%';
      setMessage('Press the dot, then follow the line.');
    };

    loopSvg.addEventListener('pointerdown', (event) => {
      const here = toUserSpace(event);
      const gap = Math.hypot(here.x - points[index].x, here.y - points[index].y);
      if (gap > tolerance() * 2.2) {
        setMessage(laps || index ? 'Pick it up where you left off.' : 'Start on the dot.');
        return;
      }
      event.preventDefault();
      tracing = true;
      loopSvg.classList.add('is-tracing');
      loopSvg.classList.remove('is-broken');
      loopSvg.setPointerCapture(event.pointerId);
      setMessage('Keep going.');
      markFound('loop');
    });

    loopSvg.addEventListener('pointermove', (event) => {
      if (!tracing) return;
      event.preventDefault();
      const here = toUserSpace(event);

      // only look forward, so you cannot scrub backwards for free
      let bestGap = Infinity;
      let bestStep = 0;
      for (let step = 0; step <= LOOK_AHEAD; step += 1) {
        const candidate = points[(index + step) % SAMPLES];
        const gap = Math.hypot(here.x - candidate.x, here.y - candidate.y);
        if (gap < bestGap) { bestGap = gap; bestStep = step; }
      }

      if (bestGap > tolerance()) { stop('Off the line.'); return; }

      driftSum += bestGap;
      driftCount += 1;
      if (loopDrift && driftCount % 6 === 0) {
        const accuracy = Math.max(0, Math.round(100 - (driftSum / driftCount) * 5));
        loopDrift.textContent = `${accuracy}%`;
      }

      if (bestStep > 0) {
        const wrapped = index + bestStep >= SAMPLES;
        index = (index + bestStep) % SAMPLES;
        moveHead(points[index]);
        if (wrapped) {
          laps += 1;
          if (loopLaps) loopLaps.textContent = String(laps);
          loopTrail.style.strokeDashoffset = String(total);
          loopSvg.classList.add('is-lap');
          window.setTimeout(() => loopSvg.classList.remove('is-lap'), 420);
          setMessage(laps === 1 ? 'One lap. The line just got thinner.' : `${laps} laps. Thinner again.`);
        } else {
          paintTrail();
        }
      }
    });

    const release = () => { if (tracing) stop('Lifted off.'); };
    loopSvg.addEventListener('pointerup', release);
    loopSvg.addEventListener('pointercancel', release);
    loopSvg.addEventListener('pointerleave', release);
    loopReset?.addEventListener('click', reset);

    if (loopStart) {
      loopStart.setAttribute('cx', String(points[0].x));
      loopStart.setAttribute('cy', String(points[0].y));
    }
    reset();
  }

'''
s = s[:start] + new_js + s[end:]

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('journal.js: departure board -> the loop')

# ---------------------------------------------------------------- journal.css
p = 'dist/journal.css'
s = io.open(p, encoding='utf-8').read()
a = s.index('/* next stop: a split-flap departure board */')
b = s.index('/* the five */')
new_css = """/* the loop: trace the infinity path, same shape the plane flies */
.loop-game { display: grid; grid-template-rows: auto minmax(0, 1fr) auto auto; gap: .8rem; background: linear-gradient(150deg, #1a1813, var(--ink)) !important; }
.loop-stage { position: relative; min-height: 0; display: grid; place-items: center; }
.loop-stage svg { width: 100%; height: 100%; touch-action: none; cursor: crosshair; overflow: visible; }
.loop-guide { fill: none; stroke: rgba(238, 236, 231, .17); stroke-width: 10; stroke-linecap: round; transition: stroke .3s ease, stroke-width .3s ease; }
.loop-trail { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; filter: drop-shadow(0 0 7px rgba(209, 154, 97, .55)); }
.loop-head { fill: var(--paper); filter: drop-shadow(0 0 8px rgba(224, 181, 125, .9)); transition: opacity .25s ease; }
.loop-start { fill: none; stroke: var(--accent); stroke-width: 1.5; opacity: .9; animation: loopPing 2s ease-out infinite; }
@keyframes loopPing { 0% { r: 7; opacity: .9; } 100% { r: 15; opacity: 0; } }
.loop-stage svg.is-tracing .loop-guide { stroke: rgba(238, 236, 231, .26); }
.loop-stage svg.is-tracing .loop-start { display: none; }
.loop-stage svg.is-broken .loop-trail { stroke: #9c5e4e; filter: none; }
.loop-stage svg.is-broken .loop-head { opacity: .25; }
.loop-stage svg.is-lap .loop-guide { stroke: rgba(209, 154, 97, .45); stroke-width: 12; }
.loop-stats { display: flex; gap: 1.2rem; color: var(--muted); font-family: var(--mono); font-size: .65rem; }
.loop-stats b { color: var(--text-2); font-weight: 400; }
.loop-message { margin: 0; color: var(--text-3); font-size: .78rem; }
.loop-reset { justify-self: end; padding: .5rem .7rem; }

"""
s = s[:a] + new_css + s[b:]
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('journal.css: travel styles -> loop styles')

# ---------------------------------------------------------------- outside markup
p = 'dist/outside/index.html'
s = io.open(p, encoding='utf-8').read()
a = s.index('        <article class="travel-game">')
b = s.index('</article>', a) + len('</article>')
new_html = '''        <article class="loop-game">
          <div class="game-top"><span>THE LOOP</span><strong><b class="loop-laps">0</b> laps</strong></div>
          <div class="loop-stats"><span>BEST <b class="loop-best">0</b></span><span>ON LINE <b class="loop-drift">100%</b></span></div>
          <div class="loop-stage">
            <svg viewBox="0 0 400 232" preserveAspectRatio="none" aria-label="Trace the infinity loop without leaving the line">
              <path class="loop-guide" d="%s" />
              <path class="loop-trail" d="%s" />
              <circle class="loop-start" cx="57" cy="124" r="7" />
              <circle class="loop-head" cx="57" cy="124" r="4.5" />
            </svg>
          </div>
          <p class="loop-message">Press the dot, then follow the line.</p>
          <button class="game-reset loop-reset" type="button">Reset</button>
        </article>''' % (LOOP_PATH, LOOP_PATH)
s = s[:a] + new_html + s[b:]
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('outside/index.html: next stop -> the loop')
