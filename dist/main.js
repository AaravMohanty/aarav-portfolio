(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const intro = document.querySelector('.globe-intro');
  const canvas = document.querySelector('.globe-canvas');
  const enterButton = document.querySelector('.globe-enter');

  if (intro && canvas) {
    const context = canvas.getContext('2d');
    const locationItems = [...intro.querySelectorAll('.globe-locations li')];
    const locations = [
      { group: 'now', lat: 40.4259, lon: -86.9081, label: 'WEST LAFAYETTE / NOW', featured: true },
      { group: 'roots', lat: 38.8462, lon: -77.3064, label: 'VIRGINIA / HOME', featured: true },
      { group: 'roots', lat: 20.5937, lon: 78.9629, label: 'INDIA', featured: true },
      { group: 'roots', lat: 4.2105, lon: 101.9758, label: 'MALAYSIA' },
      { group: 'world', lat: 3.2028, lon: 73.2207, label: 'MALDIVES', featured: true },
      { group: 'world', lat: 9.7489, lon: -83.7534, label: 'COSTA RICA' },
      { group: 'world', lat: -9.19, lon: -75.0152, label: 'PERU', featured: true },
      { group: 'world', lat: 56.1304, lon: -106.3468, label: 'CANADA' },
      { group: 'world', lat: 19.8968, lon: -155.5828, label: 'HAWAII' },
      { group: 'world', lat: 64.2008, lon: -149.4937, label: 'ALASKA' },
      { group: 'world', lat: 18.1096, lon: -77.2975, label: 'JAMAICA' },
      { group: 'world', lat: 25.0343, lon: -77.3963, label: 'BAHAMAS' },
      { group: 'world', lat: 46.2276, lon: 2.2137, label: 'FRANCE' },
      { group: 'world', lat: 40.4637, lon: -3.7492, label: 'SPAIN' },
      { group: 'world', lat: 39.3999, lon: -8.2245, label: 'PORTUGAL' },
      { group: 'world', lat: 46.8182, lon: 8.2275, label: 'SWITZERLAND' },
      { group: 'world', lat: 41.8719, lon: 12.5674, label: 'ITALY', featured: true },
      { group: 'world', lat: 38.9637, lon: 35.2433, label: 'TURKEY' },
      { group: 'world', lat: 39.0742, lon: 21.8243, label: 'GREECE' },
      { group: 'world', lat: 23.6345, lon: -102.5528, label: 'MEXICO' },
      { group: 'wild', lat: 41.2132, lon: -124.0046, label: 'REDWOODS' },
      { group: 'wild', lat: 44.6, lon: -124.1, label: 'OREGON COAST' },
      { group: 'wild', lat: 46.8523, lon: -121.7603, label: 'MT. RAINIER', featured: true },
      { group: 'wild', lat: 47.8021, lon: -123.6044, label: 'OLYMPIC' },
      { group: 'wild', lat: 44.428, lon: -110.5885, label: 'YELLOWSTONE' },
      { group: 'wild', lat: 37.8651, lon: -119.5383, label: 'YOSEMITE', featured: true },
      { group: 'wild', lat: 37.2982, lon: -113.0263, label: 'ZION' },
      { group: 'wild', lat: 36.0544, lon: -112.1401, label: 'GRAND CANYON' },
      { group: 'wild', lat: 48.7596, lon: -113.787, label: 'GLACIER' },
      { group: 'wild', lat: 44.3386, lon: -68.2733, label: 'ACADIA' },
      { group: 'wild', lat: 40.3428, lon: -105.6836, label: 'ROCKY MOUNTAIN' },
      { group: 'wild', lat: 35.6118, lon: -83.4895, label: 'GREAT SMOKY MOUNTAINS' },
      { group: 'wild', lat: 25.2866, lon: -80.8987, label: 'EVERGLADES' },
      { group: 'wild', lat: 33.8734, lon: -115.901, label: 'JOSHUA TREE' }
    ];
    let countries = [];
    let width = 0;
    let height = 0;
    let radius = 0;
    let centerX = 0;
    let centerY = 0;
    let centerLon = -77;
    let targetLon = -77;
    let pointerDown = false;
    let pointerX = 0;
    let dragged = false;
    let finished = false;
    const startedAt = performance.now();

    fetch('/world.geo.json')
      .then((response) => response.json())
      .then((data) => { countries = data.features || []; })
      .catch(() => { countries = []; });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      radius = Math.min(width < 720 ? width * .43 : width * .285, height * .42);
      centerX = width < 720 ? width * .5 : width * .54;
      centerY = height * .48;
    };

    const project = (lon, lat) => {
      const lambda = (lon - centerLon) * Math.PI / 180;
      const phi = lat * Math.PI / 180;
      const cosPhi = Math.cos(phi);
      return {
        x: centerX + radius * cosPhi * Math.sin(lambda),
        y: centerY - radius * Math.sin(phi),
        z: cosPhi * Math.cos(lambda)
      };
    };

    const strokeCoordinates = (coordinates) => {
      context.beginPath();
      let drawing = false;
      let previous = null;
      coordinates.forEach(([lon, lat]) => {
        const point = project(lon, lat);
        const jump = previous && Math.hypot(point.x - previous.x, point.y - previous.y) > radius * .32;
        if (point.z > .025 && !jump) {
          if (!drawing) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
          drawing = true;
        } else {
          drawing = false;
        }
        previous = point;
      });
      context.stroke();
    };

    const drawGraticule = () => {
      context.save();
      context.strokeStyle = 'rgba(233, 225, 211, .09)';
      context.lineWidth = .75;
      for (let lat = -60; lat <= 60; lat += 30) {
        const line = [];
        for (let lon = -180; lon <= 180; lon += 3) line.push([lon, lat]);
        strokeCoordinates(line);
      }
      for (let lon = -180; lon < 180; lon += 30) {
        const line = [];
        for (let lat = -90; lat <= 90; lat += 3) line.push([lon, lat]);
        strokeCoordinates(line);
      }
      context.restore();
    };

    const drawLand = () => {
      context.save();
      context.strokeStyle = 'rgba(217, 169, 112, .72)';
      context.lineWidth = width < 700 ? .65 : .85;
      countries.forEach(({ geometry }) => {
        if (!geometry) return;
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        polygons.forEach((polygon) => polygon.forEach(strokeCoordinates));
      });
      context.restore();
    };

    const drawArc = (from, to, alpha) => {
      const a = project(from.lon, from.lat);
      const b = project(to.lon, to.lat);
      if (a.z < .05 || b.z < .05) return;
      const midpointX = (a.x + b.x) / 2;
      const midpointY = (a.y + b.y) / 2 - Math.min(85, Math.hypot(b.x - a.x, b.y - a.y) * .28);
      context.save();
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.quadraticCurveTo(midpointX, midpointY, b.x, b.y);
      context.strokeStyle = `rgba(224, 181, 125, ${alpha})`;
      context.lineWidth = 1;
      context.setLineDash([3, 7]);
      context.stroke();
      context.restore();
    };

    const drawMarker = (location, emphasis = false, time = 0) => {
      const point = project(location.lon, location.lat);
      if (point.z < .08) return;
      const pulse = 5 + Math.sin(time / 320) * 2;
      context.save();
      context.globalAlpha = Math.min(1, (point.z + .1) * 1.15);
      context.beginPath();
      context.arc(point.x, point.y, emphasis ? pulse + 4 : pulse, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(209, 154, 97, .32)';
      context.stroke();
      context.beginPath();
      context.arc(point.x, point.y, emphasis ? 3.4 : 2.3, 0, Math.PI * 2);
      context.fillStyle = '#d19a61';
      context.fill();
      if (emphasis && width > 680) {
        context.fillStyle = 'rgba(238, 236, 231, .76)';
        context.font = '10px Arial, sans-serif';
        context.letterSpacing = '1px';
        context.fillText(location.label, point.x + 12, point.y - 8);
      }
      context.restore();
    };

    const draw = (time) => {
      const elapsed = time - startedAt;
      if (!dragged && !reduceMotion) {
        if (elapsed < 1100) targetLon = -87;
        else if (elapsed < 2250) targetLon = 78;
        else if (elapsed < 3500) targetLon = -16;
        else targetLon = -115;
      }
      centerLon += (targetLon - centerLon) * (reduceMotion ? 1 : .025);
      context.clearRect(0, 0, width, height);

      const glow = context.createRadialGradient(centerX - radius * .28, centerY - radius * .3, radius * .05, centerX, centerY, radius * 1.18);
      glow.addColorStop(0, 'rgba(65, 61, 53, .98)');
      glow.addColorStop(.48, 'rgba(28, 28, 25, .98)');
      glow.addColorStop(.83, 'rgba(10, 10, 9, 1)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(centerX, centerY, radius * 1.18, 0, Math.PI * 2);
      context.fill();

      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.clip();
      const shade = context.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      shade.addColorStop(0, '#11110f');
      shade.addColorStop(.42, '#282720');
      shade.addColorStop(1, '#090908');
      context.fillStyle = shade;
      context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      drawGraticule();
      drawLand();
      context.restore();

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(229, 188, 134, .38)';
      context.lineWidth = 1.2;
      context.stroke();

      const activeIndex = elapsed < 1100 ? 0 : elapsed < 2250 ? 1 : elapsed < 3500 ? 2 : 3;
      const activeGroup = ['now', 'roots', 'world', 'wild'][activeIndex];
      const virginia = locations.find((location) => location.label.startsWith('VIRGINIA'));
      const purdue = locations.find((location) => location.group === 'now');
      const india = locations.find((location) => location.label === 'INDIA');
      const italy = locations.find((location) => location.label === 'ITALY');
      drawArc(virginia, purdue, .5);
      drawArc(virginia, india, .24);
      drawArc(virginia, italy, .24);
      locations.forEach((location) => drawMarker(location, location.group === activeGroup && location.featured, time));

      locationItems.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
      if (!finished) requestAnimationFrame(draw);
    };

    const finishIntro = () => {
      if (finished) return;
      finished = true;
      intro.classList.add('is-leaving');
      document.body.classList.remove('globe-pending');
      document.body.classList.add('globe-finished');
      window.setTimeout(() => {
        intro.hidden = true;
        document.querySelectorAll('.reveal').forEach((item) => {
          if (item.getBoundingClientRect().top < window.innerHeight * .95) item.classList.add('is-in');
        });
      }, 650);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('pointerdown', (event) => {
      pointerDown = true;
      pointerX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!pointerDown) return;
      dragged = true;
      targetLon -= (event.clientX - pointerX) * .35;
      pointerX = event.clientX;
    });
    canvas.addEventListener('pointerup', () => { pointerDown = false; });
    canvas.addEventListener('click', () => {
      if (!dragged) finishIntro();
    });
    enterButton?.addEventListener('click', finishIntro);
    window.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) > 18) finishIntro();
    }, { passive: true, once: true });
    window.addEventListener('keydown', (event) => {
      if (['Enter', 'Escape', ' ', 'ArrowDown'].includes(event.key)) finishIntro();
    });
    window.setTimeout(() => enterButton?.classList.add('is-ready'), reduceMotion ? 0 : 180);
    if (!reduceMotion) window.setTimeout(finishIntro, 5000);
    requestAnimationFrame(draw);
  } else {
    document.body.classList.remove('globe-pending');
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
      const portraitWidth = Math.min(260, window.innerWidth * .18);
      const x = Math.min(window.innerWidth - portraitWidth - 18, event.clientX + 22);
      const y = Math.min(window.innerHeight - portraitWidth * 1.25 - 18, event.clientY - portraitWidth * .55);
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
  window.setInterval(updateTime, 30000);

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
