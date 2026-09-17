(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

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
      if (shelfCurrent) shelfCurrent.textContent = book.dataset.title;
    };
    book.addEventListener('pointerenter', showTitle);
    book.addEventListener('focus', showTitle);
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

  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const photos = [
      { src: '/photos/hike.jpg', alt: 'Aarav hiking on a green coastal trail at sunset' },
      { src: '/photos/coast.jpg', alt: 'Tree-covered sea stacks reflected in blue water' }
    ];
    let index = 0;
    let opener;
    const image = lightbox.querySelector('img');
    const count = lightbox.querySelector('.photo-count');
    const show = (next) => {
      index = (next + photos.length) % photos.length;
      image.src = photos[index].src;
      image.alt = photos[index].alt;
      count.textContent = `${index + 1} / ${photos.length}`;
    };
    document.querySelectorAll('.photo-open').forEach((button) => {
      button.addEventListener('click', () => {
        opener = button;
        show(Number(button.dataset.photo));
        lightbox.showModal();
        document.body.style.overflow = 'hidden';
      });
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
    lightbox.querySelector('.photo-prev').addEventListener('click', () => show(index - 1));
    lightbox.querySelector('.photo-next').addEventListener('click', () => show(index + 1));
    lightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
    });
    lightbox.addEventListener('click', (event) => {
      if (event.target !== lightbox) return;
      const bounds = lightbox.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
    });
    lightbox.addEventListener('close', () => {
      document.body.style.overflow = '';
      opener?.focus();
    });
  }

  const notes = [...document.querySelectorAll('.notes-list details')];
  notes.forEach((note) => {
    note.addEventListener('toggle', () => {
      if (note.open) notes.forEach((other) => { if (other !== note) other.open = false; });
    });
  });

  window.addEventListener('load', () => {
    if (!window.location.hash) return;
    window.setTimeout(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' });
    }, 120);
  });
})();
