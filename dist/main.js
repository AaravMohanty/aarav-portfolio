(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const counter = document.querySelector('.entry-count');
  if (counter && !reduceMotion) {
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / 850);
      counter.textContent = String(Math.round(progress * 100)).padStart(2, '0');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((item) => item.classList.add('is-in'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 80, 240)}ms`;
      observer.observe(item);
    });
  }

  const root = document.documentElement;
  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--mx', `${event.clientX}px`);
    root.style.setProperty('--my', `${event.clientY}px`);
  }, { passive: true });

  const portrait = document.querySelector('.portrait-peek');
  const heroName = document.querySelector('.hero-name');
  if (portrait && heroName && !reduceMotion) {
    const movePortrait = (event) => {
      const width = Math.min(260, window.innerWidth * .18);
      const x = Math.min(window.innerWidth - width - 18, event.clientX + 22);
      const y = Math.min(window.innerHeight - width * 1.25 - 18, event.clientY - width * .55);
      portrait.style.setProperty('--px', `${Math.max(18, x)}px`);
      portrait.style.setProperty('--py', `${Math.max(18, y)}px`);
    };
    heroName.addEventListener('pointerenter', (event) => { movePortrait(event); portrait.classList.add('is-visible'); });
    heroName.addEventListener('pointermove', movePortrait);
    heroName.addEventListener('pointerleave', () => portrait.classList.remove('is-visible'));
    heroName.addEventListener('focus', () => {
      portrait.style.setProperty('--px', `${Math.min(window.innerWidth - 290, window.innerWidth * .62)}px`);
      portrait.style.setProperty('--py', `${Math.min(window.innerHeight - 380, window.innerHeight * .28)}px`);
      portrait.classList.add('is-visible');
    });
    heroName.addEventListener('blur', () => portrait.classList.remove('is-visible'));
  }

  const timeNodes = document.querySelectorAll('.local-time');
  const updateTime = () => {
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Indiana/Indianapolis', hour: 'numeric', minute: '2-digit'
    }).format(new Date());
    timeNodes.forEach((node) => { node.textContent = `Indianapolis · ${time}`; });
  };
  updateTime();
  setInterval(updateTime, 30000);

  const stage = document.querySelector('.project-stage');
  const rows = document.querySelectorAll('.project-row');
  if (stage && rows.length) {
    const stageIndex = stage.querySelector('.stage-index');
    const stageName = stage.querySelector('.stage-name');
    const stageMeta = stage.querySelector('.stage-meta');
    const setStage = (row) => {
      if (stageName.textContent === row.dataset.name) return;
      stage.classList.add('is-changing');
      window.setTimeout(() => {
        stageIndex.textContent = row.dataset.index;
        stageName.textContent = row.dataset.name;
        stageMeta.textContent = row.dataset.meta;
        stage.classList.remove('is-changing');
      }, 150);
    };
    rows.forEach((row) => {
      row.addEventListener('pointerenter', () => setStage(row));
      row.querySelector('summary').addEventListener('focus', () => setStage(row));
      row.addEventListener('toggle', () => {
        if (row.open) {
          setStage(row);
          rows.forEach((other) => { if (other !== row) other.open = false; });
        }
      });
    });
  }
})();
