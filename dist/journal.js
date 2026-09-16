(() => {
  document.querySelectorAll('.site-header nav a').forEach(a => {
    if (a.pathname === location.pathname) a.setAttribute('aria-current','page');
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('waiting'); observer.unobserve(entry.target); }
    }), {threshold:0.08});
    document.querySelectorAll('.journal-section,.home-paths,.home-landscape').forEach(el => {
      el.classList.add('reveal');
      if (el.getBoundingClientRect().top > innerHeight) el.classList.add('waiting');
      observer.observe(el);
    });
  }
  const sectionLinks = [...document.querySelectorAll('.section-nav a')];
  if (sectionLinks.length) {
    let ticking = false;
    const update = () => {
      let current = sectionLinks[0];
      sectionLinks.forEach(a => { if (document.querySelector(a.hash).getBoundingClientRect().top < 180) current = a; a.removeAttribute('aria-current'); });
      current.setAttribute('aria-current','location'); ticking = false;
    };
    addEventListener('scroll', () => {if (!ticking) {ticking=true;requestAnimationFrame(update);}}, {passive:true});
    update();
  }
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const photos = [{src:'/photos/hike.jpg',alt:'A hiker on a coastal trail at sunset'},{src:'/photos/coast.jpg',alt:'Tree-covered sea stacks reflected in water'}];
    let index = 0, opener;
    const show = n => { index=(n+photos.length)%photos.length; const img=lightbox.querySelector('img'); img.src=photos[index].src;img.alt=photos[index].alt;lightbox.querySelector('.photo-count').textContent=`${index+1} / ${photos.length}`; };
    document.querySelectorAll('.photo-open').forEach(button=>button.addEventListener('click',()=>{opener=button;show(Number(button.dataset.photo));lightbox.showModal();document.body.style.overflow='hidden';}));
    lightbox.querySelector('.lightbox-close').addEventListener('click',()=>lightbox.close());
    lightbox.querySelector('.photo-prev').addEventListener('click',()=>show(index-1));
    lightbox.querySelector('.photo-next').addEventListener('click',()=>show(index+1));
    lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();show(index+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(index-1);}});
    lightbox.addEventListener('click',e=>{if(e.target!==lightbox)return;const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close();});
    lightbox.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus();});
  }
  if(location.pathname==='/' && location.hash==='#work') location.replace('/projects/');
  if(location.pathname==='/' && location.hash==='#experience') location.replace('/experience/');
})();
