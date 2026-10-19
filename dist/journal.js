/* ---------------------------------------------------------------
   journal.js - the toys on the Outside work page.
   Record player, bookshelf, keepy uppy, the loop, trivia, step sequencer.
   --------------------------------------------------------------- */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const found = new Set();
  const meterDots = [...document.querySelectorAll('.discovery-meter i')];
  const meterCount = document.querySelector('.discovery-meter strong');
  const markFound = (key) => {
    if (found.has(key)) return;
    found.add(key);
    meterDots.forEach((dot, index) => dot.classList.toggle('is-found', index < found.size));
    if (meterCount) meterCount.textContent = `${found.size} / 6`;
  };

  const store = {
    get(key, fallback = 0) { try { return Number(localStorage.getItem(key)) || fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, String(value)); } catch {} }
  };

  const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  /* ========================= record player ========================= */

  const RECORDS = [
    { track: 'Revelry', artist: 'Kings of Leon', album: 'Only by the Night',
      link: 'https://music.apple.com/us/album/revelry/290302885?i=290303022',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/90/7a/14/907a143d-6621-ee94-3960-d12d4bf68258/mzaf_13004482978685020546.plus.aac.p.m4a' },
    { track: 'the last great american dynasty', artist: 'Taylor Swift', album: 'folklore',
      link: 'https://music.apple.com/us/album/folklore/1524793738',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4a/3c/21/4a3c2133-be44-9ce2-862b-6ff47e94f3cb/mzaf_5902596401825034325.plus.aac.p.m4a' },
    { track: 'Let It Happen', artist: 'Tame Impala', album: 'Currents',
      link: 'https://music.apple.com/us/album/currents/1440838039',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/77/68/1f/77681ffc-56e6-813c-e1bc-d94a9b5893c1/mzaf_570579359857462588.plus.aac.p.m4a' },
    { track: 'Champagne Supernova', artist: 'Oasis', album: '(What’s the Story) Morning Glory?',
      link: 'https://music.apple.com/us/album/whats-the-story-morning-glory-deluxe-remastered-edition/1525933483',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d4/26/87/d42687f0-ba51-2f85-5fa1-5ade873b7c28/mzaf_10904749887391821267.plus.aac.p.m4a' },
    { track: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours',
      link: 'https://music.apple.com/us/album/rumours/594061854',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d4/37/e7/d437e72a-c41b-332c-f196-bee295a9d673/mzaf_11574904347171701919.plus.aac.p.m4a' },
    { track: 'Supercut', artist: 'Lorde', album: 'Melodrama',
      link: 'https://music.apple.com/us/album/melodrama/1429662346',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fb/10/93/fb1093b0-ebdd-41ea-7412-6195b868bc18/mzaf_16686823053102149553.plus.aac.p.m4a' }
  ];

  const turntable = document.querySelector('.turntable-card');
  const turntableToggle = document.querySelector('.turntable-toggle');
  const playState = document.querySelector('.play-state');
  const recordAudio = document.querySelector('.record-audio');
  const nowTrack = document.querySelector('.now-track');
  const previewNote = document.querySelector('.preview-note');
  const albumButtons = [...document.querySelectorAll('.album-pick')];

  if (turntable && turntableToggle && playState && recordAudio) {
    let current = 0;

    const setPlaying = (playing) => {
      turntable.classList.toggle('is-paused', !playing);
      turntableToggle.setAttribute('aria-pressed', String(playing));
      turntableToggle.setAttribute('aria-label', playing ? 'Pause the record' : 'Play the record');
      playState.textContent = playing ? 'Pause' : 'Play';
    };

    const loadRecord = (index, autoplay) => {
      current = index;
      const record = RECORDS[index];
      recordAudio.src = record.audio;
      if (nowTrack) nowTrack.textContent = `${record.track} · ${record.artist}`;
      if (previewNote) {
        previewNote.href = record.link;
        previewNote.textContent = `${record.album}, on Apple Music`;
      }
      albumButtons.forEach((button, buttonIndex) => {
        button.classList.toggle('is-playing', buttonIndex === index);
        button.setAttribute('aria-pressed', String(buttonIndex === index));
      });
      if (autoplay) recordAudio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      else setPlaying(false);
    };

    const toggleRecord = () => {
      if (!recordAudio.paused) {
        recordAudio.pause();
        setPlaying(false);
        return;
      }
      recordAudio.play().then(() => setPlaying(true)).catch(() => {
        setPlaying(false);
        playState.textContent = 'Unavailable';
      });
      markFound('record');
    };

    turntableToggle.addEventListener('click', toggleRecord);
    playState.addEventListener('click', toggleRecord);

    albumButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (index === current && !recordAudio.paused) {
          recordAudio.pause();
          setPlaying(false);
          return;
        }
        loadRecord(index, true);
        markFound('record');
      });
    });

    recordAudio.addEventListener('ended', () => {
      recordAudio.currentTime = 0;
      loadRecord((current + 1) % RECORDS.length, true);
    });
    recordAudio.addEventListener('error', () => {
      setPlaying(false);
      playState.textContent = 'Unavailable';
    });

    loadRecord(0, false);
  }

  /* =========================== bookshelf =========================== */

  const shelfCurrent = document.querySelector('.shelf-current');
  document.querySelectorAll('.book').forEach((book) => {
    const showTitle = () => {
      if (shelfCurrent) shelfCurrent.textContent = `${book.dataset.title} · ${book.dataset.topic}`;
    };
    book.addEventListener('pointerenter', showTitle);
    book.addEventListener('focus', showTitle);
    book.addEventListener('click', () => markFound('book'));
  });

  /* =========================== keepy uppy ===========================
     Tap the ball before it drops. Every touch moves it somewhere new
     and shaves time off the window, so it tightens up as you go. */

  const kickStage = document.querySelector('.kick-stage');
  const ball = document.querySelector('.soccer-ball');
  const kickScore = document.querySelector('.kick-score');
  const kickBest = document.querySelector('.kick-best');
  const kickLevel = document.querySelector('.kick-level');
  const kickWindow = document.querySelector('.kick-window i');
  const kickMessage = document.querySelector('.kick-message');

  if (kickStage && ball) {
    const START_WINDOW = 1500;
    const MIN_WINDOW = 480;
    let kicks = 0;
    let dropTimer = 0;
    let best = store.get('aarav-keepy-best');
    if (kickBest) kickBest.textContent = String(best);

    const windowFor = (score) => Math.max(MIN_WINDOW, START_WINDOW - score * 45);

    const place = () => {
      ball.style.left = `${12 + Math.random() * 76}%`;
      ball.style.top = `${14 + Math.random() * 72}%`;
    };

    const armWindow = (duration) => {
      if (!kickWindow) return;
      kickWindow.style.transition = 'none';
      kickWindow.style.width = '100%';
      void kickWindow.offsetWidth;
      kickWindow.style.transition = `width ${duration}ms linear`;
      kickWindow.style.width = '0%';
    };

    const endRound = (reason) => {
      window.clearTimeout(dropTimer);
      ball.classList.remove('is-live', 'is-hot');
      ball.classList.add('is-dropped');
      if (kickWindow) { kickWindow.style.transition = 'none'; kickWindow.style.width = '0%'; }
      if (kicks > best) {
        best = kicks;
        store.set('aarav-keepy-best', best);
        if (kickBest) kickBest.textContent = String(best);
        if (kickMessage) kickMessage.textContent = `${kicks} touches. New best.`;
        return;
      }
      if (kickMessage) {
        kickMessage.textContent = kicks >= 23
          ? `${kicks} touches. Past twenty-three, which was my number.`
          : `${reason} ${kicks} touches.`;
      }
    };

    const reset = () => {
      window.clearTimeout(dropTimer);
      kicks = 0;
      ball.classList.remove('is-dropped', 'is-live', 'is-hot');
      ball.style.removeProperty('--size');
      ball.style.left = '50%';
      ball.style.top = '58%';
      if (kickScore) kickScore.textContent = '0';
      if (kickLevel) kickLevel.textContent = '1.0x';
      if (kickWindow) { kickWindow.style.transition = 'none'; kickWindow.style.width = '0%'; }
      if (kickMessage) kickMessage.textContent = 'Tap the ball to start.';
    };

    ball.addEventListener('click', () => {
      if (ball.classList.contains('is-dropped')) return;
      kicks += 1;
      if (kickScore) kickScore.textContent = String(kicks);

      const duration = windowFor(kicks);
      if (kickLevel) kickLevel.textContent = `${(START_WINDOW / duration).toFixed(1)}x`;
      ball.classList.add('is-live');
      ball.classList.toggle('is-hot', duration <= MIN_WINDOW + 120);
      ball.style.setProperty('--size', `${Math.max(46, 72 - kicks * 0.8)}px`);

      place();
      armWindow(duration);
      window.clearTimeout(dropTimer);
      dropTimer = window.setTimeout(() => endRound('Dropped it.'), duration);

      if (kickMessage) {
        if (kicks === 1) kickMessage.textContent = 'Keep it up.';
        else if (kicks % 10 === 0) kickMessage.textContent = `${kicks}. Getting quicker.`;
      }
      markFound('keepy');
    });

    document.querySelector('.kick-reset')?.addEventListener('click', reset);
    reset();
  }

  /* ============================= the loop =============================
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

  // getTotalLength is the one API here that isn't universal. Without this
  // guard a throw would abort the whole file and take the sequencer,
  // the trivia and the scroll spy down with it.
  if (loopSvg && loopGuide && loopTrail && typeof loopGuide.getTotalLength === 'function') {
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

    // screen pixels -> svg user units, which is where the sampled path lives
    const probe = loopSvg.createSVGPoint();
    const toUserSpace = (event) => {
      probe.x = event.clientX;
      probe.y = event.clientY;
      const matrix = loopSvg.getScreenCTM();
      return matrix ? probe.matrixTransform(matrix.inverse()) : { x: -1e4, y: -1e4 };
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

  /* ============================== trivia ============================== */

  const TRIVIA = [
    { c: 'GEOGRAPHY', q: 'Which country has the most time zones?', a: ['Russia', 'United States', 'France', 'Australia'], k: 2, n: 'France has 12, because of its overseas territories.' },
    { c: 'GEOGRAPHY', q: 'Which river touches the most countries?', a: ['Nile', 'Rhine', 'Danube', 'Amazon'], k: 2, n: 'The Danube runs through or along ten.' },
    { c: 'GEOGRAPHY', q: 'Which national capital sits highest above sea level?', a: ['Quito', 'Kathmandu', 'Bogotá', 'La Paz'], k: 3, n: 'La Paz sits around 3,640 metres up.' },
    { c: 'GEOGRAPHY', q: 'Which country has the most islands?', a: ['Indonesia', 'Canada', 'Sweden', 'Philippines'], k: 2, n: 'Sweden has roughly 267,000 of them.' },
    { c: 'GEOGRAPHY', q: 'Which country has no permanent rivers?', a: ['Saudi Arabia', 'Mongolia', 'Chad', 'Peru'], k: 0, n: 'Plenty of wadis, but none that run year-round.' },
    { c: 'GEOGRAPHY', q: 'Lake Baikal holds the record for being the world’s what?', a: ['Largest by area', 'Deepest', 'Saltiest', 'Highest'], k: 1, n: 'Over 1,600 metres down, holding a fifth of the world’s fresh surface water.' },
    { c: 'GEOGRAPHY', q: 'Which major city spans two continents?', a: ['Cairo', 'Istanbul', 'Baku', 'Athens'], k: 1, n: 'The Bosphorus splits it between Europe and Asia.' },
    { c: 'GEOGRAPHY', q: 'Which US state has the longest coastline?', a: ['Florida', 'California', 'Alaska', 'Maine'], k: 2, n: 'Alaska’s is longer than every other state combined.' },
    { c: 'GEOGRAPHY', q: 'Which two countries are double-landlocked?', a: ['Nepal and Bhutan', 'Liechtenstein and Uzbekistan', 'Austria and Hungary', 'Bolivia and Paraguay'], k: 1, n: 'From either one you cross two borders to reach the sea.' },

    { c: 'HISTORY', q: 'The Peace of Westphalia ended which conflict?', a: ['Seven Years’ War', 'Thirty Years’ War', 'War of Spanish Succession', 'Crimean War'], k: 1, n: 'The 1648 treaties closed the Thirty Years’ War.' },
    { c: 'HISTORY', q: 'Who ruled Mali during its famous 1324 pilgrimage?', a: ['Sundiata Keita', 'Mansa Musa', 'Askia Muhammad', 'Sunni Ali'], k: 1, n: 'He handed out so much gold in Cairo that he depressed its value for years.' },
    { c: 'HISTORY', q: 'Who captured Constantinople in 1453?', a: ['Suleiman I', 'Bayezid I', 'Mehmed II', 'Selim I'], k: 2, n: 'Mehmed II was 21 when the city fell.' },
    { c: 'HISTORY', q: 'How long did the Hundred Years’ War actually last?', a: ['100 years', '116 years', '81 years', '134 years'], k: 1, n: '1337 to 1453, with long pauses in between.' },
    { c: 'HISTORY', q: 'Which empire was ruled from Tenochtitlan?', a: ['Inca', 'Maya', 'Aztec', 'Olmec'], k: 2, n: 'Mexico City sits on top of it now.' },
    { c: 'HISTORY', q: 'Who completed the first circumnavigation of the globe?', a: ['Ferdinand Magellan', 'Juan Sebastián Elcano', 'Francis Drake', 'Vasco da Gama'], k: 1, n: 'Magellan died in the Philippines. Elcano brought the last ship home.' },
    { c: 'HISTORY', q: 'The Code of Hammurabi comes from which civilisation?', a: ['Assyria', 'Babylon', 'Phoenicia', 'Hittite'], k: 1, n: 'Carved on a basalt stele around 1750 BC.' },
    { c: 'HISTORY', q: 'The Rosetta Stone was the key to deciphering what?', a: ['Linear B', 'Cuneiform', 'Egyptian hieroglyphs', 'Mayan glyphs'], k: 2, n: 'The same decree appears in Greek, Demotic, and hieroglyphs.' },
    { c: 'HISTORY', q: 'Which city was the usual eastern end of the Silk Road?', a: ['Beijing', 'Chang’an', 'Kashgar', 'Luoyang'], k: 1, n: 'Chang’an, now called Xi’an.' },
    { c: 'HISTORY', q: 'In which year did the Berlin Wall come down?', a: ['1987', '1989', '1991', '1985'], k: 1, n: 'The crossings opened on 9 November 1989.' },

    { c: 'CULTURE', q: 'Kintsugi repairs pottery using what?', a: ['Silk thread', 'Gold lacquer', 'Bamboo pins', 'Rice paper'], k: 1, n: 'The repair is highlighted rather than hidden.' },
    { c: 'CULTURE', q: 'The Epic of Gilgamesh survives mainly in which language?', a: ['Sumerian', 'Akkadian', 'Aramaic', 'Old Persian'], k: 1, n: 'The standard version is on Akkadian tablets.' },
    { c: 'CULTURE', q: 'Which city has the university usually called the oldest still running?', a: ['Bologna', 'Fez', 'Oxford', 'Cairo'], k: 1, n: 'Al-Qarawiyyin in Fez, founded in 859.' },
    { c: 'CULTURE', q: 'Which language has the most native speakers?', a: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], k: 2, n: 'Roughly double the next one down.' },
    { c: 'CULTURE', q: 'Hanami is the Japanese practice of viewing what?', a: ['The full moon', 'Cherry blossoms', 'Autumn maples', 'Snow'], k: 1, n: 'Tsukimi is the moon one, momijigari the maples.' },
    { c: 'CULTURE', q: 'The Mona Lisa is painted on what surface?', a: ['Canvas', 'Poplar panel', 'Plaster', 'Copper'], k: 1, n: 'A single poplar board, which is why it warps.' },
    { c: 'CULTURE', q: 'Which novel opens with "Call me Ishmael"?', a: ['Moby-Dick', 'Billy Budd', 'The Old Man and the Sea', 'Heart of Darkness'], k: 0, n: 'Melville, 1851.' },
    { c: 'CULTURE', q: 'Dickens published his early sketches under what pen name?', a: ['Boz', 'Currer Bell', 'Elia', 'Saki'], k: 0, n: 'Sketches by Boz came out in 1836.' },
    { c: 'CULTURE', q: 'Who invented Esperanto?', a: ['Rudolf Carnap', 'L. L. Zamenhof', 'Otto Jespersen', 'Giuseppe Peano'], k: 1, n: 'A Polish ophthalmologist, in 1887.' },

    { c: 'SPORT', q: 'Which country has played in every men’s FIFA World Cup?', a: ['Germany', 'Argentina', 'Italy', 'Brazil'], k: 3, n: 'Brazil is the only one with a perfect record.' },
    { c: 'SPORT', q: 'Why is the Tour de France leader’s jersey yellow?', a: ['French royal colours', 'A sponsor’s logo', 'The organiser’s newspaper', 'Visibility in fog'], k: 2, n: 'L’Auto was printed on yellow paper.' },
    { c: 'SPORT', q: 'Who designed the five-ring Olympic symbol?', a: ['Jules Rimet', 'Pierre de Coubertin', 'Henri Delaunay', 'Avery Brundage'], k: 1, n: 'He drew it in 1913.' },
    { c: 'SPORT', q: 'In chess, which piece can never move backwards?', a: ['Knight', 'Bishop', 'Pawn', 'Rook'], k: 2, n: 'Which is what makes promotion worth the trip.' },
    { c: 'SPORT', q: 'The marathon was fixed at 26.2 miles at which Olympics?', a: ['1896 Athens', '1908 London', '1924 Paris', '1936 Berlin'], k: 1, n: 'The course ran from Windsor Castle to the royal box.' },
    { c: 'SPORT', q: 'How many players per team are in the water in water polo?', a: ['5', '6', '7', '9'], k: 2, n: 'Six field players and a goalkeeper.' },
    { c: 'SPORT', q: 'Which sport is known as "the sweet science"?', a: ['Fencing', 'Boxing', 'Snooker', 'Archery'], k: 1, n: 'Popularised by A. J. Liebling, borrowing a much older phrase.' },

    { c: 'SCIENCE', q: 'What is the most abundant gas in Earth’s atmosphere?', a: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'], k: 1, n: 'Nitrogen is about 78% of it.' },
    { c: 'SCIENCE', q: 'Which element has the highest melting point?', a: ['Platinum', 'Tungsten', 'Iron', 'Titanium'], k: 1, n: 'Tungsten melts at 3,422°C.' },
    { c: 'SCIENCE', q: 'How long does sunlight take to reach Earth?', a: ['8 seconds', '8 minutes', '8 hours', 'Instantly'], k: 1, n: 'About eight minutes and twenty seconds.' },
    { c: 'SCIENCE', q: 'Which blood type is the universal red cell donor?', a: ['AB positive', 'O negative', 'A negative', 'B positive'], k: 1, n: 'No A, B, or Rh antigens for a recipient to react against.' },
    { c: 'SCIENCE', q: 'What is the hardest naturally occurring material?', a: ['Quartz', 'Corundum', 'Diamond', 'Topaz'], k: 2, n: 'Top of the Mohs scale at 10.' },

    { c: 'MUSIC', q: 'How many keys are on a standard piano?', a: ['76', '85', '88', '92'], k: 2, n: 'Fifty-two white, thirty-six black.' },
    { c: 'MUSIC', q: 'Which instrument has 47 strings and 7 pedals?', a: ['Harpsichord', 'Concert harp', 'Zither', 'Lute'], k: 1, n: 'Each pedal has three positions.' },
    { c: 'MUSIC', q: 'What does "a cappella" literally mean?', a: ['Without rhythm', 'In the chapel', 'With feeling', 'By heart'], k: 1, n: 'Church singing, unaccompanied.' },
    { c: 'MUSIC', q: 'Which film won the first Academy Award for Best Picture?', a: ['Wings', 'Sunrise', 'The Jazz Singer', 'Metropolis'], k: 0, n: 'Wings, at the 1929 ceremony.' },
    { c: 'GEOGRAPHY', q: 'What is the largest desert on Earth?', a: ['The Sahara', 'Antarctica', 'The Gobi', 'The Arabian'], k: 1, n: 'A desert is defined by rainfall, not heat.' },
    { c: 'GEOGRAPHY', q: 'Which country has the most pyramids?', a: ['Egypt', 'Mexico', 'Sudan', 'Peru'], k: 2, n: 'Sudan has roughly twice as many as Egypt.' },
    { c: 'GEOGRAPHY', q: 'Which two countries share the longest border?', a: ['Russia and China', 'Canada and the US', 'Argentina and Chile', 'India and Bangladesh'], k: 1, n: 'About 8,900 kilometres of it.' },
    { c: 'GEOGRAPHY', q: 'Which sea has no coastline?', a: ['The Coral Sea', 'The Sargasso Sea', 'The Tasman Sea', 'The Andaman Sea'], k: 1, n: 'Ocean currents bound it instead of land.' },
    { c: 'GEOGRAPHY', q: 'Measured from its base, which mountain is tallest?', a: ['Everest', 'Denali', 'Mauna Kea', 'Aconcagua'], k: 2, n: 'Most of Mauna Kea is under the Pacific.' },
    { c: 'GEOGRAPHY', q: 'What is the largest island in the Mediterranean?', a: ['Sardinia', 'Cyprus', 'Sicily', 'Crete'], k: 2, n: 'Sardinia is second.' },

    { c: 'HISTORY', q: 'In which year was the Magna Carta sealed?', a: ['1066', '1215', '1348', '1415'], k: 1, n: 'At Runnymede, under duress.' },
    { c: 'HISTORY', q: 'Who was the first Roman emperor?', a: ['Julius Caesar', 'Augustus', 'Nero', 'Tiberius'], k: 1, n: 'He took the title in 27 BC. Caesar never held it.' },
    { c: 'HISTORY', q: 'Most of the Great Wall standing today was built by which dynasty?', a: ['Qin', 'Han', 'Tang', 'Ming'], k: 3, n: 'Earlier walls were mostly rammed earth and have worn away.' },
    { c: 'HISTORY', q: 'Who led the Haitian Revolution?', a: ['Toussaint Louverture', 'Simón Bolívar', 'José de San Martín', 'Jean-Jacques Dessalines'], k: 0, n: 'The only slave revolt that founded a state.' },
    { c: 'HISTORY', q: 'Which country was formerly called Siam?', a: ['Myanmar', 'Cambodia', 'Thailand', 'Laos'], k: 2, n: 'Renamed in 1939.' },

    { c: 'CULTURE', q: 'After the Bible, what is the most translated book?', a: ['Don Quixote', 'The Little Prince', 'Pinocchio', 'Hamlet'], k: 1, n: 'Into more than 500 languages.' },
    { c: 'CULTURE', q: 'The word "robot" comes from a play in which language?', a: ['German', 'Czech', 'Russian', 'Hungarian'], k: 1, n: 'Karel Čapek’s R.U.R., 1920.' },
    { c: 'CULTURE', q: 'Which novel opens with the clocks striking thirteen?', a: ['Brave New World', 'Fahrenheit 451', '1984', 'A Clockwork Orange'], k: 2, n: 'Orwell, 1949.' },
    { c: 'CULTURE', q: 'Who wrote One Hundred Years of Solitude?', a: ['Jorge Luis Borges', 'Gabriel García Márquez', 'Mario Vargas Llosa', 'Julio Cortázar'], k: 1, n: 'Published in 1967.' },
    { c: 'CULTURE', q: 'Hygge is a concept from which country?', a: ['Sweden', 'Norway', 'Denmark', 'Finland'], k: 2, n: 'Roughly, cosy contentment.' },
    { c: 'CULTURE', q: 'Which is the oldest film festival still running?', a: ['Cannes', 'Venice', 'Berlin', 'Sundance'], k: 1, n: 'First held in 1932.' },

    { c: 'SPORT', q: 'The French Open is played on what surface?', a: ['Grass', 'Hard court', 'Clay', 'Carpet'], k: 2, n: 'The only clay major.' },
    { c: 'SPORT', q: 'How many players are on a rugby union team?', a: ['11', '13', '15', '18'], k: 2, n: 'Rugby league plays 13.' },
    { c: 'SPORT', q: 'The Ashes is contested between which two countries?', a: ['England and Australia', 'India and Pakistan', 'Australia and New Zealand', 'England and India'], k: 0, n: 'Played for since 1882.' },
    { c: 'SPORT', q: 'What is a perfect score in ten-pin bowling?', a: ['200', '250', '300', '360'], k: 2, n: 'Twelve strikes in a row.' },
    { c: 'SPORT', q: 'How long is an Olympic swimming pool?', a: ['25 m', '50 m', '75 m', '100 m'], k: 1, n: 'Short course is 25.' },
    { c: 'SPORT', q: 'Which country has won the most Olympic gold medals?', a: ['Soviet Union', 'United States', 'China', 'Germany'], k: 1, n: 'By a wide margin at the summer games.' },
    { c: 'SPORT', q: 'The Fosbury Flop is a technique in which event?', a: ['Pole vault', 'Long jump', 'High jump', 'Diving'], k: 2, n: 'Dick Fosbury won gold with it in 1968 and changed the event.' },
    { c: 'SPORT', q: 'Judo was founded in which country?', a: ['China', 'Korea', 'Japan', 'Brazil'], k: 2, n: 'Jigoro Kano, 1882.' },

    { c: 'SCIENCE', q: 'Which metal is liquid at room temperature?', a: ['Gallium', 'Mercury', 'Caesium', 'Lead'], k: 1, n: 'It melts at about -39°C.' },
    { c: 'SCIENCE', q: 'How many bones are in the adult human body?', a: ['186', '206', '244', '270'], k: 1, n: 'Babies have around 270. Some fuse as you grow.' },
    { c: 'SCIENCE', q: 'Which planet rotates on its side?', a: ['Neptune', 'Saturn', 'Uranus', 'Mercury'], k: 2, n: 'Tilted about 98 degrees.' },
    { c: 'SCIENCE', q: 'What is the most abundant element in the universe?', a: ['Oxygen', 'Carbon', 'Helium', 'Hydrogen'], k: 3, n: 'About three quarters of all ordinary matter.' },
    { c: 'SCIENCE', q: 'What is absolute zero in Celsius?', a: ['-100', '-273.15', '-459.67', '-1000'], k: 1, n: 'Nothing gets colder than this.' },
    { c: 'SCIENCE', q: 'Which part of the brain governs balance?', a: ['Cerebellum', 'Hippocampus', 'Amygdala', 'Medulla'], k: 0, n: 'It sits under the back of the brain.' },
    { c: 'SCIENCE', q: 'Who proposed the theory of continental drift?', a: ['Charles Lyell', 'Alfred Wegener', 'James Hutton', 'Harry Hess'], k: 1, n: 'In 1912. He was dismissed for fifty years.' },
    { c: 'SCIENCE', q: 'On Venus, which is longer: a day or a year?', a: ['A day', 'A year', 'They are equal', 'Venus has no day'], k: 0, n: '243 Earth days to spin once, 225 to orbit the Sun.' },
    { c: 'SCIENCE', q: 'In which year was the structure of DNA published?', a: ['1928', '1953', '1962', '1971'], k: 1, n: 'Watson and Crick, built on Rosalind Franklin’s data.' },
    { c: 'SCIENCE', q: 'What does a Geiger counter measure?', a: ['Magnetism', 'Radiation', 'Air pressure', 'Sound'], k: 1, n: 'It clicks once per ionising event.' },

    { c: 'MUSIC', q: 'How many strings does a standard violin have?', a: ['4', '5', '6', '7'], k: 0, n: 'G, D, A and E.' },
    { c: 'MUSIC', q: 'What does "forte" mean?', a: ['Fast', 'Soft', 'Loud', 'Smooth'], k: 2, n: 'Piano means soft, which is where the instrument got its name.' },
    { c: 'MUSIC', q: 'Which Beatles album cover shows a zebra crossing?', a: ['Revolver', 'Abbey Road', 'Let It Be', 'Rubber Soul'], k: 1, n: 'Shot outside the studio in 1969.' },
    { c: 'MUSIC', q: 'Who composed The Four Seasons?', a: ['Bach', 'Handel', 'Vivaldi', 'Corelli'], k: 2, n: 'Four violin concertos, around 1720.' },
    { c: 'MUSIC', q: 'Which key has no sharps or flats?', a: ['G major', 'C major', 'F major', 'D major'], k: 1, n: 'All white keys.' },
    { c: 'MUSIC', q: 'Which is the highest female voice type?', a: ['Alto', 'Mezzo-soprano', 'Soprano', 'Contralto'], k: 2, n: 'Contralto is the lowest.' },
    { c: 'MUSIC', q: 'Which composer kept writing after going deaf?', a: ['Mozart', 'Beethoven', 'Schubert', 'Brahms'], k: 1, n: 'He could barely hear the Ninth Symphony he wrote.' },
    { c: 'MUSIC', q: 'How is a theremin played?', a: ['With a bow', 'Without touching it', 'With foot pedals', 'By blowing into it'], k: 1, n: 'You move your hands through its electromagnetic field.' },
    { c: 'MUSIC', q: 'A classical symphony usually has how many movements?', a: ['Two', 'Three', 'Four', 'Six'], k: 2, n: 'Fast, slow, dance, fast.' },
    { c: 'MUSIC', q: 'A timpanist plays what?', a: ['Cymbals', 'Kettledrums', 'Xylophone', 'Snare drum'], k: 1, n: 'Tuned to pitch, unlike most drums.' },
    { c: 'MUSIC', q: 'Which song has been recorded by the most other artists?', a: ['Yesterday', 'Summertime', 'Imagine', 'My Way'], k: 0, n: 'Over two thousand versions of it exist.' }
  ];

  const triviaCategory = document.querySelector('.trivia-category');
  const triviaQuestion = document.querySelector('.trivia-question');
  const triviaAnswers = document.querySelector('.trivia-answers');
  const triviaNote = document.querySelector('.trivia-note');
  const triviaScore = document.querySelector('.trivia-score');
  const triviaBest = document.querySelector('.trivia-best');
  const triviaNext = document.querySelector('.trivia-next');
  const triviaRound = [...document.querySelectorAll('.trivia-round i')];
  const ROUND = 5;

  if (triviaQuestion && triviaAnswers && triviaNext) {
    let order = [];
    let index = 0;
    let correct = 0;
    let streak = 0;
    let best = store.get('aarav-trivia-best');
    if (triviaBest) triviaBest.textContent = String(best);

    // Five questions, never two from the same category back to back.
    const drawRound = () => {
      const pool = shuffle(TRIVIA);
      const picked = [];
      while (picked.length < ROUND && pool.length) {
        const last = picked[picked.length - 1];
        let next = pool.findIndex((item) => !last || item.c !== last.c);
        if (next === -1) next = 0;
        picked.push(pool.splice(next, 1)[0]);
      }
      return picked;
    };

    const show = () => {
      if (index >= ROUND) {
        if (correct > best) {
          best = correct;
          store.set('aarav-trivia-best', best);
          if (triviaBest) triviaBest.textContent = String(best);
        }
        triviaCategory.textContent = 'ROUND OVER';
        triviaQuestion.textContent = `${correct} out of ${ROUND}.`;
        triviaAnswers.replaceChildren();
        triviaNote.textContent = correct === ROUND ? 'Clean sweep.' : correct >= 4 ? 'Nice.' : 'Go again.';
        triviaNext.textContent = 'Play again';
        triviaNext.hidden = false;
        triviaRound.forEach((dot) => dot.classList.remove('is-current'));
        return;
      }

      const item = order[index];
      triviaCategory.textContent = `${item.c} · ${index + 1}/${ROUND}`;
      triviaQuestion.textContent = item.q;
      triviaNote.textContent = streak >= 2 ? `${streak} in a row.` : 'Pick one.';
      triviaNext.hidden = true;
      triviaRound.forEach((dot, dotIndex) => dot.classList.toggle('is-current', dotIndex === index));

      triviaAnswers.replaceChildren(...item.a.map((answer, answerIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        const letter = document.createElement('span');
        letter.textContent = String.fromCharCode(65 + answerIndex);
        const label = document.createElement('b');
        label.textContent = answer;
        button.append(letter, label);
        button.addEventListener('click', () => {
          if (triviaAnswers.classList.contains('is-answered')) return;
          triviaAnswers.classList.add('is-answered');
          const right = answerIndex === item.k;
          [...triviaAnswers.children].forEach((choice, choiceIndex) => {
            choice.classList.toggle('is-correct', choiceIndex === item.k);
            choice.classList.toggle('is-wrong', choiceIndex === answerIndex && !right);
          });
          if (right) { correct += 1; streak += 1; } else { streak = 0; }
          triviaScore.textContent = String(correct);
          triviaRound[index]?.classList.add(right ? 'is-right' : 'is-missed');
          triviaNote.textContent = item.n;
          triviaNext.hidden = false;
          markFound('trivia');
        });
        return button;
      }));
      triviaAnswers.classList.remove('is-answered');
    };

    const newRound = () => {
      order = drawRound();
      index = 0;
      correct = 0;
      streak = 0;
      triviaScore.textContent = '0';
      triviaNext.textContent = 'Next question';
      triviaRound.forEach((dot) => dot.classList.remove('is-right', 'is-missed', 'is-current'));
      show();
    };

    triviaNext.addEventListener('click', () => {
      if (index >= ROUND) { newRound(); return; }
      index += 1;
      show();
    });

    newRound();
  }

  /* ============================== four bars ==============================
     A step sequencer. Nothing is sampled: every voice is built out of
     oscillators and a noise buffer, and steps are scheduled against the
     audio clock rather than setInterval, which is what keeps it in time. */

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
        cell.setAttribute('aria-label', voice.label + ' step ' + (i + 1));
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
      const Ctor = window.AudioContext || window.webkitAudioContext;
      audio = new Ctor();
      master = audio.createGain();
      master.gain.value = .55;
      master.connect(audio.destination);

      // one second of white noise, reused by the snare and the hat
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
        queue.push({ step: step, time: nextStepTime });
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
      pattern.kick[0] = true;   // always leave a downbeat
      repaintCells();
      markFound('beat');
    });

    // do not keep making noise into a tab nobody is looking at
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
  }

  /* ===================== reveals and section spy ===================== */

  const sections = document.querySelectorAll('.journal-section');
  if (reduced || !('IntersectionObserver' in window)) {
    sections.forEach((section) => section.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .07 });
    sections.forEach((section) => revealObserver.observe(section));
  }

  const sectionLinks = [...document.querySelectorAll('.section-nav a')];
  if (sectionLinks.length) {
    let ticking = false;
    const update = () => {
      let current = sectionLinks[0];
      sectionLinks.forEach((link) => {
        const section = document.querySelector(link.hash);
        if (section && section.getBoundingClientRect().top < 180) current = link;
        link.removeAttribute('aria-current');
      });
      current.setAttribute('aria-current', 'location');
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  window.addEventListener('load', () => {
    if (!window.location.hash) return;
    window.setTimeout(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' });
    }, 120);
  });
})();
