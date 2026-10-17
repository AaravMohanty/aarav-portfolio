/* ---------------------------------------------------------------
   journal.js - the toys on the Outside work page.
   Record player, bookshelf, keepy uppy, departure board, trivia.
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
    { track: 'cardigan', artist: 'Taylor Swift', album: 'folklore',
      link: 'https://music.apple.com/us/album/folklore/1524793738',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6a/cd/00/6acd00e6-a733-7a98-07eb-0a889b2b35ab/mzaf_424591521405406197.plus.aac.p.m4a' },
    { track: 'Let It Happen', artist: 'Tame Impala', album: 'Currents',
      link: 'https://music.apple.com/us/album/currents/1440838039',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/77/68/1f/77681ffc-56e6-813c-e1bc-d94a9b5893c1/mzaf_570579359857462588.plus.aac.p.m4a' },
    { track: 'Wonderwall', artist: 'Oasis', album: '(What’s the Story) Morning Glory?',
      link: 'https://music.apple.com/us/album/whats-the-story-morning-glory-deluxe-remastered-edition/1525933483',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/86/3c/97/863c9741-2dbd-7ca2-3c88-67e87d504343/mzaf_13259566290948941960.plus.aac.p.m4a' },
    { track: 'Dreams', artist: 'Fleetwood Mac', album: 'Rumours',
      link: 'https://music.apple.com/us/album/rumours/594061854',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d4/37/e7/d437e72a-c41b-332c-f196-bee295a9d673/mzaf_11574904347171701919.plus.aac.p.m4a' },
    { track: 'Green Light', artist: 'Lorde', album: 'Melodrama',
      link: 'https://music.apple.com/us/album/melodrama/1429662346',
      audio: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/52/98/aa/5298aa77-f5d0-e6b7-7f24-5d06409abfc8/mzaf_4826261660034311199.plus.aac.p.m4a' }
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

  /* ========================== saturday plan ========================== */

  const plans = {
    trail: { image: '/photos/friends-hike.jpg', alt: 'Hiking with friends', label: 'TRAIL DAY', title: 'Early start, bad signal.', copy: 'Usually with friends.', coordinate: 'phone on 10%' },
    match: { image: '/photos/soccer.jpg', alt: 'Playing in a soccer match', label: 'MATCH DAY', title: 'One more game.', copy: 'Soccer mostly. Tennis lately.', coordinate: 'next goal wins' },
    run: { image: '/photos/creek.jpg', alt: 'A creek running over mossy rocks', label: 'RUN DAY', title: 'No route planned.', copy: 'Pick a direction, figure out the way back later.', coordinate: 'watch says keep going' },
    new: { image: '/photos/multnomah-falls.jpg', alt: 'Multnomah Falls in Oregon', label: 'OPEN DAY', title: 'Try it once.', copy: 'Golf and pickleball got on the list this way.', coordinate: 'plans pending' }
  };
  const planStage = document.querySelector('.plan-stage');
  document.querySelectorAll('.plan-option').forEach((button) => {
    button.addEventListener('click', () => {
      const plan = plans[button.dataset.plan];
      if (!plan || !planStage) return;
      document.querySelectorAll('.plan-option').forEach((item) => item.classList.toggle('is-active', item === button));
      planStage.classList.add('is-changing');
      window.setTimeout(() => {
        const image = planStage.querySelector('img');
        image.src = plan.image;
        image.alt = plan.alt;
        planStage.querySelector('.plan-label').textContent = plan.label;
        planStage.querySelector('.plan-title').textContent = plan.title;
        planStage.querySelector('.plan-copy').textContent = plan.copy;
        planStage.querySelector('.plan-coordinate').textContent = plan.coordinate;
        planStage.classList.remove('is-changing');
      }, reduced ? 0 : 220);
      markFound('plan');
    });
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

  /* ========================== departure board ==========================
     A split-flap board that works through every stop before repeating. */

  const STOPS = [
    { name: 'Turkey', note: 'Istanbul · Hagia Sophia', image: '/photos/destinations/turkey.jpg' },
    { name: 'Peru', note: 'Machu Picchu · 2,430 m', image: '/photos/destinations/peru.jpg' },
    { name: 'Greece', note: 'Santorini · the Cyclades', image: '/photos/destinations/greece.jpg' },
    { name: 'Olympic', note: 'Washington · temperate rainforest', image: '/photos/creek.jpg' },
    { name: 'Oregon Coast', note: 'Highway 101, most of it', image: '/photos/coast.jpg' },
    { name: 'Redwoods', note: 'California · tallest trees on earth', image: '/photos/hike.jpg' },
    { name: 'Multnomah', note: 'Oregon · 620 ft of waterfall', image: '/photos/multnomah-falls.jpg' },
    { name: 'Mt. Rainier', note: 'Washington · 14,411 ft', image: '/photos/friends-hike.jpg' }
  ];

  const flapTarget = document.querySelector('.departure-board strong');
  const gateNode = document.querySelector('.departure-board .gate');
  const stopNote = document.querySelector('.stop-note');
  const travelImage = document.querySelector('.travel-visual img');
  const travelStamp = document.querySelector('.travel-stamp');
  const travelCount = document.querySelector('.travel-count');
  const travelSpin = document.querySelector('.travel-spin');

  if (flapTarget && travelSpin) {
    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .';
    const seen = new Set();
    let bag = shuffle(STOPS);
    let flapping = false;

    const flapTo = (text) => {
      if (reduced) { flapTarget.textContent = text; return Promise.resolve(); }
      return new Promise((resolve) => {
        const upper = text.toUpperCase();
        let settled = 0;
        const tick = window.setInterval(() => {
          let output = '';
          for (let i = 0; i < upper.length; i += 1) {
            output += i < settled ? upper[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          flapTarget.textContent = output;
          settled += 1;
          if (settled > upper.length) {
            window.clearInterval(tick);
            flapTarget.textContent = text;
            resolve();
          }
        }, 55);
      });
    };

    travelSpin.addEventListener('click', async () => {
      if (flapping) return;
      flapping = true;
      travelSpin.disabled = true;

      if (!bag.length) bag = shuffle(STOPS);
      const stop = bag.pop();

      if (gateNode) gateNode.textContent = `Gate ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${1 + Math.floor(Math.random() * 24)}`;
      if (stopNote) stopNote.textContent = '';
      if (travelStamp) travelStamp.textContent = 'BEEN';

      await flapTo(stop.name);

      if (travelImage) {
        travelImage.classList.add('is-swapping');
        window.setTimeout(() => {
          travelImage.src = stop.image;
          travelImage.alt = `A photo from ${stop.name}`;
          travelImage.classList.remove('is-swapping');
        }, reduced ? 0 : 160);
      }
      if (stopNote) stopNote.textContent = stop.note;

      seen.add(stop.name);
      if (travelCount) travelCount.textContent = `${seen.size} / ${STOPS.length} stops`;

      travelSpin.disabled = false;
      travelSpin.textContent = 'Next stop';
      flapping = false;
      markFound('travel');
    });
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
    { c: 'MUSIC', q: 'Which film won the first Academy Award for Best Picture?', a: ['Wings', 'Sunrise', 'The Jazz Singer', 'Metropolis'], k: 0, n: 'Wings, at the 1929 ceremony.' }
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
