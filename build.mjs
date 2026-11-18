// Static site generator — no dependencies. Run: node build.mjs
// Content lives in data/*.json and in the page functions below. Output goes to dist/.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';

const SITE = {
  name: 'Marc Gruau',
  // Public address of the site. Override while it lives on github.io:
  //   SITE_URL=https://user.github.io/repo BASE_PATH=/repo/ node build.mjs
  url: (process.env.SITE_URL || 'https://marcgruau.com').replace(/\/$/, ''),
  email: 'gruaumarc9@gmail.com',
  description:
    'Graphic designer, marketing strategist and sound engineer in Barcelona. Branding, visual identity, motion and audio. 8+ years, 150+ clients.',
  ogImage: 'img/vIa5Vuk4jUC0Gp3aol5I6nSUQ.webp',
  spotify: 'https://open.spotify.com/embed/artist/2G7hWDDwwbr7wbliulTfzI?utm_source=generator&theme=0',
  socials: [
    ['Instagram', 'https://instagram.com/marcgruau'],
    ['Spotify', 'https://open.spotify.com/artist/2G7hWDDwwbr7wbliulTfzI'],
    ['LinkedIn', 'https://www.linkedin.com/in/marc-gruau-62b3731ba/'],
    ['SoundCloud', 'https://soundcloud.com/marcgruau'],
  ],
};

const works = JSON.parse(readFileSync('data/works.json', 'utf8'));
const archive = JSON.parse(readFileSync('data/archive.json', 'utf8'));
const BASE = process.env.BASE_PATH || '/'; // only used by 404.html, which is served at any depth
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const picture = (root, im, { lazy = true, sizes = '100vw', cls = '' } = {}) =>
  `<img src="${root}${im.src}" width="${im.w}" height="${im.h}" alt="${esc(im.alt || '')}"${
    lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'
  }${cls ? ` class="${cls}"` : ''} sizes="${sizes}">`;

