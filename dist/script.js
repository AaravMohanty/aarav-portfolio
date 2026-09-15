(() => {
  const themes = ['midnight', 'ember', 'terminal'];
  const buttons = [...document.querySelectorAll('[data-set-theme]')];
  function setTheme(theme) {
    if (!themes.includes(theme)) return;
    document.body.dataset.theme = theme;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.setTheme === theme)));
    document.querySelector('meta[name="theme-color"]').content = {midnight:'#0c0e13',ember:'#120e0c',terminal:'#0a100e'}[theme];
    try { localStorage.setItem('aarav-theme', theme); } catch {}
  }
  try { setTheme(localStorage.getItem('aarav-theme')); } catch {}
  buttons.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.setTheme)));
  document.querySelector('.copy-email').addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText('aarav.mohanty23@gmail.com');
      status.textContent = 'Copied. Say hello!';
    } catch { status.textContent = 'aarav.mohanty23@gmail.com'; }
  });
  const progress = document.querySelector('.reading-progress');
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  let queued = false;
  function updateScroll() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    let current;
    links.forEach(link => {
      if (document.querySelector(link.getAttribute('href')).getBoundingClientRect().top <= 180) current = link;
      link.removeAttribute('aria-current');
    });
    if (current) current.setAttribute('aria-current', 'location');
    queued = false;
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateScroll); } }, {passive:true});
  addEventListener('resize', updateScroll);
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', updateScroll));
  updateScroll();
})();
