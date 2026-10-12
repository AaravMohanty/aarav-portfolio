(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const found = new Set();
  const meterDots = [...document.querySelectorAll('.discovery-meter i')];
  const meterCount = document.querySelector('.discovery-meter strong');
  const markFound = (key) => {
    found.add(key);
    meterDots.forEach((dot, index) => dot.classList.toggle('is-found', index < found.size));
    if (meterCount) meterCount.textContent = `${found.size} / 6`;
  };

  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--mx', `${event.clientX}px`);
    root.style.setProperty('--my', `${event.clientY}px`);
  }, { passive: true });

  const turntable = document.querySelector('.turntable-card');
  const turntableToggle = document.querySelector('.turntable-toggle');
  const playState = document.querySelector('.play-state');
  const recordAudio = document.querySelector('.record-audio');
  if (turntable && turntableToggle && playState && recordAudio) {
    const setPlaying = (playing) => {
      turntable.classList.toggle('is-paused', !playing);
      turntableToggle.setAttribute('aria-pressed', String(playing));
      turntableToggle.setAttribute('aria-label', playing ? 'Pause the record' : 'Play the record');
      playState.textContent = playing ? 'Pause record' : 'Play record';
    };
    const toggleRecord = async () => {
      if (!recordAudio.paused) {
        recordAudio.pause();
        setPlaying(false);
        return;
      }
      try {
        await recordAudio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        playState.textContent = 'Preview unavailable';
      }
    };
    turntableToggle.addEventListener('click', toggleRecord);
    playState.addEventListener('click', toggleRecord);
    turntableToggle.addEventListener('click', () => markFound('record'));
    recordAudio.addEventListener('ended', () => {
      recordAudio.currentTime = 0;
      setPlaying(false);
    });
    recordAudio.addEventListener('error', () => {
      setPlaying(false);
      playState.textContent = 'Preview unavailable';
    });
  }

  const shelfCurrent = document.querySelector('.shelf-current');
  document.querySelectorAll('.book').forEach((book) => {
    const showTitle = () => {
      if (shelfCurrent) shelfCurrent.textContent = `${book.dataset.title} · ${book.dataset.topic}`;
    };
    book.addEventListener('pointerenter', showTitle);
    book.addEventListener('focus', showTitle);
    book.addEventListener('click', () => markFound('book'));
  });

  const plans = {
    trail: { image:'/photos/friends-hike.png', alt:'Aarav hiking with friends', label:'TRAIL DAY', title:'Early start, bad signal.', copy:'Usually better with friends.', coordinate:'phone on 10%' },
    match: { image:'/photos/soccer.png', alt:'Aarav playing in a soccer match', label:'MATCH DAY', title:'One more game.', copy:'Soccer is the constant. Tennis is catching up.', coordinate:'next goal wins' },
    run: { image:'/photos/creek.png', alt:'A creek running through mossy rocks', label:'RUN DAY', title:'No route planned.', copy:'Pick a direction and figure out the way back later.', coordinate:'watch says keep going' },
    new: { image:'/photos/multnomah-falls.png', alt:'Multnomah Falls in Oregon', label:'OPEN DAY', title:'Try it once.', copy:'Golf and pickleball got onto the list this way.', coordinate:'plans pending' }
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
        image.src = plan.image; image.alt = plan.alt;
        planStage.querySelector('.plan-label').textContent = plan.label;
        planStage.querySelector('.plan-title').textContent = plan.title;
        planStage.querySelector('.plan-copy').textContent = plan.copy;
        planStage.querySelector('.plan-coordinate').textContent = plan.coordinate;
        planStage.classList.remove('is-changing');
      }, reduced ? 0 : 220);
      markFound('plan');
    });
  });

  const kickButton = document.querySelector('.soccer-ball');
  const kickScore = document.querySelector('.kick-score');
  const kickTime = document.querySelector('.kick-time');
  const kickBest = document.querySelector('.kick-best');
  const kickMessage = document.querySelector('.kick-message');
  let kicks = 0;
  let kickStarted = 0;
  let kickFrame = 0;
  let kickRunning = false;
  let best = 0;
  try { best = Number(localStorage.getItem('aarav-keepy-best')) || 0; } catch {}
  if (kickBest) kickBest.textContent = String(best);

  const finishKicks = () => {
    kickRunning = false;
    window.cancelAnimationFrame(kickFrame);
    if (kickButton) kickButton.disabled = true;
    if (kicks > best) {
      best = kicks;
      if (kickBest) kickBest.textContent = String(best);
      try { localStorage.setItem('aarav-keepy-best', String(best)); } catch {}
    }
    if (kickMessage) kickMessage.textContent = kicks >= 23 ? 'Twenty-three. Shirt number matched.' : `${kicks} touches. Go again.`;
  };
  const runKickClock = (now) => {
    const left = Math.max(0, 15 - (now - kickStarted) / 1000);
    if (kickTime) kickTime.textContent = left.toFixed(1);
    if (left <= 0) return finishKicks();
    kickFrame = window.requestAnimationFrame(runKickClock);
  };
  const resetKicks = () => {
    kicks = 0;
    kickRunning = false;
    window.cancelAnimationFrame(kickFrame);
    if (kickScore) kickScore.textContent = '0';
    if (kickTime) kickTime.textContent = '15.0';
    if (kickMessage) kickMessage.textContent = 'First touch starts the clock.';
    if (kickButton) {
      kickButton.disabled = false;
      kickButton.style.setProperty('--ball-x', '0px');
      kickButton.style.setProperty('--ball-y', '0px');
      kickButton.classList.remove('is-kicked', 'is-winner');
    }
  };
  if (kickButton) {
    kickButton.addEventListener('click', () => {
      if (!kickRunning) {
        kickRunning = true;
        kickStarted = performance.now();
        kickFrame = window.requestAnimationFrame(runKickClock);
        if (kickMessage) kickMessage.textContent = 'Keep it moving.';
      }
      kicks += 1;
      kickScore.textContent = String(kicks);
      const x = Math.round((Math.random() - .5) * 250);
      const y = -75 - Math.round(Math.random() * 125);
      kickButton.style.setProperty('--ball-x', `${x}px`);
      kickButton.style.setProperty('--ball-y', `${y}px`);
      kickButton.classList.remove('is-kicked');
      void kickButton.offsetWidth;
      kickButton.classList.add('is-kicked');
      if (kicks >= 23) kickButton.classList.add('is-winner');
      markFound('keepy');
    });
    document.querySelector('.kick-reset')?.addEventListener('click', resetKicks);
  }

  const stops = [
    { name:'Turkey', image:'/photos/coast.jpg', stamp:'BEEN' },
    { name:'Peru', image:'/photos/hike.jpg', stamp:'BEEN' },
    { name:'Olympic', image:'/photos/creek.png', stamp:'BEEN' },
    { name:'Costa Rica', image:'/photos/creek.png', stamp:'BEEN' },
    { name:'The Redwoods', image:'/photos/hike.jpg', stamp:'BEEN' },
    { name:'Portugal', image:'/photos/coast.jpg', stamp:'BEEN' },
    { name:'Mt. Rainier', image:'/photos/friends-hike.png', stamp:'BEEN' },
    { name:'Greece', image:'/photos/coast.jpg', stamp:'BEEN' },
    { name:'Alaska', image:'/photos/hike.jpg', stamp:'BEEN' },
    { name:'Switzerland', image:'/photos/friends-hike.png', stamp:'BEEN' },
    { name:'Japan', image:'/photos/multnomah-falls.png', stamp:'NEXT' },
    { name:'New Zealand', image:'/photos/coast.jpg', stamp:'NEXT' }
  ];
  const departure = document.querySelector('.departure-board strong');
  const gate = document.querySelector('.departure-board span');
  const travelImage = document.querySelector('.travel-visual img');
  const travelStamp = document.querySelector('.travel-stamp');
  let travelSpin = 0;
  document.querySelector('.travel-spin')?.addEventListener('click', () => {
    window.clearInterval(travelSpin);
    let ticks = 0;
    travelSpin = window.setInterval(() => {
      const stop = stops[Math.floor(Math.random() * stops.length)];
      departure.textContent = stop.name;
      gate.textContent = `Gate ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${1 + Math.floor(Math.random() * 24)}`;
      travelImage.src = stop.image;
      travelImage.alt = `Travel photograph paired with ${stop.name}`;
      travelStamp.textContent = stop.stamp;
      ticks += 1;
      if (ticks > 9) {
        window.clearInterval(travelSpin);
        markFound('travel');
      }
    }, reduced ? 1 : 70);
  });

  const trivia = [
    { category:'GEOGRAPHY', q:'Which country has the most time zones?', a:['Russia','United States','France','Australia'], correct:2, note:'France has 12 because of its overseas territories.' },
    { category:'HISTORY', q:'The Peace of Westphalia ended which conflict?', a:['Seven Years’ War','Thirty Years’ War','War of Spanish Succession','Crimean War'], correct:1, note:'The treaties ended the Thirty Years’ War in 1648.' },
    { category:'CULTURE', q:'Kintsugi is the Japanese practice of repairing pottery with what?', a:['Silk thread','Gold lacquer','Bamboo pins','Rice paper'], correct:1, note:'The repair is shown instead of hidden.' },
    { category:'SPORT', q:'Which country has played in every men’s FIFA World Cup?', a:['Germany','Argentina','Italy','Brazil'], correct:3, note:'Brazil is the only team with a perfect attendance record.' },
    { category:'HISTORY', q:'Who ruled the Mali Empire during its famous 1324 pilgrimage?', a:['Sundiata Keita','Mansa Musa','Askia Muhammad','Sunni Ali'], correct:1, note:'Mansa Musa’s journey made Mali famous far beyond West Africa.' },
    { category:'GEOGRAPHY', q:'Which river passes through or borders the most countries?', a:['Nile','Rhine','Danube','Amazon'], correct:2, note:'The Danube touches ten countries.' },
    { category:'CULTURE', q:'The Epic of Gilgamesh was mainly preserved in which language?', a:['Sumerian','Akkadian','Aramaic','Old Persian'], correct:1, note:'The standard version survives on Akkadian tablets.' },
    { category:'SPORT', q:'Why is the Tour de France leader’s jersey yellow?', a:['French royal colors','A sponsor’s logo','The organizer’s newspaper paper color','Visibility in fog'], correct:2, note:'L’Auto, the race organizer’s newspaper, was printed on yellow paper.' },
    { category:'HISTORY', q:'Who captured Constantinople in 1453?', a:['Suleiman I','Bayezid I','Mehmed II','Selim I'], correct:2, note:'Mehmed II was 21 when the city fell.' },
    { category:'GEOGRAPHY', q:'Which national capital sits highest above sea level?', a:['Quito','Kathmandu','Bogotá','La Paz'], correct:3, note:'La Paz sits around 3,650 meters above sea level.' },
    { category:'CULTURE', q:'Which city is home to the university often called the world’s oldest still operating?', a:['Bologna','Fez','Oxford','Cairo'], correct:1, note:'Al Quaraouiyine in Fez dates to 859.' },
    { category:'SPORT', q:'Who designed the five-ring Olympic symbol?', a:['Jules Rimet','Pierre de Coubertin','Henri Delaunay','Avery Brundage'], correct:1, note:'Pierre de Coubertin drew it in 1913.' }
  ];
  const triviaCategory = document.querySelector('.trivia-category');
  const triviaQuestion = document.querySelector('.trivia-question');
  const triviaAnswers = document.querySelector('.trivia-answers');
  const triviaNote = document.querySelector('.trivia-note');
  const triviaScore = document.querySelector('.trivia-score');
  const triviaNext = document.querySelector('.trivia-next');
  let triviaOrder = [...trivia].sort(() => Math.random() - .5);
  let triviaIndex = 0;
  let correctAnswers = 0;
  const showTrivia = () => {
    if (triviaIndex >= 5) {
      triviaCategory.textContent = 'ROUND OVER';
      triviaQuestion.textContent = `${correctAnswers} out of 5.`;
      triviaAnswers.replaceChildren();
      triviaNote.textContent = correctAnswers >= 4 ? 'Okay, that was strong.' : 'A rematch seems fair.';
      triviaNext.textContent = 'Play again';
      triviaNext.hidden = false;
      return;
    }
    const item = triviaOrder[triviaIndex];
    triviaCategory.textContent = `${item.category} · ${triviaIndex + 1}/5`;
    triviaQuestion.textContent = item.q;
    triviaNote.textContent = 'Pick one.';
    triviaNext.hidden = true;
    triviaAnswers.replaceChildren(...item.a.map((answer, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = answer;
      button.addEventListener('click', () => {
        if (triviaAnswers.classList.contains('is-answered')) return;
        triviaAnswers.classList.add('is-answered');
        [...triviaAnswers.children].forEach((choice, choiceIndex) => {
          choice.classList.toggle('is-correct', choiceIndex === item.correct);
          choice.classList.toggle('is-wrong', choiceIndex === index && index !== item.correct);
        });
        if (index === item.correct) correctAnswers += 1;
        triviaScore.textContent = String(correctAnswers);
        triviaNote.textContent = item.note;
        triviaNext.hidden = false;
        markFound('trivia');
      });
      return button;
    }));
    triviaAnswers.classList.remove('is-answered');
  };
  triviaNext?.addEventListener('click', () => {
    if (triviaIndex >= 5) {
      triviaOrder = [...trivia].sort(() => Math.random() - .5);
      triviaIndex = 0;
      correctAnswers = 0;
      triviaScore.textContent = '0';
    } else {
      triviaIndex += 1;
    }
    showTrivia();
  });
  if (triviaQuestion) showTrivia();

  const sections = document.querySelectorAll('.journal-section');
  if (reduced || !('IntersectionObserver' in window)) {
    sections.forEach((section) => section.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
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
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
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
