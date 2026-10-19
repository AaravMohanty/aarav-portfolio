/* ---------------------------------------------------------------
   main.js - the home page intro (quote, then globe) and the
   project filters. Shared behaviour lives in site.js.
   --------------------------------------------------------------- */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTRO_KEY = 'aarav-intro-v7';
  // Place photos keep their filenames when they are replaced, and _headers
  // marks /places/* immutable for a year. Without this the old picture stays
  // cached forever. Bump it whenever a photo in dist/places/ changes.
  const PHOTO_V = '2';
  const ENTERED_KEY = 'aarav-entered-v1';

  let alreadyEntered = false;
  try { alreadyEntered = sessionStorage.getItem(ENTERED_KEY) === 'yes'; } catch (error) {}

  /* Keep hidden layers out of the tab order as well as out of sight. */
  const setInert = (node, value) => {
    if (!node) return;
    if (value) node.setAttribute('inert', '');
    else node.removeAttribute('inert');
  };

  /* ===================== part one: the quote ===================== */

  const flightIntro = document.querySelector('.flight-intro');
  const globeIntro = document.querySelector('.globe-intro');
  const shell = document.querySelector('.site-shell');
  let flightFinished = false;

  const finishFlight = (instant = false) => {
    if (!flightIntro || flightFinished) return;
    flightFinished = true;
    try { sessionStorage.setItem(INTRO_KEY, 'seen'); } catch (error) {}
    document.body.classList.remove('flight-pending');
    document.body.classList.add('flight-complete');
    setInert(flightIntro, true);
    setInert(globeIntro, false);
    window.dispatchEvent(new Event('intro:quote-done'));

    if (instant) {
      document.documentElement.classList.add('flight-seen');
      flightIntro.hidden = true;
      return;
    }
    flightIntro.classList.add('is-leaving');
    window.setTimeout(() => {
      flightIntro.hidden = true;
      document.documentElement.classList.add('flight-seen');
    }, 640);
  };

  if (alreadyEntered) {
    // Straight to the page. Both gates stay closed for the rest of the session.
    document.body.classList.remove('flight-pending', 'globe-pending');
    document.body.classList.add('flight-complete', 'globe-finished');
    if (flightIntro) flightIntro.hidden = true;
    if (globeIntro) globeIntro.hidden = true;
    setInert(flightIntro, true);
    setInert(globeIntro, true);
    setInert(shell, false);
    document.documentElement.classList.add('flight-seen', 'site-entered');
  } else if (flightIntro) {
    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === 'seen'; } catch (error) {}

    setInert(globeIntro, true);
    setInert(shell, true);

    if (reduceMotion || seen) {
      finishFlight(true);
    } else {
      window.setTimeout(() => finishFlight(false), 5200);
      flightIntro.querySelector('.flight-skip')?.addEventListener('click', () => finishFlight(false));
      // Any reasonable "get me out of here" gesture should work.
      const escape = (event) => {
        if (event.type === 'keydown' && !['Escape', 'Enter', ' ', 'Spacebar'].includes(event.key)) return;
        finishFlight(false);
        window.removeEventListener('keydown', escape);
        flightIntro.removeEventListener('click', escape);
      };
      window.addEventListener('keydown', escape);
      flightIntro.addEventListener('click', escape);
    }
  } else {
    setInert(shell, false);
  }

  /* ===================== part two: the globe ===================== */

  const canvas = document.querySelector('.globe-canvas');
  const enterButton = document.querySelector('.globe-enter');

  if (globeIntro && !alreadyEntered) {
    if (document.body.classList.contains('flight-pending')) {
      window.addEventListener('intro:quote-done', () => globeIntro.removeAttribute('aria-hidden'), { once: true });
    } else {
      globeIntro.removeAttribute('aria-hidden');
      setInert(globeIntro, false);
    }
  }

  let openGlobe = null;

  if (globeIntro && canvas) {
    const context = canvas.getContext('2d');
    const locationItems = [...globeIntro.querySelectorAll('.globe-locations li')];
    const placeCard = globeIntro.querySelector('.globe-place-card');
    const placeImage = placeCard?.querySelector('img');
    const placeTitle = placeCard?.querySelector('.place-card-title');
    const placeCredit = placeCard?.querySelector('.place-card-credit');
    const placeClose = placeCard?.querySelector('.place-card-close');

    const locations = [
      { group: 'now', lat: 40.4259, lon: -86.9081, label: 'WEST LAFAYETTE / NOW', featured: true, image: '/places/west-lafayette.jpg', alt: 'The Purdue bell tower at the end of the day' },
      { group: 'world', lat: 38.8462, lon: -77.3064, label: 'VIRGINIA / HOME', featured: true },
      { group: 'world', lat: 20.5937, lon: 78.9629, label: 'INDIA', featured: true, image: '/places/india.jpg', alt: 'The Taj Mahal in Agra, India', credit: 'Jakub Michankow · CC BY 2.0', source: 'https://commons.wikimedia.org/wiki/File:Taj_Mahal,_Agra,_India1.jpg' },
      { group: 'world', lat: 4.2105, lon: 101.9758, label: 'MALAYSIA', image: '/places/malaysia.jpg', alt: 'The Petronas Towers at night in Kuala Lumpur, Malaysia', credit: 'Dcubillas · CC BY-SA 3.0', source: 'https://commons.wikimedia.org/wiki/File:Petronas_Towers_at_Night_-_from_the_base_upwards.jpg' },
      { group: 'world', lat: 3.2028, lon: 73.2207, label: 'MALDIVES', featured: true, image: '/places/maldives.jpg', alt: 'A small island and coral reef in the Maldives', credit: 'Ondřej Havelka · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Aerial_shot_of_a_small_island_on_a_coral_reef_in_the_Maldives.jpg' },
      { group: 'world', lat: 9.7489, lon: -83.7534, label: 'COSTA RICA', image: '/places/costa-rica.jpg', alt: 'Dusk on the Pacific coast of Costa Rica' },
      { group: 'world', lat: -9.19, lon: -75.0152, label: 'PERU', featured: true, image: '/places/peru.jpg', alt: 'A horse below the peaks in the Andes near Cusco' },
      { group: 'world', lat: 56.1304, lon: -106.3468, label: 'CANADA', image: '/places/canada.jpg', alt: 'A creek in the rainforest outside Vancouver' },
      { group: 'world', lat: 19.8968, lon: -155.5828, label: 'HAWAII', image: '/places/hawaii.jpg', alt: 'The Na Pali Coast on Kauai' },
      { group: 'world', lat: 64.2008, lon: -149.4937, label: 'ALASKA', image: '/places/alaska.jpg', alt: 'A valley near Skagway, Alaska' },
      { group: 'world', lat: 18.1096, lon: -77.2975, label: 'JAMAICA' },
      { group: 'world', lat: 25.0343, lon: -77.3963, label: 'BAHAMAS' },
      { group: 'world', lat: 12.6027, lon: -70.0515, label: 'ARUBA', image: '/places/aruba.jpg', alt: 'The north shore of Aruba' },
      { group: 'world', lat: 46.2276, lon: 2.2137, label: 'FRANCE', image: '/places/france.jpg', alt: 'Cap Ferrat from the hills above the Riviera' },
      { group: 'world', lat: 40.4637, lon: -3.7492, label: 'SPAIN', image: '/places/spain.jpg', alt: 'Barcelona at golden hour, the Sagrada Família mid-build' },
      { group: 'world', lat: 39.3999, lon: -8.2245, label: 'PORTUGAL', image: '/places/portugal.jpg', alt: 'The Douro and the old town in Porto' },
      { group: 'world', lat: 46.8182, lon: 8.2275, label: 'SWITZERLAND', image: '/places/switzerland.jpg', alt: 'The Matterhorn above Zermatt' },
      { group: 'world', lat: 41.8719, lon: 12.5674, label: 'ITALY', featured: true, image: '/places/italy.jpg', alt: 'Florence rooftops from the top of the Duomo' },
      { group: 'world', lat: 41.0082, lon: 28.9784, label: 'TURKEY', featured: true, image: '/places/istanbul.jpg', alt: 'The Süleymaniye Mosque courtyard in Istanbul' },
      { group: 'world', lat: 39.0742, lon: 21.8243, label: 'GREECE', image: '/places/greece.jpg', alt: 'The rock monasteries at Meteora' },
      { group: 'world', lat: 23.6345, lon: -102.5528, label: 'MEXICO', image: '/places/mexico.jpg', alt: 'Chichén Itzá in Mexico', credit: 'Daniel Schwen · CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Chichen_Itza_2.jpg' },
      { group: 'parks', lat: 41.2132, lon: -124.0046, label: 'REDWOODS', image: '/places/redwoods.jpg', alt: 'A trail through Redwood National Park' },
      { group: 'parks', lat: 44.6, lon: -124.1, label: 'OREGON COAST', image: '/photos/coast.jpg', alt: 'The Oregon coast' },
      { group: 'parks', lat: 46.8523, lon: -121.7603, label: 'MT. RAINIER', featured: true, image: '/places/mt-rainier.jpg', alt: 'Climbing the snowfield on Mount Rainier' },
      { group: 'parks', lat: 47.8021, lon: -123.6044, label: 'OLYMPIC', image: '/photos/creek.jpg', alt: 'A creek in Olympic National Park' },
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
    let width = 0, height = 0;
    let baseRadius = 0, radius = 0;
    let zoom = 1, targetZoom = 1;
    let centerX = 0, centerY = 0;
    let centerLon = -77, targetLon = -77;
    let centerLat = 22, targetLat = 22;
    let pointerDown = false, pointerX = 0, pointerY = 0;
    let pointerStartX = 0, pointerStartY = 0, pointerMoved = false;
    let finished = false;
    let activeLocation = null;
    let focusTimer = 0;
    let hitTargets = [];

    let geoRequested = false;
    const loadCountries = () => {
      if (geoRequested) return;
      geoRequested = true;
      fetch('/world.geo.json')
        .then((response) => response.json())
        .then((data) => { countries = data.features || []; })
        .catch(() => { countries = []; });
    };

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
        baseRadius = Math.min(width * .37, height * (height < 740 ? .2 : .25));
        centerX = width * .5;
        centerY = height * .52;
      } else {
        baseRadius = Math.min(width * .235, height * .4);
        centerX = width * .7;
        centerY = height * .48;
      }
      radius = baseRadius * zoom;
    };

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    const project = (lon, lat) => {
      const lambda = (lon - centerLon) * Math.PI / 180;
      const phi = lat * Math.PI / 180;
      const phi0 = centerLat * Math.PI / 180;
      const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
      const cosPhi0 = Math.cos(phi0), sinPhi0 = Math.sin(phi0);
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
      if (!from || !to) return;
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
        context.font = '10px "DM Mono", monospace';
        context.fillText(location.label, point.x + 12, point.y - 8);
      }
      context.restore();
    };

    const virginia = locations.find((location) => location.label.startsWith('VIRGINIA'));
    const purdue = locations.find((location) => location.group === 'now');
    const india = locations.find((location) => location.label === 'INDIA');
    const italy = locations.find((location) => location.label === 'ITALY');

    const draw = (time) => {
      if (finished) return;
      if (document.hidden) { requestAnimationFrame(draw); return; }

      centerLon += (targetLon - centerLon) * (reduceMotion ? 1 : .025);
      centerLat += (targetLat - centerLat) * (reduceMotion ? 1 : .025);
      zoom += (targetZoom - zoom) * (reduceMotion ? 1 : .055);
      radius = baseRadius * zoom;
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

      // The list used to cycle on a timer alongside the auto-tour. With the
      // globe still until you move it, highlight whichever group has a
      // featured marker turned most directly toward the viewer instead.
      let facingGroup = 'now';
      let facingZ = -2;
      locations.forEach((location) => {
        if (!location.featured) return;
        const { z } = project(location.lon, location.lat);
        if (z > facingZ) { facingZ = z; facingGroup = location.group; }
      });
      const activeGroup = activeLocation?.group ?? facingGroup;
      const activeIndex = activeGroup === 'now' ? 0 : activeGroup === 'world' ? 1 : 2;

      if (!activeLocation) {
        drawArc(virginia, purdue, .5);
        drawArc(virginia, india, .24);
        drawArc(virginia, italy, .24);
      }
      locations.forEach((location) => drawMarker(location, activeLocation === location || (location.group === activeGroup && location.featured), time));
      locationItems.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));

      requestAnimationFrame(draw);
    };

    const openPlace = (location) => {
      if (!placeCard || !placeImage || !placeTitle || !placeCredit) return;
      activeLocation = location;
      targetLon = location.lon;
      targetLat = clamp(location.lat, -68, 68);
      targetZoom = width < 720 ? 2.05 : 2.45;
      placeImage.src = `${location.image}?v=${PHOTO_V}`;
      placeImage.alt = location.alt;
      placeTitle.textContent = location.label.replace(/ \/ (HOME|NOW)$/, '');
      // Only borrowed photos carry a credit. Mine have none, so the line goes.
      if (location.credit) {
        placeCredit.hidden = false;
        placeCredit.textContent = `${location.credit} / Wikimedia Commons`;
        placeCredit.href = location.source;
      } else {
        placeCredit.hidden = true;
        placeCredit.removeAttribute('href');
      }
      globeIntro.classList.add('is-zoomed');
      window.clearTimeout(focusTimer);
      placeCard.classList.remove('is-open');
      placeCard.hidden = true;
      focusTimer = window.setTimeout(() => {
        placeCard.hidden = false;
        window.requestAnimationFrame(() => {
          placeCard.classList.add('is-open');
          placeClose?.focus();
        });
      }, reduceMotion ? 0 : 700);
    };

    const closePlace = () => {
      if (!placeCard) return;
      window.clearTimeout(focusTimer);
      placeCard.classList.remove('is-open');
      globeIntro.classList.remove('is-zoomed');
      targetZoom = 1;
      activeLocation = null;
      window.setTimeout(() => { placeCard.hidden = true; }, reduceMotion ? 0 : 320);
    };

    const finishIntro = () => {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem(ENTERED_KEY, 'yes'); } catch (error) {}
      globeIntro.classList.add('is-leaving');
      document.body.classList.remove('globe-pending');
      document.body.classList.add('globe-finished');
      setInert(shell, false);
      window.setTimeout(() => {
        globeIntro.hidden = true;
        setInert(globeIntro, true);
        document.querySelectorAll('.reveal').forEach((item) => {
          if (item.getBoundingClientRect().top < window.innerHeight * .95) item.classList.add('is-in');
        });
      }, 620);
    };

    // Reopening after you have already entered: reset the view and restart
    // the loop. Listeners were bound once at setup and still hold.
    openGlobe = () => {
      if (!finished && document.body.classList.contains('globe-pending')) return;
      finished = false;
      activeLocation = null;
      zoom = 1;
      targetZoom = 1;
      if (placeCard) { placeCard.classList.remove('is-open'); placeCard.hidden = true; }
      globeIntro.hidden = false;
      globeIntro.classList.remove('is-leaving', 'is-zoomed');
      globeIntro.removeAttribute('aria-hidden');
      document.documentElement.classList.remove('site-entered');
      document.body.classList.remove('globe-finished');
      document.body.classList.add('globe-pending');
      setInert(globeIntro, false);
      setInert(shell, true);
      try { sessionStorage.removeItem(ENTERED_KEY); } catch (error) {}
      loadCountries();
      resize();
      enterButton?.classList.add('is-ready');
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    canvas.addEventListener('pointerdown', (event) => {
      pointerDown = true;
      pointerX = pointerStartX = event.clientX;
      pointerY = pointerStartY = event.clientY;
      pointerMoved = false;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (pointerDown) {
        if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 4) {
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
      targetLon -= event.deltaX * .09;
      targetLat = clamp(targetLat + event.deltaY * .055, -72, 72);
    }, { passive: false });
    canvas.addEventListener('click', (event) => {
      if (pointerMoved) return;
      const target = hitTargets
        .map((item) => ({ ...item, distance: Math.hypot(event.clientX - item.x, event.clientY - item.y) }))
        .filter((item) => item.distance < 18)
        .sort((a, b) => a.distance - b.distance)[0];
      // Clicking bare globe used to drop you into the site, which made a
      // misaimed click feel like the page had run off. Only the Enter
      // button and the Enter key come inside now.
      if (target) openPlace(target.location);
      else if (activeLocation) closePlace();
    });

    enterButton?.addEventListener('click', finishIntro);
    placeClose?.addEventListener('click', closePlace);

    // Enter comes inside, from anywhere on the globe screen.
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || finished) return;
      if (document.body.classList.contains('flight-pending')) return;
      if (globeIntro.hidden) return;
      if (placeCard && !placeCard.hidden) { closePlace(); return; }
      // let a focused control handle its own Enter
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return;
      event.preventDefault();
      finishIntro();
    });

    // Arrow keys spin the globe for anyone not using a mouse.
    globeIntro.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && placeCard && !placeCard.hidden) { closePlace(); return; }
      const step = event.shiftKey ? 18 : 7;
      if (event.key === 'ArrowLeft') targetLon -= step;
      else if (event.key === 'ArrowRight') targetLon += step;
      else if (event.key === 'ArrowUp') targetLat = clamp(targetLat + step, -72, 72);
      else if (event.key === 'ArrowDown') targetLat = clamp(targetLat - step, -72, 72);
      else return;
      event.preventDefault();
    });

    if (!alreadyEntered) {
      loadCountries();
      // The three list items drive the globe. Clicking one is how most people
    // work out what they are looking at, which a static legend never taught.
    const GROUP_VIEW = {
      now:   { lon: -86.9, lat: 40.4 },
      world: { lon: 16, lat: 33 },
      parks: { lon: -112, lat: 41 }
    };
    globeIntro.querySelectorAll('.globe-locations button').forEach((button) => {
      button.addEventListener('click', () => {
        const view = GROUP_VIEW[button.dataset.location];
        if (!view) return;
        if (activeLocation) closePlace();
        targetLon = view.lon;
        targetLat = view.lat;
      });
    });

    window.setTimeout(() => enterButton?.classList.add('is-ready'), reduceMotion ? 0 : 180);
      requestAnimationFrame(draw);
    }
  } else if (document.body.classList.contains('globe-pending')) {
    document.body.classList.remove('globe-pending');
    document.body.classList.add('globe-finished');
    setInert(shell, false);
  }

  /* ---- getting back to the globe after you have entered ---- */

  // On the home page this opens the globe in place. Everywhere else the
  // element is a real link to /?globe, so leave the navigation alone.
  document.querySelectorAll('[data-open-globe]').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (!openGlobe) return;
      event.preventDefault();
      openGlobe();
    });
  });

  // /?globe lets the command palette reach it from any page
  if (openGlobe && new URLSearchParams(window.location.search).has('globe')) {
    window.history.replaceState(null, '', window.location.pathname);
    openGlobe();
  }

  /* ===================== project filters ===================== */

  const filterBar = document.querySelector('.project-filters');
  if (filterBar) {
    const buttons = [...filterBar.querySelectorAll('button[data-filter]')];
    const cards = [...document.querySelectorAll('.case-study')];
    const countNode = filterBar.querySelector('.filter-count');

    // counts come from the cards themselves, so they can never drift
    buttons.forEach((button) => {
      const key = button.dataset.filter;
      const n = key === 'all'
        ? cards.length
        : cards.filter((card) => (card.dataset.tags || '').split(' ').includes(key)).length;
      const tally = document.createElement('b');
      tally.textContent = ` ${n}`;
      button.appendChild(tally);
    });

    const apply = (filter, initial = false) => {
      let shown = 0;
      cards.forEach((card) => {
        const tags = (card.dataset.tags || '').split(' ');
        const visible = filter === 'all' || tags.includes(filter);
        card.hidden = !visible;
        if (visible) {
          // Alternate the copy/visual sides across whatever is on screen.
          card.classList.toggle('is-flipped', shown % 2 === 1);
          // On a filter change the reveal observer has already let go of
          // these, so show them directly instead of leaving them blank.
          if (!initial) card.classList.add('is-in');
          shown += 1;
        }
      });
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
      if (countNode) {
        const label = buttons.find((button) => button.dataset.filter === filter)?.firstChild?.textContent.trim();
        countNode.textContent = filter === 'all' ? `All ${shown}` : `${shown} in ${label}`;
      }
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        apply(button.dataset.filter);
        const top = filterBar.getBoundingClientRect().top;
        if (top < 0) filterBar.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    apply('all', true);
  }
})();
