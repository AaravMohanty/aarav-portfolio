import io, glob, re

# ============================ 1. globe copy ============================
p = 'dist/index.html'
s = io.open(p, encoding='utf-8').read()
old = '      <p class="globe-intro-note">Every dot is somewhere I\'ve been. The circled ones open a photo.</p>\n'
assert old in s
s = s.replace(old, '', 1)
# the one useful instruction moves to the corner, where the other one already is
s = s.replace('<div class="globe-orbit-note">Drag or scroll to spin</div>',
              '<div class="globe-orbit-note">Drag to spin · circled dots open a photo</div>')
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('index.html: globe note removed, instruction moved to the corner')

# ============================ 2. drop the photo quiz ============================
p = 'dist/outside/index.html'
s = io.open(p, encoding='utf-8').read()
a = s.index('    <section id="places" class="journal-section places-section">')
b = s.index('</section>', a) + len('</section>\n')
s = s[:a] + s[b:]
s = s.replace('      <a href="#places"><span>04</span> Where</a>\n',
              '      <a href="#machine"><span>04</span> Make</a>\n')

SECTION = '''    <section id="machine" class="journal-section machine-section">
      <header class="section-heading">
        <div><span class="eyebrow">04 / Make some noise</span><h2>Four <em>bars.</em></h2></div>
        <p>Click the grid, hit play. No samples, no library. Every sound is synthesized in your browser.</p>
      </header>

      <div class="machine">
        <div class="machine-bar">
          <button class="machine-play" type="button" aria-pressed="false">Play</button>
          <label class="machine-tempo">Tempo <input type="range" min="70" max="160" value="104" step="1" aria-label="Tempo in beats per minute"> <b>104</b></label>
          <div class="machine-actions">
            <button class="machine-shuffle" type="button">Surprise me</button>
            <button class="machine-clear" type="button">Clear</button>
          </div>
        </div>
        <div class="machine-grid-wrap">
          <div class="machine-grid" role="group" aria-label="Step sequencer grid"></div>
        </div>
        <p class="machine-note">Sixteen steps, five voices. Kick and bass do the work, hat keeps time.</p>
      </div>
    </section>
'''
anchor = '    </section>\n  </main>'
assert anchor in s
s = s.replace(anchor, '    </section>\n\n' + SECTION + '  </main>', 1)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('outside/index.html: photo quiz out, sequencer in')

# ============================ 3. journal.js ============================
p = 'dist/journal.js'
s = io.open(p, encoding='utf-8').read()
a = s.index('  /* ============================ where was I ============================')
b = s.index('  /* ===================== reveals and section spy ===================== */')

