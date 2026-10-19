/* ---------------------------------------------------------------
   site.js - behaviour shared by every page.
   Cursor light, local clock, scroll reveals, and the command palette.
   --------------------------------------------------------------- */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

  /* ---- the warm light that follows the cursor ---- */
  window.addEventListener('pointermove', (event) => {
    root.style.setProperty('--mx', `${event.clientX}px`);
    root.style.setProperty('--my', `${event.clientY}px`);
  }, { passive: true });

  /* ---- what time it is where I am ---- */
  const timeNodes = document.querySelectorAll('.local-time');
  if (timeNodes.length) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Indiana/Indianapolis', hour: 'numeric', minute: '2-digit'
    });
    const updateTime = () => {
      const now = formatter.format(new Date());
      timeNodes.forEach((node) => { node.textContent = `West Lafayette · ${now}`; });
    };
    updateTime();
    window.setInterval(updateTime, 30000);
  }

  /* ---- fade sections in as they arrive ---- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach((item) => item.classList.add('is-in'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: .08 });
      reveals.forEach((item, index) => {
        item.style.transitionDelay = `${Math.min(index * 70, 210)}ms`;
        observer.observe(item);
      });
    }
  }

  /* ================= command palette (ctrl/cmd + K) ================= */

  const COMMANDS = [
    { group: 'Pages', icon: '◉', label: 'Home', hint: '/', href: '/' },
    { group: 'Pages', icon: '◉', label: 'Projects', hint: '/projects', href: '/projects/' },
    { group: 'Pages', icon: '◉', label: 'Experience', hint: '/experience', href: '/experience/' },
    { group: 'Pages', icon: '◉', label: 'Outside work', hint: '/outside', href: '/outside/' },
    { group: 'Pages', icon: '◍', label: 'The globe', hint: 'where I have been', href: '/?globe' },

    { group: 'Projects', icon: '→', label: 'Amdahl', hint: 'legal search', href: '/projects/#amdahl' },
    { group: 'Projects', icon: '→', label: 'Atlas', hint: 'coding agent', href: '/projects/#atlas' },
    { group: 'Projects', icon: '→', label: 'Radius', hint: 'compliance api', href: '/projects/#radius' },
    { group: 'Projects', icon: '→', label: 'ArisTalkle', hint: 'hackathon winner', href: '/projects/#aristalkle' },
    { group: 'Projects', icon: '→', label: 'Auxo', hint: 'policy contracts', href: '/projects/#auxo' },
    { group: 'Projects', icon: '→', label: 'THINKedIn', hint: 'alumni network', href: '/projects/#thinkedin' },
    { group: 'Projects', icon: '→', label: 'GNN Anomaly Detection', hint: 'graph learning', href: '/projects/#gnn' },
    { group: 'Projects', icon: '→', label: 'Boiler Quant signal pipeline', hint: 'market data', href: '/projects/#boiler-quant' },
    { group: 'Projects', icon: '→', label: 'Clarity', hint: 'sockets', href: '/projects/#clarity' },
    { group: 'Projects', icon: '→', label: 'StockGuessr', hint: 'game', href: '/projects/#stockguessr' },

    { group: 'Elsewhere', icon: '↗', label: 'GitHub', hint: 'AaravMohanty', href: 'https://github.com/AaravMohanty', external: true },
    { group: 'Elsewhere', icon: '↗', label: 'LinkedIn', hint: 'aaravmohanty', href: 'https://linkedin.com/in/aaravmohanty', external: true },
    { group: 'Elsewhere', icon: '↗', label: 'X', hint: '@aarav_mohanty', href: 'https://x.com/aarav_mohanty', external: true },
    { group: 'Elsewhere', icon: '↗', label: 'Résumé', hint: 'pdf', href: '/resume.pdf', external: true },
    { group: 'Elsewhere', icon: '✉', label: 'Email me', hint: 'aarav.mohanty23@gmail.com', href: 'mailto:aarav.mohanty23@gmail.com' },
    { group: 'Elsewhere', icon: '⧉', label: 'Copy email address', hint: 'to clipboard', action: 'copy-email' }
  ];

  const palette = document.createElement('div');
  palette.className = 'palette';
  palette.hidden = true;
  palette.setAttribute('role', 'dialog');
  palette.setAttribute('aria-modal', 'true');
  palette.setAttribute('aria-label', 'Quick jump');
  palette.innerHTML = `
    <div class="palette-panel glass">
      <div class="palette-search">
        <span aria-hidden="true">&gt;</span>
        <input type="text" placeholder="Jump to a page or a project" aria-label="Search" autocomplete="off" spellcheck="false"
               role="combobox" aria-expanded="true" aria-controls="palette-results" aria-autocomplete="list">
      </div>
      <ul class="palette-list" id="palette-results" role="listbox" aria-label="Results"></ul>
      <div class="palette-foot">
        <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> move</span>
        <span><kbd>enter</kbd> open</span>
        <span><kbd>esc</kbd> close</span>
      </div>
    </div>`;
  document.body.appendChild(palette);

  const input = palette.querySelector('input');
  const list = palette.querySelector('.palette-list');
  let results = [];
  let cursor = 0;
  let lastFocused = null;

  const score = (command, query) => {
    if (!query) return 1;
    const haystack = `${command.label} ${command.hint} ${command.group}`.toLowerCase();
    if (haystack.includes(query)) return 3;
    // loose subsequence match, so "stkg" still finds StockGuessr
    let index = 0;
    for (const character of query) {
      index = haystack.indexOf(character, index);
      if (index === -1) return 0;
      index += 1;
    }
    return 1;
  };

  const render = () => {
    list.replaceChildren();
    if (!results.length) {
      input.removeAttribute('aria-activedescendant');
      const empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.setAttribute('role', 'presentation');
      empty.textContent = 'No matches.';
      list.appendChild(empty);
      return;
    }
    let currentGroup = '';
    results.forEach((command, index) => {
      if (command.group !== currentGroup) {
        currentGroup = command.group;
        const heading = document.createElement('li');
        heading.className = 'palette-group';
        heading.setAttribute('role', 'presentation');
        heading.setAttribute('aria-hidden', 'true');
        heading.textContent = currentGroup;
        list.appendChild(heading);
      }
      const item = document.createElement('li');
      item.setAttribute('role', 'presentation');
      const node = document.createElement(command.action ? 'button' : 'a');
      node.className = 'palette-item';
      node.id = `palette-option-${index}`;
      node.setAttribute('role', 'option');
      node.setAttribute('aria-selected', String(index === cursor));
      if (command.action) {
        node.type = 'button';
      } else {
        node.href = command.href;
        if (command.external) { node.target = '_blank'; node.rel = 'noopener'; }
      }
      if (index === cursor) node.classList.add('is-active');
      const icon = document.createElement('i');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = command.icon;
      const label = document.createElement('b');
      label.textContent = command.label;
      const hint = document.createElement('small');
      hint.textContent = command.hint;
      node.append(icon, label, hint);
      node.addEventListener('click', (event) => {
        if (command.action === 'copy-email') {
          event.preventDefault();
          copyEmail(label);
          return;
        }
        closePalette();
      });
      node.addEventListener('pointerenter', () => {
        cursor = index;
        list.querySelectorAll('.palette-item').forEach((other, otherIndex) => {
          other.classList.toggle('is-active', otherIndex === index);
          other.setAttribute('aria-selected', String(otherIndex === index));
        });
      });
      if (index === cursor) input.setAttribute('aria-activedescendant', node.id);
      item.appendChild(node);
      list.appendChild(item);
    });
  };

  const copyEmail = (labelNode) => {
    const address = 'aarav.mohanty23@gmail.com';
    const done = () => {
      if (!labelNode) return;
      labelNode.textContent = 'Copied.';
      window.setTimeout(closePalette, 650);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(address).then(done).catch(() => { window.location.href = `mailto:${address}`; });
    } else {
      window.location.href = `mailto:${address}`;
    }
  };

  const filter = () => {
    const query = input.value.trim().toLowerCase();
    results = COMMANDS
      .map((command) => ({ command, rank: score(command, query) }))
      .filter((entry) => entry.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .map((entry) => entry.command);
    cursor = 0;
    render();
  };

  const openPalette = () => {
    if (!palette.hidden) return;
    lastFocused = document.activeElement;
    palette.hidden = false;
    input.value = '';
    filter();
    window.requestAnimationFrame(() => {
      palette.classList.add('is-open');
      input.focus();
    });
  };

  function closePalette() {
    if (palette.hidden) return;
    palette.classList.remove('is-open');
    const finish = () => {
      palette.hidden = true;
      if (lastFocused instanceof HTMLElement) lastFocused.focus();
    };
    if (reduceMotion) finish();
    else window.setTimeout(finish, 200);
  }

  const move = (delta) => {
    if (!results.length) return;
    cursor = (cursor + delta + results.length) % results.length;
    render();
    list.querySelectorAll('.palette-item')[cursor]?.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('input', filter);
  palette.addEventListener('click', (event) => { if (event.target === palette) closePalette(); });
  palette.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); closePalette(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
    else if (event.key === 'Enter') {
      event.preventDefault();
      list.querySelectorAll('.palette-item')[cursor]?.click();
    } else if (event.key === 'Tab') {
      // keep focus inside the dialog
      event.preventDefault();
      move(event.shiftKey ? -1 : 1);
    }
  });

  document.querySelectorAll('[data-palette-open]').forEach((button) => {
    button.addEventListener('click', openPalette);
    const modifier = button.querySelector('.palette-key-mod');
    if (modifier && isMac) modifier.textContent = '⌘';
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === 'k') {
      event.preventDefault();
      palette.hidden ? openPalette() : closePalette();
      return;
    }
    if (key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    event.preventDefault();
    openPalette();
  });
})();
