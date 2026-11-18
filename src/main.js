// Theme toggle (remembers the choice; falls back to the system setting)
const root = document.documentElement;
document.querySelector('.theme')?.addEventListener('click', () => {
  const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// Footer clock
const clock = document.querySelector('[data-clock]');
if (clock) {
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-US'); };
  tick();
  setInterval(tick, 1000);
}

// Scroll reveal — plain scroll check (no IntersectionObserver), so content can never stay hidden
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  let pending = [...document.querySelectorAll('.card, .services li, .timeline li, .archive__item, .cols > div, .project__gallery img, .stats > div')];
  pending.forEach((el) => el.classList.add('reveal'));
  const check = () => {
    const limit = innerHeight * 0.94;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!pending.length) { removeEventListener('scroll', check); removeEventListener('resize', check); }
  };
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check);
  addEventListener('load', check);
  check();
}

// Draggable hero tags
const area = document.querySelector('[data-drag-area]');
if (area) {
  area.querySelectorAll('[data-drag]').forEach((el) => {
    let ox = 0, oy = 0, drag = null, moved = false;
    el.addEventListener('dragstart', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      const a = area.getBoundingClientRect(), r = el.getBoundingClientRect();
      // limits for the offset so the element stays inside the area
      drag = { sx: e.clientX, sy: e.clientY, ox, oy,
        minX: ox - (r.left - a.left), maxX: ox + (a.right - r.right),
        minY: oy - (r.top - a.top), maxY: oy + (a.bottom - r.bottom) };
      moved = false;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = 2;
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      ox = Math.min(Math.max(drag.ox + dx, drag.minX), drag.maxX);
      oy = Math.min(Math.max(drag.oy + dy, drag.minY), drag.maxY);
      el.style.transform = `translate(${ox}px, ${oy}px)`;
    });
    const end = () => { drag = null; el.style.zIndex = ''; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener('click', (e) => { if (moved && e.detail !== 0) e.preventDefault(); moved = false; });
  });
}
