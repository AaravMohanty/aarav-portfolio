(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const found = new Set();
  const meterDots = [...document.querySelectorAll('.discovery-meter i')];
  const meterCount = document.querySelector('.discovery-meter strong');
  const markFound = (key) => {
    found.add(key);
    meterDots.forEach((dot, index) => dot.classList.toggle('is-found', index < found.size));
    if (meterCount) meterCount.textContent = `${found.size} / 5`;
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
  let kicks = 0;
  const resetKicks = () => {
    kicks = 0;
    if (kickScore) kickScore.textContent = '0';
    if (kickButton) {
      kickButton.style.setProperty('--ball-x', '0px');
      kickButton.style.setProperty('--ball-y', '0px');
      kickButton.classList.remove('is-kicked', 'is-winner');
    }
  };
  if (kickButton) {
    kickButton.addEventListener('click', () => {
      kicks += 1;
      kickScore.textContent = String(kicks);
      const x = Math.round((Math.random() - .5) * 190);
      const y = -65 - Math.round(Math.random() * 120);
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

  const stops = ['Turkey', 'Peru', 'Olympic', 'Costa Rica', 'The Redwoods', 'Portugal', 'Mt. Rainier', 'Greece', 'Alaska', 'Switzerland', 'Japan', 'New Zealand'];
  const departure = document.querySelector('.departure-board strong');
  const gate = document.querySelector('.departure-board span');
  document.querySelector('.travel-spin')?.addEventListener('click', () => {
    let ticks = 0;
    const spin = window.setInterval(() => {
      departure.textContent = stops[Math.floor(Math.random() * stops.length)];
      gate.textContent = `Gate ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${1 + Math.floor(Math.random() * 24)}`;
      ticks += 1;
      if (ticks > 9) {
        window.clearInterval(spin);
        markFound('travel');
      }
    }, reduced ? 1 : 65);
  });

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