MACHINE = r'''  /* ============================== four bars ==============================
     A step sequencer. Nothing is sampled: every voice is built out of
     oscillators and a noise buffer, scheduled against the audio clock
     rather than setInterval, which is what keeps it in time. */

  const VOICES = [
    { id: 'kick',  label: 'KICK'  },
    { id: 'snare', label: 'SNARE' },
    { id: 'hat',   label: 'HAT'   },
    { id: 'bass',  label: 'BASS'  },
    { id: 'blip',  label: 'BLIP'  }
  ];
  const STEPS = 16;

  // something playable on arrival, so nobody meets a blank grid
  const SEED = {
    kick:  [0, 6, 8, 14],
    snare: [4, 12],
    hat:   [0, 2, 4, 6, 8, 10, 12, 14],
    bass:  [0, 3, 8, 11],
    blip:  [7, 15]
  };

  const machineGrid = document.querySelector('.machine-grid');
  const playButton = document.querySelector('.machine-play');
  const tempoInput = document.querySelector('.machine-tempo input');
  const tempoLabel = document.querySelector('.machine-tempo b');

  if (machineGrid && playButton && tempoInput) {
    const pattern = {};
    const cells = {};
    let audio = null;
    let noise = null;
    let master = null;
    let playing = false;
    let step = 0;
    let nextStepTime = 0;
    let ticker = 0;
    let frame = 0;
    let queue = [];

    VOICES.forEach((voice) => {
      pattern[voice.id] = new Array(STEPS).fill(false);
      (SEED[voice.id] || []).forEach((index) => { pattern[voice.id][index] = true; });

      const row = document.createElement('div');
      row.className = 'machine-row';
      const name = document.createElement('span');
      name.className = 'machine-name';
      name.textContent = voice.label;
      row.appendChild(name);

      cells[voice.id] = [];
      for (let i = 0; i < STEPS; i += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'machine-cell';
        if (i % 4 === 0) cell.classList.add('is-downbeat');
        cell.setAttribute('aria-label', `${voice.label} step ${i + 1}`);
        cell.setAttribute('aria-pressed', String(pattern[voice.id][i]));
        cell.classList.toggle('is-on', pattern[voice.id][i]);
        cell.addEventListener('click', () => {
          pattern[voice.id][i] = !pattern[voice.id][i];
          cell.classList.toggle('is-on', pattern[voice.id][i]);
          cell.setAttribute('aria-pressed', String(pattern[voice.id][i]));
          markFound('beat');
        });
        cells[voice.id].push(cell);
        row.appendChild(cell);
      }
      machineGrid.appendChild(row);
    });

    const buildAudio = () => {
      if (audio) return;
      audio = new (window.AudioContext || window.webkitAudioContext)();
      master = audio.createGain();
      master.gain.value = .55;
      master.connect(audio.destination);

      // one second of white noise, reused by the snare and hat
      noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    };

    const envelope = (peak, at, decay) => {
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + .004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
      gain.connect(master);
      return gain;
    };

    const fromNoise = (at, decay, filter, frequency, peak) => {
      const source = audio.createBufferSource();
      source.buffer = noise;
      const band = audio.createBiquadFilter();
      band.type = filter;
      band.frequency.value = frequency;
      source.connect(band);
      band.connect(envelope(peak, at, decay));
      source.start(at);
      source.stop(at + decay + .02);
    };

    const tone = (at, decay, type, from, to, peak) => {
      const osc = audio.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(from, at);
      if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + decay * .7);
      osc.connect(envelope(peak, at, decay));
      osc.start(at);
      osc.stop(at + decay + .02);
    };

    const hit = {
      kick:  (at) => tone(at, .34, 'sine', 150, 46, .95),
      snare: (at) => { fromNoise(at, .18, 'bandpass', 1750, .5); tone(at, .09, 'triangle', 240, 170, .25); },
      hat:   (at) => fromNoise(at, .045, 'highpass', 7800, .22),
      bass:  (at) => tone(at, .3, 'triangle', 82, 82, .42),
      blip:  (at) => tone(at, .1, 'square', 880, 880, .12)
    };

    const stepSeconds = () => (60 / Number(tempoInput.value)) / 4;

    const schedule = () => {
      while (nextStepTime < audio.currentTime + .12) {
        VOICES.forEach((voice) => {
          if (pattern[voice.id][step]) hit[voice.id](nextStepTime);
        });
        queue.push({ step, time: nextStepTime });
        nextStepTime += stepSeconds();
        step = (step + 1) % STEPS;
      }
    };

    const paint = () => {
      if (!playing) return;
      while (queue.length && queue[0].time <= audio.currentTime) {
        const current = queue.shift().step;
        machineGrid.querySelectorAll('.is-playing').forEach((node) => node.classList.remove('is-playing'));
        VOICES.forEach((voice) => cells[voice.id][current].classList.add('is-playing'));
      }
      frame = window.requestAnimationFrame(paint);
    };

    const start = () => {
      buildAudio();
      audio.resume();
      playing = true;
      step = 0;
      queue = [];
      nextStepTime = audio.currentTime + .06;
      playButton.textContent = 'Stop';
      playButton.setAttribute('aria-pressed', 'true');
      machineGrid.classList.add('is-running');
      ticker = window.setInterval(schedule, 25);
      frame = window.requestAnimationFrame(paint);
      markFound('beat');
    };

    const stop = () => {
      playing = false;
      window.clearInterval(ticker);
      window.cancelAnimationFrame(frame);
      queue = [];
      playButton.textContent = 'Play';
      playButton.setAttribute('aria-pressed', 'false');
      machineGrid.classList.remove('is-running');
      machineGrid.querySelectorAll('.is-playing').forEach((node) => node.classList.remove('is-playing'));
    };

    playButton.addEventListener('click', () => (playing ? stop() : start()));

    tempoInput.addEventListener('input', () => {
      if (tempoLabel) tempoLabel.textContent = tempoInput.value;
    });

    const repaintCells = () => {
      VOICES.forEach((voice) => {
        cells[voice.id].forEach((cell, i) => {
          cell.classList.toggle('is-on', pattern[voice.id][i]);
          cell.setAttribute('aria-pressed', String(pattern[voice.id][i]));
        });
      });
    };

    document.querySelector('.machine-clear')?.addEventListener('click', () => {
      VOICES.forEach((voice) => pattern[voice.id].fill(false));
      repaintCells();
    });

    document.querySelector('.machine-shuffle')?.addEventListener('click', () => {
      const density = { kick: .28, snare: .14, hat: .5, bass: .24, blip: .12 };
      VOICES.forEach((voice) => {
        for (let i = 0; i < STEPS; i += 1) {
          pattern[voice.id][i] = Math.random() < density[voice.id];
        }
      });
      // keep a downbeat so it never comes back as mush
      pattern.kick[0] = true;
      repaintCells();
      markFound('beat');
    });

    // stop making noise if the tab goes away
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
  }

'''
s = s[:a] + MACHINE + s[b:]
s = s.replace('   Record player, bookshelf, keepy uppy, the loop, trivia, photo guessing.',
              '   Record player, bookshelf, keepy uppy, the loop, trivia, step sequencer.')
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('journal.js: photo quiz out, sequencer in')

