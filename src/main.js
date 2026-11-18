// All motion values come from the original Framer project.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };

// Theme toggle (remembers the choice; falls back to the system setting)
safe(() => {
  document.querySelector('.theme')?.addEventListener('click', () => {
    const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
});

// Footer clock
safe(() => {
  const clock = document.querySelector('[data-clock]');
  if (!clock) return;
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('en-US'); };
  tick();
  setInterval(tick, 1000);
});

// Smooth scroll (Lenis, as in the original)
safe(() => {
  if (reduce || !window.Lenis) return;
  root.style.scrollBehavior = 'auto';
  new window.Lenis({ autoRaf: true, anchors: true, smoothWheel: true });
});

// Text appear: split headings into characters / words that un-blur and rise in sequence
safe(() => {
  if (reduce) return;
  document.querySelectorAll('[data-fx]').forEach((el) => {
    const mode = el.dataset.fx;
    const step = parseFloat(el.dataset.stagger || '0.02');
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let i = 0;
    const token = (str) => {
      const s = document.createElement('span');
      s.className = 'fx-t';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--d', (i++ * step).toFixed(3));
      s.textContent = str;
      return s;
    };
    if (mode === 'element') { el.append(token(text)); return; }
    text.split(' ').forEach((word, n, all) => {
      if (mode === 'word') el.append(token(word));
      else {
        const w = document.createElement('span');
        w.className = 'fx-w';
        w.setAttribute('aria-hidden', 'true');
        [...word].forEach((ch) => w.append(token(ch)));
        el.append(w);
      }
      if (n < all.length - 1) el.append(' ');
    });
  });
});

// In-view triggers (plain scroll check: content can never get stuck hidden)
safe(() => {
  if (reduce) { document.querySelectorAll('[data-enter]').forEach((el) => el.classList.add('is-in')); return; }
  const once = [...document.querySelectorAll('.card, .archive__item, .cols > div, .project__gallery img, .stats > div')];
  once.forEach((el) => el.classList.add('reveal'));
  const items = [
    ...once.map((el) => ({ el, at: 0.06, once: true })),
    ...[...document.querySelectorAll('[data-fx]')].map((el) => ({ el, at: 0.5, once: true })),
    ...[...document.querySelectorAll('[data-enter]')].map((el) => ({ el, at: 0.2, once: false })),
  ];
  let live = items;
  const check = () => {
    const vh = innerHeight;
    live = live.filter((it) => {
      const r = it.el.getBoundingClientRect();
      const need = Math.min(r.height * it.at, vh * 0.3);
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible >= need && visible > 0) { it.el.classList.add('is-in'); return !it.once; }
      if (!it.once && visible <= 0) it.el.classList.remove('is-in'); // replays next time, like Framer's "animate once: off"
      return true;
    });
  };
  // run directly on scroll (cheap: a few dozen rect reads) so it never depends on rAF being serviced
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check);
  setInterval(check, 600);
  addEventListener('load', check);
  addEventListener('pageshow', check);
  check();
  setTimeout(check, 400);
});

// Hero physics: tags float in a walled box and are pushed away by the cursor (Matter.js)
safe(() => {
  const box = document.querySelector('[data-physics]');
  const M = window.Matter;
  if (!box || !M || reduce) return;
  const els = [...box.querySelectorAll('.phys')];
  const hint = box.querySelector('[data-hint]');
  let pushed = 0;
  const MOUSE = { radius: 120, strength: 0.02 };
  let engine, bodies = [], visible = true;
  const pointer = { x: 0, y: 0, active: false };

  const build = () => {
    const { width, height } = box.getBoundingClientRect();
    engine = M.Engine.create({ gravity: { x: 0, y: 0 } });
    const wall = { isStatic: true, friction: 2 };
    M.Composite.add(engine.world, [
      M.Bodies.rectangle(width / 2, height + 50, width + 100, 100, wall),
      M.Bodies.rectangle(width / 2, -50, width + 100, 100, wall),
      M.Bodies.rectangle(width + 50, height / 2, 100, height + 100, wall),
      M.Bodies.rectangle(-50, height / 2, 100, height + 100, wall),
    ]);
    bodies = els.map((el) => {
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = w / 2 + Math.random() * Math.max(1, width - w);
      const y = h / 2 + Math.random() * Math.max(1, height - h);
      return M.Bodies.rectangle(x, y, w, h, { density: 0.001, friction: 0.1, frictionAir: 0.01, restitution: 0.2 });
    });
    M.Composite.add(engine.world, bodies);
  };

  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (pointer.active) {
      for (const b of bodies) {
        const dx = b.position.x - pointer.x, dy = b.position.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < MOUSE.radius) {
          const f = (MOUSE.strength * (1 - d / MOUSE.radius)) / d;
          M.Body.applyForce(b, b.position, { x: dx * f, y: dy * f });
          if (hint && ++pushed === 25) hint.classList.add('is-used'); // they have got the idea
        }
      }
    }
    M.Engine.update(engine, 1000 / 60);
    bodies.forEach((b, i) => {
      const el = els[i];
      el.style.left = `${b.position.x - el.offsetWidth / 2}px`;
      el.style.top = `${b.position.y - el.offsetHeight / 2}px`;
      el.style.transform = `rotate(${b.angle}rad)`;
    });
  };

  const move = (e) => {
    const r = box.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
  };
  box.addEventListener('pointermove', move);
  box.addEventListener('pointerdown', move);
  box.addEventListener('pointerleave', () => { pointer.active = false; });
  box.addEventListener('pointercancel', () => { pointer.active = false; });

  let lastW = box.offsetWidth;
  addEventListener('resize', () => { if (box.offsetWidth !== lastW) { lastW = box.offsetWidth; build(); } });
  addEventListener('scroll', () => { visible = box.getBoundingClientRect().bottom > 0; }, { passive: true });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden && box.getBoundingClientRect().bottom > 0; });

  const start = () => { build(); frame(); };
  (document.fonts?.ready || Promise.resolve()).then(start, start); // sizes depend on the web font
});

// Fast Concept design: keep the 1400px layout scaled to the page width, and load its videos when near
safe(() => {
  const wrap = document.querySelector('[data-fcx]');
  if (!wrap) return;
  const fit = () => wrap.style.setProperty('--z', wrap.clientWidth / 1400);
  fit();
  addEventListener('resize', fit);
  let vids = [...wrap.querySelectorAll('video[data-fc-video]')];
  const load = () => {
    vids = vids.filter((v) => {
      const r = v.getBoundingClientRect();
      if (r.top < innerHeight * 1.5 && r.bottom > -innerHeight * 0.5) {
        v.src = v.dataset.src;
        if (!reduce) v.play().catch(() => {}); else v.controls = true;
        return false;
      }
      return true;
    });
    if (!vids.length) { removeEventListener('scroll', load); clearInterval(timer); }
  };
  addEventListener('scroll', load, { passive: true });
  const timer = setInterval(load, 700);
  load();
});

// Interaction hints on 3D viewers: hide once the visitor has grabbed the model
safe(() => {
  document.querySelectorAll('[data-hint-scope]').forEach((scope) => {
    const hint = scope.querySelector('[data-hint]');
    const target = scope.querySelector('model-viewer');
    if (!hint || !target) return;
    const used = () => hint.classList.add('is-used');
    target.addEventListener('pointerdown', used, { once: true });
    target.addEventListener('keydown', used, { once: true });
  });
});
