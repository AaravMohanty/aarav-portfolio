(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const intro = document.querySelector('.globe-intro');
  const canvas = document.querySelector('.globe-canvas');
  const enterButton = document.querySelector('.globe-enter');

  if (intro && canvas) {
    const context = canvas.getContext('2d');
    const locationItems = [...intro.querySelectorAll('.globe-locations li')];
    const placeCard = intro.querySelector('.globe-place-card');
    const placeImage = placeCard?.querySelector('img');
    const placeTitle = placeCard?.querySelector('.place-card-title');
    const placeCredit = placeCard?.querySelector('.place-card-credit');
    const placeClose = placeCard?.querySelector('.place-card-close');
    const locations = [
      { group: 'now', lat: 40.4259, lon: -86.9081, label: 'WEST LAFAYETTE / NOW', featured: true },
      { group: 'world', lat: 38.8462, lon: -77.3064, label: 'VIRGINIA / HOME', featured: true },
      { group: 'world', lat: 20.5937, lon: 78.9629, label: 'INDIA', featured: true, image: '/places/india.jpg', alt: 'The Taj Mahal in Agra, India', credit: 'Jakub Michankow · CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Taj_Mahal,_Agra,_India1.jpg' },
      { group: 'world', lat: 4.2105, lon: 101.9758, label: 'MALAYSIA', image: '/places/malaysia.jpg', alt: 'The Petronas Towers at night in Kuala Lumpur, Malaysia', credit: 'Dcubillas · CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Petronas_Towers_at_Night_-_from_the_base_upwards.jpg' },
      { group: 'world', lat: 3.2028, lon: 73.2207, label: 'MALDIVES', featured: true, image: '/places/maldives.jpg', alt: 'A small island and coral reef in the Maldives', credit: 'Ondřej Havelka · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Aerial_shot_of_a_small_island_on_a_coral_reef_in_the_Maldives.jpg' },
      { group: 'world', lat: 9.7489, lon: -83.7534, label: 'COSTA RICA', image: '/places/costa-rica.jpg', alt: 'La Paz waterfall in Costa Rica', credit: 'Matthias Bethke · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:2006-08-04_Cascada_La_Paz.jpg' },
      { group: 'world', lat: -9.19, lon: -75.0152, label: 'PERU', featured: true, image: '/places/peru.jpg', alt: 'Machu Picchu in Peru', credit: 'Diego Delso · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Machu_Picchu,_Per%C3%BA,_2015-07-30,_DD_47.JPG' },
      { group: 'world', lat: 56.1304, lon: -106.3468, label: 'CANADA', image: '/places/canada.jpg', alt: 'Moraine Lake in Banff National Park, Canada', credit: 'Chensiyuan · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:1_moraine_lake_pano_2019.jpg' },
      { group: 'world', lat: 19.8968, lon: -155.5828, label: 'HAWAII', image: '/places/hawaii.jpg', alt: 'The Na Pali Coast on Kauai, Hawaii', credit: 'Christian Joudrey · CC0', source: 'https://commons.wikimedia.org/wiki/File:Na_Pali_Coast_(Unsplash).jpg' },
      { group: 'world', lat: 64.2008, lon: -149.4937, label: 'ALASKA', image: '/places/alaska.jpg', alt: 'Denali National Park in Alaska', credit: 'Diego Delso · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Parque_nacional_y_reserva_Denali,_Alaska,_Estados_Unidos,_2017-08-30,_DD_72.jpg' },
      { group: 'world', lat: 18.1096, lon: -77.2975, label: 'JAMAICA' },
      { group: 'world', lat: 25.0343, lon: -77.3963, label: 'BAHAMAS' },
      { group: 'world', lat: 46.2276, lon: 2.2137, label: 'FRANCE', image: '/places/france.jpg', alt: 'The Eiffel Tower in Paris, France', credit: 'Benh LIEU SONG · Public domain', source: 'https://commons.wikimedia.org/wiki/File:Tour_Eiffel_Wikimedia_Commons.jpg' },
      { group: 'world', lat: 40.4637, lon: -3.7492, label: 'SPAIN', image: '/places/spain.jpg', alt: 'The Sagrada Família in Barcelona, Spain', credit: 'Alvesgaspar · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Sagrada_Familia_March_2015-10a.jpg' },
      { group: 'world', lat: 39.3999, lon: -8.2245, label: 'PORTUGAL' },
      { group: 'world', lat: 46.8182, lon: 8.2275, label: 'SWITZERLAND', image: '/places/switzerland.jpg', alt: 'The Matterhorn reflected in Stellisee, Switzerland', credit: 'Giles Laurent · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:008_Milky_way_aligned_with_the_Matterhorn_reflecting_in_Stellisee_Photo_by_Giles_Laurent.jpg' },
      { group: 'world', lat: 41.8719, lon: 12.5674, label: 'ITALY', featured: true, image: '/places/italy.jpg', alt: 'St. Angelo Bridge in Rome, Italy', credit: 'AngMoKio · CC BY-SA 2.5', source: 'https://commons.wikimedia.org/wiki/File:StAngelo_Bridge_Rome.jpg' },
      { group: 'world', lat: 38.9637, lon: 35.2433, label: 'TURKEY' },
      { group: 'world', lat: 39.0742, lon: 21.8243, label: 'GREECE', image: '/places/greece.jpg', alt: 'The blue domes of Oia in Santorini, Greece', credit: 'Giles Laurent · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:1000_Three_domes_of_Oia_in_Santorini_Photo_by_Giles_Laurent.jpg' },
      { group: 'world', lat: 23.6345, lon: -102.5528, label: 'MEXICO', image: '/places/mexico.jpg', alt: 'Chichén Itzá in Mexico', credit: 'Daniel Schwen · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Chichen_Itza_2.jpg' },
      { group: 'parks', lat: 41.2132, lon: -124.0046, label: 'REDWOODS', image: '/places/redwoods.jpg', alt: 'Fog among the trees in Redwood National Park', credit: 'Michael Schweppe · CC BY-SA 2.0', source: 'https://commons.wikimedia.org/wiki/File:Redwood_National_Park,_fog_in_the_forest.jpg' },
      { group: 'parks', lat: 44.6, lon: -124.1, label: 'OREGON COAST' },
      { group: 'parks', lat: 46.8523, lon: -121.7603, label: 'MT. RAINIER', featured: true, image: '/places/mt-rainier.jpg', alt: 'Mount Rainier behind the flowering meadows of Paradise Park', credit: 'Bob Collowan · CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Mount_Rainier_behind_the_flowering_meadows_of_Paradise_Park_(18_August_2012).jpg' },
      { group: 'parks', lat: 47.8021, lon: -123.6044, label: 'OLYMPIC' },
      { group: 'parks', lat: 44.428, lon: -110.5885, label: 'YELLOWSTONE' },
      { group: 'parks', lat: 37.8651, lon: -119.5383, label: 'YOSEMITE', featured: true },
      { group: 'parks', lat: 37.2982, lon: -113.0263, label: 'ZION' },
      { group: 'parks', lat: 36.0544, lon: -112.1401, label: 'GRAND CANYON' },
      { group: 'parks', lat: 48.7596, lon: -113.787, label: 'GLACIER' },
      { group: 'parks', lat: 44.3386, lon: -68.2733, label: 'ACADIA' },
      { group: 'parks', lat: 40.3428, lon: -105.6836, label: 'ROCKY MOUNTAIN' },
      { group: 'parks', lat: 35.6118, lon: -83.4895, label: 'GREAT SMOKY MOUNTAINS' },
      { group: 'parks', lat: 25.2866, lon: -80.8987, label: 'EVERGLADES' },
      { group: 'parks', lat: 33.8734, lon: -115.901, label: 'JOSHUA TREE' }
    ];
    let countries = [];
    let width = 0;
    let height = 0;
    let radius = 0;
    let centerX = 0;
    let centerY = 0;
    let centerLon = -77;
    let targetLon = -77;
    let centerLat = 22;
    let targetLat = 22;
    let pointerDown = false;
    let pointerX = 0;
    let pointerY = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerMoved = false;
    let dragged = false;
    let finished = false;
    let activeLocation = null;
    let hitTargets = [];
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
      if (width < 720) {
        radius = Math.min(width * .37, height * (height < 740 ? .2 : .25));
        centerX = width * .5;
        centerY = height * .52;
      } else {
        radius = Math.min(width * .235, height * .4);
        centerX = width * .7;
        centerY = height * .48;
      }
    };

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    const project = (lon, lat) => {
      const lambda = (lon - centerLon) * Math.PI / 180;
      const phi = lat * Math.PI / 180;
      const phi0 = centerLat * Math.PI / 180;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const cosPhi0 = Math.cos(phi0);
      const sinPhi0 = Math.sin(phi0);
      return {
        x: centerX + radius * cosPhi * Math.sin(lambda),
        y: centerY - radius * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * Math.cos(lambda)),
        z: sinPhi0 * sinPhi + cosPhi0 * cosPhi * Math.cos(lambda)
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
      const isSelected = activeLocation === location;
      if (location.image && (!activeLocation || isSelected)) hitTargets.push({ x: point.x, y: point.y, location });
      const pulse = 5 + Math.sin(time / 320) * 2;
      context.save();
      context.globalAlpha = Math.min(1, (point.z + .1) * 1.15) * (activeLocation && !isSelected ? .07 : 1);
      context.beginPath();
      context.arc(point.x, point.y, emphasis ? pulse + 4 : pulse, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(209, 154, 97, .32)';
      context.stroke();
      context.beginPath();
      context.arc(point.x, point.y, emphasis ? 3.4 : 2.3, 0, Math.PI * 2);
      context.fillStyle = '#d19a61';
      context.fill();
      if (location.image) {
        context.beginPath();
        context.arc(point.x, point.y, emphasis ? 10.5 : 8.5, 0, Math.PI * 2);
        context.strokeStyle = 'rgba(238, 236, 231, .72)';
        context.lineWidth = .8;
        context.stroke();
      }
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
        const sequence = [
          { lon: -87, lat: 28 },
          { lon: 78, lat: 16 },
          { lon: -76, lat: 18 },
          { lon: 12, lat: 38 },
          { lon: -121, lat: 42 }
        ];
        const scene = sequence[Math.floor((Math.max(0, elapsed) % 15000) / 3000)];
        targetLon = scene.lon;
        targetLat = scene.lat;
      }
      centerLon += (targetLon - centerLon) * (reduceMotion ? 1 : .025);
      centerLat += (targetLat - centerLat) * (reduceMotion ? 1 : .025);
      context.clearRect(0, 0, width, height);
      hitTargets = [];

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

      const sequenceIndex = Math.floor((Math.max(0, elapsed) % 15000) / 3000);
      const activeGroup = sequenceIndex === 0 ? 'now' : sequenceIndex === 4 ? 'parks' : 'world';
      const activeIndex = activeGroup === 'now' ? 0 : activeGroup === 'world' ? 1 : 2;
      const virginia = locations.find((location) => location.label.startsWith('VIRGINIA'));
      const purdue = locations.find((location) => location.group === 'now');
      const india = locations.find((location) => location.label === 'INDIA');
      const italy = locations.find((location) => location.label === 'ITALY');
      if (!activeLocation) {
        drawArc(virginia, purdue, .5);
        drawArc(virginia, india, .24);
        drawArc(virginia, italy, .24);
      }
      locations.forEach((location) => drawMarker(location, activeLocation === location || (location.group === activeGroup && location.featured), time));

      locationItems.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
      if (!finished) requestAnimationFrame(draw);
    };

    const openPlace = (location) => {
      if (!placeCard || !placeImage || !placeTitle || !placeCredit) return;
      activeLocation = location;
      dragged = true;
      targetLon = location.lon;
      targetLat = clamp(location.lat, -68, 68);
      placeImage.src = location.image;
      placeImage.alt = location.alt;
      placeTitle.textContent = location.label.replace(' / HOME', '');
      placeCredit.textContent = `${location.credit} / Wikimedia Commons ↗`;
      placeCredit.href = location.source;
      placeCard.hidden = false;
      intro.classList.add('is-focusing-place');
      window.requestAnimationFrame(() => placeCard.classList.add('is-open'));
    };

    const closePlace = () => {
      if (!placeCard) return;
      placeCard.classList.remove('is-open');
      intro.classList.remove('is-focusing-place');
      activeLocation = null;
      window.setTimeout(() => { placeCard.hidden = true; }, reduceMotion ? 0 : 320);
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
      pointerY = event.clientY;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerMoved = false;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (pointerDown) {
        if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 4) {
          dragged = true;
          pointerMoved = true;
        }
        targetLon -= (event.clientX - pointerX) * .35;
        targetLat = clamp(targetLat + (event.clientY - pointerY) * .3, -72, 72);
        pointerX = event.clientX;
        pointerY = event.clientY;
      } else {
        const overPlace = hitTargets.some((target) => Math.hypot(event.clientX - target.x, event.clientY - target.y) < 17);
        canvas.classList.toggle('is-over-place', overPlace);
      }
    });
    canvas.addEventListener('pointerup', () => { pointerDown = false; });
    canvas.addEventListener('pointercancel', () => { pointerDown = false; });
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      dragged = true;
      targetLon -= event.deltaX * .09;
      targetLat = clamp(targetLat + event.deltaY * .055, -72, 72);
    }, { passive: false });
    canvas.addEventListener('click', (event) => {
      if (pointerMoved) return;
      const target = hitTargets
        .map((item) => ({ ...item, distance: Math.hypot(event.clientX - item.x, event.clientY - item.y) }))
        .filter((item) => item.distance < 18)
        .sort((a, b) => a.distance - b.distance)[0];
      if (target) openPlace(target.location);
      else finishIntro();
    });
    enterButton?.addEventListener('click', finishIntro);
    placeClose?.addEventListener('click', closePlace);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && placeCard && !placeCard.hidden) closePlace();
    });
    window.setTimeout(() => enterButton?.classList.add('is-ready'), reduceMotion ? 0 : 180);
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