# ============================ 4. journal.css ============================
p = 'dist/journal.css'
s = io.open(p, encoding='utf-8').read()
a = s.index('/* ------------------------- where was I ------------------------- */')
b = s.index('/* --------------------------- reveal + sizes --------------------------- */')

CSS = '''/* ---------------------------- four bars ---------------------------- */

.machine { border: 1px solid var(--line-strong); background: #141412; }
.machine-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 1rem;
  padding: 1rem 1.2rem; border-bottom: 1px solid var(--line);
}
.machine-play {
  min-width: 84px; padding: .6rem 1rem; color: var(--ink); background: var(--accent);
  border: 1px solid var(--accent); cursor: pointer;
  font-family: var(--mono); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase;
  transition: filter .2s ease;
}
.machine-play:hover, .machine-play:focus-visible { filter: brightness(1.12); }
.machine-play[aria-pressed="true"] { color: var(--paper); background: transparent; }
.machine-tempo { display: flex; align-items: center; gap: .6rem; color: var(--muted); font-family: var(--mono); font-size: .66rem; letter-spacing: .08em; text-transform: uppercase; }
.machine-tempo b { min-width: 2.2ch; color: var(--text-2); font-weight: 400; }
.machine-tempo input { width: clamp(90px, 14vw, 150px); accent-color: var(--accent); }
.machine-actions { margin-left: auto; display: flex; gap: .5rem; }
.machine-actions button {
  padding: .5rem .75rem; color: var(--text-3); background: none;
  border: 1px solid var(--line-strong); cursor: pointer;
  font-family: var(--mono); font-size: .66rem; text-transform: uppercase;
  transition: color .2s ease, border-color .2s ease;
}
.machine-actions button:hover, .machine-actions button:focus-visible { color: var(--paper); border-color: var(--accent); }

.machine-grid-wrap { overflow-x: auto; padding: 1.2rem; }
.machine-grid { display: grid; gap: .3rem; min-width: 520px; }
.machine-row { display: grid; grid-template-columns: 3.6rem repeat(16, minmax(0, 1fr)); gap: .3rem; align-items: center; }
.machine-name { color: var(--muted); font-family: var(--mono); font-size: .62rem; letter-spacing: .1em; }
.machine-cell {
  aspect-ratio: 1; min-height: 26px; padding: 0;
  background: #1e1d1a; border: 1px solid #2c2a25; border-radius: 2px; cursor: pointer;
  transition: background .12s ease, border-color .12s ease, transform .12s ease;
}
.machine-cell.is-downbeat { border-color: #3b3830; }
.machine-cell:hover { border-color: var(--accent); }
.machine-cell.is-on { background: var(--accent); border-color: var(--accent); }
.machine-cell.is-playing { transform: scaleY(1.14); }
.machine-cell.is-playing:not(.is-on) { background: #2b2924; }
.machine-cell.is-on.is-playing { background: #f0c389; box-shadow: 0 0 14px rgba(209, 154, 97, .6); }
.machine-note { margin: 0; padding: 0 1.2rem 1.2rem; color: var(--muted); font-size: .76rem; }

'''
s = s[:a] + CSS + s[b:]
s = re.sub(r'\n  \.place-game \{ grid-template-columns: 1fr; \}\n  \.place-shot \{ min-height: 240px; \}', '', s)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('journal.css: photo quiz styles out, sequencer styles in')

for f in glob.glob('dist/*.html') + glob.glob('dist/*/index.html'):
    t = io.open(f, encoding='utf-8').read()
    io.open(f, 'w', encoding='utf-8', newline='\n').write(t.replace('?v=48', '?v=49'))
print('cache bumped to v49')
