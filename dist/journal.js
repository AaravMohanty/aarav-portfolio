(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const found = new Set();
  const meterDots = [...document.querySelectorAll('.discovery-meter i')];
  const meterCount = document.querySelector('.discovery-meter strong');
  const markFound = (key) => {
    found.add(key);
    meterDots.forEach((dot, index) => dot.classList.toggle('is-found', index < found.size));
    if (meterCount) meterCount.textContent = `${found.size} / 3`;
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
    trail: { image:'/photos/friends-hike.png', alt:'Aarav hiking with friends', label:'TRAIL DAY', title:'The best plans start early.', copy:'Pick a trail, bring friends, and stay out until the light changes.', coordinate:'38°N / somewhere outside' },
    match: { image:'/photos/soccer.png', alt:'Aarav playing in a soccer match', label:'MATCH DAY', title:'I will always make time for a game.', copy:'Soccer is the constant. Tennis, golf, and pickleball are making their way in.', coordinate:'90 minutes / no shortcuts' },
    run: { image:'/photos/creek.png', alt:'A creek running through mossy rocks', label:'RUN DAY', title:'Pick a direction and go.', copy:'The route matters less than getting outside and moving for a while.', coordinate:'pace optional / distance earned' },
    new: { image:'/photos/multnomah-falls.png', alt:'Multnomah Falls in Oregon', label:'OPEN DAY', title:'Leave room for a new plan.', copy:'A new park, a new sport, or a place I have never seen before.', coordinate:'next stop / undecided' }
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