function layout({ path, title, description = SITE.description, active = '', body, ogImage = SITE.ogImage, rootOverride, noindex = false, physics = false, viewer = false }) {
  const depth = path === '' ? 0 : path.split('/').length;
  const root = rootOverride ?? (depth === 0 ? './' : '../'.repeat(depth));
  const canonical = `${SITE.url}/${path ? path + '/' : ''}`;
  const nav = [
    ['HOME', '', 'home'],
    ['WORKS', 'works/', 'works'],
    ['ARCHIVE', 'archive/', 'archive'],
    ['ABOUT', 'about/', 'about'],
  ]
    .map(([l, h, k]) => `<a href="${root}${h}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.url}/${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="color-scheme" content="dark light">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preload" href="${root}fonts/NeueMontreal-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}fonts/NeueMontreal-Medium.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}style.css">
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav">
  <a class="nav__brand" href="${root}">MARC GRUAU©</a>
  <nav class="nav__links" aria-label="Main">${nav}</nav>
  <button class="theme" type="button" aria-label="Toggle light and dark theme"><span></span></button>
</header>
<main id="main">
${body(root)}
</main>
<footer class="footer">
  <div class="footer__cta">
    <p>Interested to work with me?</p>
    <a class="link" href="mailto:${SITE.email}">${SITE.email.toUpperCase()}</a>
  </div>
  <ul class="footer__social">
    ${SITE.socials.map(([l, h]) => `<li><a href="${h}" target="_blank" rel="noopener">${l}</a></li>`).join('\n    ')}
  </ul>
  <time class="footer__clock" data-clock aria-hidden="true"></time>
</footer>
<script src="${root}vendor/lenis.min.js" defer></script>
${physics ? `<script src="${root}vendor/matter.min.js" defer></script>\n` : ''}${viewer ? `<script type="module" src="${root}vendor/model-viewer.min.js"></script>\n` : ''}<script src="${root}main.js" defer></script>
</body>
</html>
`;
}

const card = (root, w, eager = false, h = 'h3') => `<a class="card" href="${root}${w.slug}/">
  <div class="card__media">${picture(root, { ...w.thumb, alt: '' }, { lazy: !eager, sizes: '(min-width: 800px) 50vw, 100vw' })}</div>
  <div class="card__row"><${h}>${esc(w.title)}</${h}><span>${esc(w.year)}</span></div>
  <p class="card__cat">${esc(w.category)}</p>
</a>`;

/* ---------- Home ---------- */
const services = [
  ['Branding & Visual Identity', 'Logo systems, guidelines, art direction'],
  ['UX/UI Design', 'Web and product interfaces, design systems'],
  ['Content Strategy & Creation', 'Editorial, social and email content'],
  ['AI-Powered Design Solutions', 'MidJourney, DALL-E and Claude in production workflows'],
  ['Marketing Campaigns', 'Google Ads, SEO/SEM, CRM and lifecycle'],
];
const experiences = [
  ['2018', 'Senior E-commerce Manager', 'E.Leclerc'],
  ['2023', 'Graphic Design & Content Executive', 'Carts Guru'],
  ['2024', 'Freelance Designer & Consultant', 'Independent'],
];
const skills = [
  ['Marketing', ['KPI Tracking', 'HubSpot', 'SEO/SEM', 'Google Analytics', 'Google Ads']],
  ['Audio', ['Game Audio', 'Unity', 'Wwise', 'Logic Pro', 'Pro Tools', 'Ableton Live']],
  ['AI', ['Flair', 'Runway ML', 'ChatGPT', 'Claude', 'DALL-E', 'MidJourney']],
  ['Design', ['Canva', 'Blender', 'Figma', 'After Effects', 'Illustrator', 'Photoshop']],
];
const credentials = [
  ['Education', 'BA (Hons) Marketing Management', 'Cardiff Metropolitan University'],
  ['Certifications', 'Wwise and Unity — game audio', 'Pro Tools, Ableton, Google Ads, SEO'],
  ['Languages', 'Spanish and French native', 'English C1, German A1'],
];
const skillLinks = {
  'HubSpot': 'https://www.hubspot.com',
  'Google Analytics': 'https://analytics.google.com',
  'Google Ads': 'https://ads.google.com',
  'Unity': 'https://unity.com',
  'Wwise': 'https://www.audiokinetic.com/products/wwise/',
  'Logic Pro': 'https://www.apple.com/logic-pro/',
  'Pro Tools': 'https://www.avid.com/pro-tools',
  'Ableton Live': 'https://www.ableton.com/live/',
  'Flair': 'https://flair.ai',
  'Runway ML': 'https://runwayml.com',
  'ChatGPT': 'https://chatgpt.com',
  'Claude': 'https://claude.ai',
  'DALL-E': 'https://openai.com/index/dall-e-3/',
  'MidJourney': 'https://www.midjourney.com',
  'Canva': 'https://www.canva.com',
  'Blender': 'https://www.blender.org',
  'Figma': 'https://www.figma.com',
  'After Effects': 'https://www.adobe.com/products/aftereffects.html',
  'Illustrator': 'https://www.adobe.com/products/illustrator.html',
  'Photoshop': 'https://www.adobe.com/products/photoshop.html',
};
const tags = ['MOTION', 'GRAPHIC DESIGNER', 'SOUND ENGINEER', 'BRAND DESIGNER', 'MARKETING STRATEGIST'];

const home = (root) => `<section class="hero">
  <div class="hero__tags" data-physics>
    ${tags.map((t, i) => `<div class="phys p-${i + 1}"><span class="tag${i % 2 ? ' tag--r' : ''}">${t}${i === 0 ? '<i></i>' : ''}</span></div>`).join('\n    ')}
    <div class="phys p-o1"><a class="orb orb--arrow" href="#works" draggable="false" aria-label="Scroll to selected works"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></a></div>
    <div class="phys p-o2"><span class="orb orb--star" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></span></div>
  </div>
  <h1 class="hero__name">MARC GRUAU</h1>
  <div class="hero__intro">
    <p class="hero__lead">Brands that look, move and sound like one thing.</p>
    <div class="hero__copy">
      <p>I work where sound meets visual art. I came to design through marketing and to motion through music — which is why I think about brands as systems rather than pictures. An identity that cannot survive an email, a landing page and a thirty-second cut is not finished yet.</p>
      <p class="muted">150+ clients &nbsp;·&nbsp; 77% conversion &nbsp;·&nbsp; +25% traffic</p>
    </div>
  </div>
  <div class="player player--late"><iframe title="Marc Gruau on Spotify" src="${SITE.spotify}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>
</section>

<section class="section" id="works">
  <div class="section__head">
    <h2 class="accent" data-fx="char" data-stagger="0.02">Selected Works</h2>
    <p class="muted">Selected work · 2018 — 2026</p>
    <a class="link" href="${root}works/">View all works</a>
  </div>
  <div class="grid">
    ${works.filter((w) => w.featured).sort((a, b) => a.featuredOrder - b.featuredOrder).map((w) => card(root, w)).join('\n    ')}
  </div>
</section>

<section class="section split">
  <h2 class="accent" data-fx="char" data-stagger="0.02">Services</h2>
  <ol class="services" data-enter="left">
    ${services.map(([t, d], i) => `<li><span class="services__n">0${i + 1}</span><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></li>`).join('\n    ')}
  </ol>
</section>

<section class="section split">
  <h2 class="accent" data-fx="word" data-stagger="0.05">Experiences</h2>
  <ol class="timeline" data-enter="up">
    ${experiences.map(([y, r, c]) => `<li><span class="timeline__y">${y}</span><div><i class="timeline__dot" aria-hidden="true"></i><h3>${esc(r)}</h3><p>${esc(c)}</p></div></li>`).join('\n    ')}
  </ol>
</section>

<section class="section split">
  <h2 class="accent" data-fx="char" data-stagger="0.015">Skills &amp; Tools</h2>
  <div class="skills" data-enter="scale">
    ${skills.map(([g, list]) => `<div><h3>${g}</h3><ul>${list.map((s) => `<li>${skillLinks[s] ? `<a href="${skillLinks[s]}" target="_blank" rel="noopener">${s}</a>` : s}</li>`).join('')}</ul></div>`).join('\n    ')}
  </div>
</section>

<section class="section split">
  <h2 class="accent" data-fx="element" data-stagger="0.02">Credentials</h2>
  <div class="creds" data-enter="fade">
    ${credentials.map(([h, a, b]) => `<div><h3>${h}</h3><p>${esc(a)}</p><p class="muted">${esc(b)}</p></div>`).join('\n    ')}
  </div>
</section>

<section class="section split split--plain">
  <a class="link link--lg" href="${root}archive/">See playground</a>
  <p class="playground">Beyond client work: album covers, motion pieces and audio experiments. Produced in Ableton, Pro Tools and Logic Pro, designed in Adobe Suite, Figma and Blender.</p>
</section>`;

/* ---------- Works ---------- */
const worksPage = (root) => `<section class="page-head">
  <h1>All Works</h1>
  <p class="muted">CRM and lifecycle design, branding and visual identity, motion and cover design. 2018 — 2026.</p>
</section>
<section class="grid grid--page">
  ${works.map((w, i) => card(root, w, i < 2, 'h2')).join('\n  ')}
</section>
<section class="section"><div class="player player--flush"><iframe title="Marc Gruau on Spotify" src="${SITE.spotify}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div></section>`;

/* ---------- Archive ---------- */
const archivePage = (root) => `<section class="page-head page-head--archive">
  <h1 class="accent">Archived works</h1>
  <p>Series of past experiments and client work I've done along the years</p>
</section>
<section class="archive">
  ${archive.map((a, i) => `<figure class="archive__item archive__item--${a.align}">${picture(root, { ...a.image, alt: a.title }, { lazy: i > 0, sizes: '(min-width: 800px) 50vw, 100vw' })}<figcaption>${esc(a.title)}</figcaption></figure>`).join('\n  ')}
</section>`;

/* ---------- About ---------- */
const aboutSkills = [
  ['DESIGN', 'Photoshop, Illustrator, After Effects, Figma, Blender, Canva', 'I use this stack end to end for brand identity work: logo systems and guidelines in Illustrator and Figma, motion graphics in After Effects, and quick 3D mockups in Blender when a static render doesn’t sell the concept.'],
  ['AI', 'MidJourney, DALL-E, Claude, ChatGPT, Runway ML, Flair', 'I fold these into production rather than treat them as a shortcut: concept boards with MidJourney and DALL-E, copy and workflow scripting with Claude and ChatGPT, and fast video iterations with Runway ML when a client needs to see motion before a full shoot.'],
  ['AUDIO', 'Ableton Live, Pro Tools, Logic Pro. Wwise and Unity for interactive game audio.', 'I compose and mix in Ableton and Logic, finish and master in Pro Tools, then implement the result myself in Wwise and Unity so the sound reacts to what’s happening on screen instead of just playing over it.'],
  ['MARKETING', 'Google Ads, Google Analytics, SEO/SEM, HubSpot, KPI tracking', 'The discipline I lead with on client accounts: building and optimizing paid campaigns in Google Ads, tracking what converts in Analytics and HubSpot, and reporting the KPIs that took Carts Guru clients to a 77% conversion rate.'],
];
const aboutCreds = [
  ['EDUCATION', 'BA (Hons) Marketing Management — Cardiff Metropolitan University. Higher Education in Marketing & Advertising — Universidad CEU San Pablo, Madrid.', 'Two programs, one thread: understanding how audiences decide, which now shapes every brand and campaign I design.'],
  ['CERTIFICATIONS', 'Wwise and Unity for interactive game audio. Pro Tools and Ableton Certified User. Google Ads and SEO.', 'These map directly onto the three disciplines I work across — audio implementation, production, and performance marketing — so I can execute a brief myself instead of briefing it out.'],
  ['LANGUAGES', 'Spanish (native). French (native). English (C1). German (A1, learning).', 'Working across France, Germany, Spain and Switzerland means client calls happen in whichever language gets to the point fastest.'],
];
const cols = (items) => items.map(([h, a, b]) => `<div><h3>${h}</h3><p>${esc(a)}</p><p class="muted">${esc(b)}</p></div>`).join('\n    ');

const aboutPage = (root) => `<section class="about">
  <div class="about__photo">${picture(root, { src: 'img/2IMyfdDm99ox81p8SSlMMdbMLU.webp', w: 1080, h: 1080, alt: 'Portrait of Marc Gruau' }, { lazy: false, sizes: '(min-width: 800px) 28vw, 100vw' })}</div>
  <div class="about__body">
    <p class="eyebrow accent">ABOUT</p>
    <h1>Multidisciplinary designer working across <span class="accent">brand identity, digital marketing and audio production</span>.</h1>
    <div class="about__text">
      <p>I never picked a lane. Over eight years I’ve moved between three disciplines most studios keep in separate rooms: brand identity, digital marketing, and audio production — and I build all three myself instead of outsourcing the parts I don’t fully control.</p>
      <p>It started with a marketing degree in Cardiff and a second one in advertising in Madrid, then took a turn nobody predicted: certifications in Wwise and Unity for interactive game audio, and in Pro Tools and Ableton for production. I bring the same rigor I apply to a campaign brief to a sound design pass — nothing ships until it’s precise.</p>
      <p>That range shows up in the work. I’ve delivered visual identity and audio design for clients across France, Germany, Spain and Switzerland, and I bring AI into the process only where it genuinely saves time — never as a talking point in a pitch deck.</p>
      <p>The approach stays the same regardless of medium: strip out what doesn’t earn its place, and make sure whatever remains — a logo, a mix, a landing page — feels considered rather than decorated.</p>
      <p>At Carts Guru: 150+ clients across fashion, beauty, electronics and automotive, <span class="accent">77% conversion rate</span>. At E.Leclerc I grew web traffic 25% and audience interaction 30%.</p>
    </div>
    <a class="btn" href="${root}files/marc-gruau-cv.pdf" target="_blank" rel="noopener">Download CV</a>
    <dl class="stats">
      <div><dt>150+</dt><dd>Clients across fashion, beauty, electronics &amp; automotive</dd></div>
      <div><dt>77%</dt><dd>Conversion rate at Carts Guru</dd></div>
      <div><dt>30%</dt><dd>Web traffic &amp; audience interaction growth at E.Leclerc</dd></div>
    </dl>
    <div class="player"><iframe title="Marc Gruau on Spotify" src="${SITE.spotify}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>
  </div>
</section>
<section class="section">
  <p class="muted eyebrow">(01)</p>
  <h2 class="h-xl">Skills &amp; Tools</h2>
  <div class="cols cols--4">
    ${cols(aboutSkills)}
  </div>
</section>
<section class="section">
  <p class="muted eyebrow">(02)</p>
  <h2 class="h-xl">Credentials</h2>
  <div class="cols cols--3">
    ${cols(aboutCreds)}
  </div>
</section>`;

/* ---------- Fast Concept case study ---------- */
const fcBoard = (root, file, w, h, alt, cls = '') =>
  `<a class="fc__board${cls ? ' ' + cls : ''}" href="${root}img/fc/${file}.webp" target="_blank" rel="noopener" aria-label="Open full size: ${esc(alt)}"><img src="${root}img/fc/${file}.webp" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async"></a>`;
const fcColours = [
  ['Bunker Black', '#050608', 'Ground'],
  ['Panel Dark', '#161722', 'Panels'],
  ['Annotation Grey', '#8A8B90', 'Annotation'],
  ['Paper', '#F1EFEA', 'Type and mark'],
  ['Nucleus Red', '#EC1812', 'Core only'],
];
const fastConceptPage = (w, i) => (root) => {
  const prev = works[(i - 1 + works.length) % works.length];
  const next = works[(i + 1) % works.length];
  const label = (n, t, r = '') => `<header class="fc__label"><span>${n} / ${t}</span>${r ? `<span>${r}</span>` : ''}</header>`;
  return `<article class="project fc">
  <header class="project__head">
    <h1 aria-label="${esc(w.title)}">${w.title.split(' ').map((word, n) => `<span class="rise" aria-hidden="true"><span style="--i:${n}">${esc(word)}</span></span>`).join(' ')}</h1>
    <div class="project__intro"><p class="eyebrow muted">OVERVIEW</p><p class="project__overview">${esc(w.overview)}</p></div>
  </header>
  <div class="project__hero fc__cover"><img src="${root}img/fc/01-cover.webp" width="2200" height="1641" alt="Fast Concept — visual identity 2026. Emblem with red core above the Fast Concept wordmark. Independent electronic label, Barcelona." fetchpriority="high"></div>
  <dl class="project__meta">
    <div><dt>YEAR</dt><dd>${esc(w.year)}</dd></div>
    <div><dt>ROLE</dt><dd>${esc(w.role)}</dd></div>
    <div><dt>SERVICES</dt><dd>${esc(w.services)}</dd></div>
  </dl>

  <ul class="fc__facts" data-enter="up">
    <li><b>6</b><span>flat facets</span></li>
    <li><b class="fc-red">1</b><span>fixed red core</span></li>
    <li><b>6</b><span>permitted logo forms</span></li>
    <li><b>5</b><span>colours</span></li>
    <li><b>3</b><span>typefaces</span></li>
  </ul>

  <section class="fc__section">
    ${label('01', 'THE LABEL', 'INDEPENDENT ELECTRONIC LABEL')}
    <h2 class="fc__headline"><img src="${root}img/fc/headline.webp" width="2200" height="560" alt="The space between sound and structure." loading="lazy" decoding="async"></h2>
    <div class="fc__cols" data-enter="up">
      <p>Founded by Marc Gruau, FAST CONCEPT is an independent underground electronic music label operating at the convergence of high-octane club culture, brutalist architecture, and automotive design.</p>
      <p>The identity treats the label as a structure rather than a logo: a fixed grid, a measured mark, and a typographic system that behaves like an engineering spec. Every release, poster and sleeve is cut from the same construction.</p>
      <p class="fc-dim">Six flat facets, one fixed red core. The red is the nucleus and only the nucleus — never in type, never in fields, never inside a letterform. Everything else is black, paper and one grey for annotation.</p>
    </div>
  </section>

  <section class="fc__section">
    ${label('02', 'BRAND VALUES')}
    <ol class="fc__values" data-enter="up">
      <li><b>001</b><p>A raw electronic sound that takes concrete and brutalist architecture as its structural reference — mass, weight and load-bearing form translated into pressure and low end.</p></li>
      <li><b>002</b><p>Club culture as nocturnal discipline. Rhythm is repetition, not ornament — a machined loop held long enough to become architecture in itself.</p></li>
      <li><b>003</b><p>Automotive precision carried into design. Every surface is measured, every tolerance intentional; nothing is left to gesture or accident.</p></li>
    </ol>
  </section>

  <section class="fc__section">
    ${label('03', 'MARK CONSTRUCTION', 'DRAG TO ROTATE')}
    <div class="fc__mark">
      <div class="fc__viewer">
        <model-viewer src="${root}models/fast-concept-isotype.glb" alt="Fast Concept emblem in 3D: six off-white facets and one red core" camera-controls disable-zoom disable-pan auto-rotate auto-rotate-delay="0" rotation-per-second="24deg" interaction-prompt="none" touch-action="pan-y" camera-orbit="25deg 78deg 135%" exposure="1.1" shadow-intensity="0" loading="lazy" reveal="auto">
          <img slot="poster" src="${root}img/fc/grid.webp" width="1400" height="1400" alt="" loading="lazy">
        </model-viewer>
      </div>
      <div class="fc__grid"><img src="${root}img/fc/grid.webp" width="1400" height="1400" alt="Emblem drawn on its measuring grid: six rings and eight radials" loading="lazy" decoding="async"></div>
    </div>
    <div class="fc__cols fc__cols--2" data-enter="up">
      <p>The mark is built from six flat facets and one fixed red core, cut on a single measuring grid. Each plane is separated by a hairline seam; each angle is held to the same construction as the rings around it.</p>
      <p>The proportion is fixed. The mark is never stretched, never respaced, and never redrawn — it is placed, at the size the grid allows.</p>
    </div>
  </section>

  ${fcBoard(root, '05-anatomy', 2200, 1943, 'Anatomy of the Fast Concept emblem')}
  ${fcBoard(root, '06-primary-logo', 2200, 1316, 'Fast Concept primary logo')}
  ${fcBoard(root, '07-logo-system', 2200, 1545, 'Logo system — six permitted forms: primary, short form, emblem alone, seal, plate and campaign')}

  <section class="fc__section">
    ${label('06', 'COLOUR', 'RED LIVES ONLY IN THE CORE')}
    <ul class="fc__palette" data-enter="up">
      ${fcColours.map(([n, hex, use]) => `<li><button type="button" class="fc__swatch${hex === '#EC1812' ? ' fc__swatch--core' : ''}" style="--c:${hex}" data-copy="${hex}" aria-label="Copy ${n} ${hex}"><i></i></button><b>${n}</b><span>${hex} / ${use.toUpperCase()}</span></li>`).join('\n      ')}
    </ul>
  </section>

  ${fcBoard(root, '09-typography', 2200, 1745, 'Typographic system: N-Gage for display, Neue Montreal for body, Geist Mono for technical annotation')}
  ${fcBoard(root, '10-poster-series', 1400, 4542, 'Poster series — treatments of the emblem and wordmark on black, paper and red', 'fc__board--narrow')}
  ${fcBoard(root, '11-applications', 1400, 2924, 'Applications: business card, statement panel, sleeve system FC001 to FC003, signage and merch', 'fc__board--narrow')}
  ${fcBoard(root, '12-social-instagram', 2200, 2095, 'Instagram grid and stories with the rules for social use')}
  ${fcBoard(root, '13-do-not', 2200, 714, 'Incorrect uses of the mark')}
  ${fcBoard(root, '14-close', 2200, 1342, 'This is the representation of our mark. Founded by Marc Gruau — visual identity and guidelines, 2026.')}

  <nav class="project__nav" aria-label="Projects">
    <a href="${root}${prev.slug}/">← PREVIOUS</a>
    <a href="${root}${next.slug}/">NEXT →</a>
  </nav>
</article>`;
};

/* ---------- Project ---------- */
const projectPage = (w, i) => (root) => {
  const prev = works[(i - 1 + works.length) % works.length];
  const next = works[(i + 1) % works.length];
  return `<article class="project">
  <header class="project__head">
    <h1 aria-label="${esc(w.title)}">${w.title.split(' ').map((word, n) => `<span class="rise" aria-hidden="true"><span style="--i:${n}">${esc(word)}</span></span>`).join(' ')}</h1>
    <div class="project__intro"><p class="eyebrow muted">OVERVIEW</p><p class="project__overview">${esc(w.overview)}</p></div>
  </header>
  <div class="project__hero">${picture(root, { ...w.thumb, alt: `${w.title} — ${w.category.toLowerCase()}` }, { lazy: false })}</div>
  <dl class="project__meta">
    <div><dt>YEAR</dt><dd>${esc(w.year)}</dd></div>
    <div><dt>ROLE</dt><dd>${esc(w.role)}</dd></div>
    <div><dt>SERVICES</dt><dd>${esc(w.services)}</dd></div>
  </dl>
  ${w.description ? `<section class="project__about"><h2 class="accent">About the project</h2><div>${w.description}</div></section>` : ''}
  <div class="project__gallery">
    ${w.images.slice(1).map((im, n) => picture(root, { ...im, alt: `${w.title} — project image ${n + 1}` }, { sizes: '(min-width: 800px) 50vw, 100vw' })).join('\n    ')}
  </div>
  <nav class="project__nav" aria-label="Projects">
    <a href="${root}${prev.slug}/">← PREVIOUS</a>
    <a href="${root}${next.slug}/">NEXT →</a>
  </nav>
</article>`;
};

/* ---------- Build ---------- */
const pages = [
  { path: '', title: 'Marc Gruau — Graphic Designer & Marketing Strategist', active: 'home', physics: true, body: home, description: 'Designer specialized in visual systems, audio and motion. 8+ years in digital campaigns across fashion, beauty, electronics and automotive.' },
  { path: 'works', title: 'Works — Marc Gruau', active: 'works', body: worksPage, description: 'Selected projects across CRM and lifecycle design, branding and visual identity, motion and cover design.' },
  { path: 'archive', title: 'Archive — Marc Gruau', active: 'archive', body: archivePage, description: 'Archived works: past experiments, personal photography and client projects from across the years.' },
  { path: 'about', title: 'About — Marc Gruau', active: 'about', body: aboutPage, description: 'Designer, marketing strategist and sound engineer based in Barcelona. Skills, tools, experience and credentials.' },
  ...works.map((w, i) => ({ path: w.slug, title: `${w.title} — Marc Gruau`, active: 'works', body: (w.slug === 'fast-concept' ? fastConceptPage : projectPage)(w, i), viewer: w.slug === 'fast-concept', description: w.overview, ogImage: w.thumb.src })),
];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('public', 'dist', { recursive: true });
cpSync('src', 'dist', { recursive: true });
for (const p of pages) {
  const dir = `dist/${p.path}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, layout(p));
}
writeFileSync(
  'dist/404.html',
  layout({ path: '', title: 'Page not found — Marc Gruau', rootOverride: BASE, noindex: true, body: (root) => `<section class="page-head"><h1>Page not found</h1><p class="muted">This page does not exist. <a class="link" href="${root}">Back to home</a></p></section>` })
);
writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE.url}/${p.path ? p.path + '/' : ''}</loc></url>`).join('\n')}\n</urlset>\n`
);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages → dist/`);
