/* =========================================================
   CropCure — shared interactions (home + model page)
   Every feature checks that its elements exist, so the same
   file runs on both pages.
   1. Helpers         2. Lenis            3. Anchor links
   4. Header & menu   5. Scrollbar        6. Reveal & split text
   7. Counters        8. Parallax         9. Particles
   10. Spotlight      11. Videos          12. Year
   ========================================================= */
(() => {
    'use strict';

    // Location of this script — the service worker sits next to it at the site root
    const APP_SCRIPT_URL = document.currentScript ? document.currentScript.src : new URL('app.js', location.href).href;

    /* ---------------------------------------------------------
       1. Helpers
    --------------------------------------------------------- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    root.classList.add('js');

    /* ---------------------------------------------------------
       2. Lenis smooth scroll (lerp 0.06)
    --------------------------------------------------------- */
    const useLenis = !!window.Lenis && !reduceMotion;
    const lenis = useLenis
        ? new window.Lenis({ lerp: 0.06, smoothWheel: true })
        : {
            scrollTo(target, opts = {}) {
                const y = typeof target === 'number'
                    ? target
                    : target.getBoundingClientRect().top + window.scrollY + (opts.offset || 0);
                window.scrollTo({ top: y, behavior: reduceMotion || opts.immediate ? 'auto' : 'smooth' });
            },
            stop() {}, start() {}
        };

    if (useLenis) {
        const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
    }
    window.cropcure = { lenis };          // shared with model/script.js

    /* ---------------------------------------------------------
       3. Smooth in-page links
    --------------------------------------------------------- */
    document.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute('href');
        if (id === '#' || id === '#main') return;
        const target = (id === '#home' || id === '#top') ? 0 : $(id);
        if (target === null) return;

        e.preventDefault();
        closeMenu();
        lenis.scrollTo(target);           // eases with the same lerp as wheel scrolling
        history.replaceState(null, '', target === 0 ? location.pathname : id);
    });

    /* ---------------------------------------------------------
       4. Header: solid on scroll, hide on scroll-down,
          active-section highlight, mobile menu
    --------------------------------------------------------- */
    const header = $('.site-header');
    const nav = $('.nav');
    const toggle = $('.nav__toggle');
    let lastY = window.scrollY;

    function updateHeader() {
        if (!header) return;
        const y = window.scrollY;
        header.classList.toggle('is-scrolled', y > 40);
        const goingDown = y > lastY + 4;
        const goingUp = y < lastY - 4;
        if (!nav.classList.contains('is-open')) {
            if (goingDown && y > 480) header.classList.add('is-hidden');
            else if (goingUp || y < 480) header.classList.remove('is-hidden');
        }
        if (goingDown || goingUp) lastY = y;
    }

    function openMenu() {
        nav.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
        root.classList.add('no-scroll');
        lenis.stop();
    }

    function closeMenu() {
        if (!nav || !nav.classList.contains('is-open')) return;
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        root.classList.remove('no-scroll');
        lenis.start();
    }

    if (toggle) {
        toggle.addEventListener('click', () => (nav.classList.contains('is-open') ? closeMenu() : openMenu()));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
        window.matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
    }

    /* Squash & stretch indicator: when the active section changes, the
       highlight stretches thin toward the new link, squashes as it
       lands, then settles. Desktop nav only. */
    const linkList = $('.nav__links');
    const indicator = linkList && document.createElement('span');
    let indicatorFrom = null;
    const desktopNav = window.matchMedia('(min-width: 961px)');

    if (indicator) {
        indicator.className = 'nav__indicator';
        indicator.setAttribute('aria-hidden', 'true');
        linkList.prepend(indicator);
    }

    function placeIndicator(link, animate = true) {
        if (!indicator) return;
        if (!link || !desktopNav.matches) {
            indicator.style.opacity = '0';
            indicatorFrom = null;
            return;
        }
        const base = linkList.getBoundingClientRect();
        const r = link.getBoundingClientRect();
        const to = { x: r.left - base.left, w: r.width };

        indicator.style.top = `${r.top - base.top}px`;
        indicator.style.height = `${r.height}px`;
        indicator.style.width = `${to.w}px`;
        indicator.style.transform = `translateX(${to.x}px)`;

        const from = indicatorFrom;
        indicatorFrom = to;
        if (!from || !animate || reduceMotion || indicator.style.opacity === '0') {
            indicator.style.opacity = '1';
            return;
        }

        const left = Math.min(from.x, to.x);
        const span = Math.max(from.x + from.w, to.x + to.w) - left;
        indicator.animate([
            { transform: `translateX(${from.x}px) scaleY(1)`, width: `${from.w}px` },
            { transform: `translateX(${left}px) scaleY(.55)`, width: `${span}px`, offset: .42 },       // stretch
            { transform: `translateX(${to.x + 5}px) scaleY(1.2)`, width: `${to.w - 10}px`, offset: .72 }, // squash
            { transform: `translateX(${to.x - 2}px) scaleY(.94)`, width: `${to.w + 4}px`, offset: .88 },
            { transform: `translateX(${to.x}px) scaleY(1)`, width: `${to.w}px` }
        ], { duration: 680, easing: 'cubic-bezier(.45, 0, .2, 1)' });
    }

    const navLinks = new Map($$('.nav__link[href^="#"]').map(a => [a.getAttribute('href').slice(1), a]));
    let activeLink = null;

    function setActive(link) {
        if (link === activeLink) return;
        activeLink = link;
        navLinks.forEach(a => a.classList.toggle('is-active', a === link));
        placeIndicator(link);
    }

    if (navLinks.size) {
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const key = { diagnose: 'how', tool: null }[entry.target.id];
                const id = key === undefined ? entry.target.id : key;
                setActive(id && navLinks.get(id) || null);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        $$('main section[id], footer[id]').forEach(s => sectionObserver.observe(s));

        window.addEventListener('resize', () => placeIndicator(activeLink, false));
        desktopNav.addEventListener('change', () => placeIndicator(activeLink, false));
        if (document.fonts) document.fonts.ready.then(() => placeIndicator(activeLink, false));
    }

    /* ---------------------------------------------------------
       5. Custom overlay scrollbar (draggable, click track to jump,
          fades out when idle)
    --------------------------------------------------------- */
    const sb = $('#scrollbar');
    const thumb = sb && $('.scrollbar__thumb', sb);
    let hideTimer, dragging = false, grabOffset = 0;

    const metrics = () => {
        const vh = window.innerHeight;
        const max = root.scrollHeight - vh;
        const h = Math.max(48, (vh * vh) / root.scrollHeight);
        return { vh, max, h, travel: vh - h };
    };

    function syncThumb() {
        if (!sb) return;
        const { max, h, travel } = metrics();
        if (max <= 1) { sb.hidden = true; return; }
        sb.hidden = false;
        thumb.style.height = h + 'px';
        thumb.style.transform = `translateY(${(window.scrollY / max) * travel}px)`;
    }

    function flashThumb() {
        if (!sb) return;
        sb.classList.add('is-visible');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => sb.classList.remove('is-visible'), 1200);
    }

    const scrollToThumbY = y => {
        const { max, travel } = metrics();
        lenis.scrollTo(Math.min(1, Math.max(0, y / travel)) * max, { immediate: false });
    };

    if (sb) {
        thumb.addEventListener('pointerdown', e => {
            dragging = true;
            grabOffset = e.clientY - thumb.getBoundingClientRect().top;
            thumb.setPointerCapture(e.pointerId);
            sb.classList.add('is-dragging');
            e.preventDefault();
        });
        thumb.addEventListener('pointermove', e => {
            if (dragging) scrollToThumbY(e.clientY - grabOffset);
        });
        const endDrag = () => { dragging = false; sb.classList.remove('is-dragging'); flashThumb(); };
        thumb.addEventListener('pointerup', endDrag);
        thumb.addEventListener('pointercancel', endDrag);

        sb.addEventListener('pointerdown', e => {     // click on empty track -> jump there
            if (e.target === sb) scrollToThumbY(e.clientY - metrics().h / 2);
        });

        window.addEventListener('resize', syncThumb);
        new ResizeObserver(syncThumb).observe(document.body);
    }

    /* ---------------------------------------------------------
       6. Scroll reveal + word-by-word headings
    --------------------------------------------------------- */
    function splitWords(title) {
        title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
        // Collect words as lists of parts so "<em>solution</em>." stays one word
        const words = [];
        let atBoundary = true;
        [...title.childNodes].forEach(node => {
            const tag = node.nodeType === Node.ELEMENT_NODE ? node.tagName.toLowerCase() : null;
            node.textContent.split(/(\s+)/).forEach(part => {
                if (!part) return;
                if (/^\s+$/.test(part)) { atBoundary = true; return; }
                if (!atBoundary && words.length) words[words.length - 1].push({ text: part, tag });
                else words.push([{ text: part, tag }]);
                atBoundary = false;
            });
        });

        const frag = document.createDocumentFragment();
        words.forEach((parts, i) => {
            const outer = document.createElement('span');
            outer.className = 'split-word';
            outer.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span');
            inner.style.setProperty('--wd', (0.08 + i * 0.055).toFixed(3) + 's');
            parts.forEach(({ text, tag }) => {
                if (!tag) { inner.append(text); return; }
                const el = document.createElement(tag);
                el.textContent = text;
                inner.append(el);
            });
            outer.append(inner);
            frag.append(outer, ' ');
        });
        title.replaceChildren(frag);
    }

    const splitTitles = $$('[data-split]');
    if (!reduceMotion) splitTitles.forEach(splitWords);

    const revealEls = $$('[data-reveal], [data-split]');
    const reveal = el => el.classList.add(el.hasAttribute('data-split') ? 'is-split' : 'is-in');

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(reveal);
    } else {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveal(entry.target);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        revealEls.forEach(el => revealObserver.observe(el));
    }

    /* ---------------------------------------------------------
       7. Count-up numbers
    --------------------------------------------------------- */
    if (!reduceMotion) {
        const countObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                obs.unobserve(entry.target);
                const el = entry.target;
                const end = Number(el.dataset.count);
                const start = performance.now();
                const tick = now => {
                    const p = Math.min(1, (now - start) / 1600);
                    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
                    if (p < 1) requestAnimationFrame(tick);
                };
                el.textContent = '0';
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.6 });
        $$('[data-count]').forEach(el => countObserver.observe(el));
    }

    /* ---------------------------------------------------------
       8. Parallax — elements with data-speed drift with scroll
    --------------------------------------------------------- */
    const parallaxEls = reduceMotion ? [] : $$('[data-speed]');

    function updateParallax() {
        const vh = window.innerHeight;
        parallaxEls.forEach(el => {
            const r = el.parentElement.getBoundingClientRect();
            if (r.bottom < -200 || r.top > vh + 200) return;
            const offset = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.speed);
            el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });
    }

    /* ---------------------------------------------------------
       9. Particle field — fine dots that drift and get pushed
          away from the cursor, with faint links near it.
    --------------------------------------------------------- */
    function particleField(canvas) {
        const ctx = canvas.getContext('2d');
        const host = canvas.parentElement;
        const mouse = { x: -9999, y: -9999, active: false };
        const RADIUS = 150;
        let w = 0, h = 0, dpr = 1, dots = [], running = false, frame = 0;

        function resize() {
            const r = host.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = r.width; h = r.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const density = Number(canvas.dataset.density) || 1;
            const count = Math.min(340, Math.round((w * h) / 3600 * density));
            dots = Array.from({ length: count }, () => {
                const x = Math.random() * w, y = Math.random() * h;
                return {
                    x, y,
                    vx: (Math.random() - 0.5) * 0.18,
                    vy: (Math.random() - 0.5) * 0.18,
                    ox: 0, oy: 0,                       // displacement from the cursor push
                    r: Math.random() * 1.1 + 0.5,
                    a: Math.random() * 0.45 + 0.2,
                    lime: Math.random() < 0.35
                };
            });
            if (!running) draw();
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            const lit = [];                                  // dots currently reacting to the cursor
            for (const d of dots) {
                if (running) {
                    d.x += d.vx; d.y += d.vy;
                    if (d.x < -10) d.x = w + 10; else if (d.x > w + 10) d.x = -10;
                    if (d.y < -10) d.y = h + 10; else if (d.y > h + 10) d.y = -10;

                    const px = d.x + d.ox, py = d.y + d.oy;
                    const dx = px - mouse.x, dy = py - mouse.y;
                    const dist = Math.hypot(dx, dy);
                    if (mouse.active && dist < RADIUS && dist > 0.1) {
                        const force = (1 - dist / RADIUS) * 2.4;
                        d.ox += (dx / dist) * force;
                        d.oy += (dy / dist) * force;
                    }
                    d.ox *= 0.92; d.oy *= 0.92;            // spring back
                }
                const px = d.x + d.ox, py = d.y + d.oy;
                const near = mouse.active ? Math.max(0, 1 - Math.hypot(px - mouse.x, py - mouse.y) / RADIUS) : 0;

                if (near > 0) {                              // soft halo around reacting dots
                    lit.push({ px, py, near });
                    const halo = ctx.createRadialGradient(px, py, 0, px, py, 4 + near * 9);
                    halo.addColorStop(0, `rgba(200, 241, 105, ${near * 0.55})`);
                    halo.addColorStop(1, 'rgba(200, 241, 105, 0)');
                    ctx.fillStyle = halo;
                    ctx.beginPath();
                    ctx.arc(px, py, 4 + near * 9, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(px, py, d.r + near * 1.6, 0, Math.PI * 2);
                ctx.fillStyle = near > 0
                    ? `rgba(226, 250, 170, ${Math.min(1, d.a + near * 0.9)})`
                    : d.lime ? `rgba(200, 241, 105, ${d.a})` : `rgba(211, 239, 223, ${d.a})`;
                ctx.fill();

                if (near > 0.1) {                            // bright thread to the cursor
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(200, 241, 105, ${near * 0.55})`;
                    ctx.lineWidth = 0.4 + near * 0.9;
                    ctx.stroke();
                }
            }

            // Link reacting dots to each other, forming a small glowing web around the cursor
            for (let i = 0; i < lit.length; i++) {
                for (let j = i + 1; j < lit.length; j++) {
                    const a = lit[i], b = lit[j];
                    const dist = Math.hypot(a.px - b.px, a.py - b.py);
                    if (dist > 70) continue;
                    ctx.beginPath();
                    ctx.moveTo(a.px, a.py);
                    ctx.lineTo(b.px, b.py);
                    ctx.strokeStyle = `rgba(200, 241, 105, ${Math.min(a.near, b.near) * (1 - dist / 70) * 0.6})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
            if (running) frame = requestAnimationFrame(draw);
        }

        const start = () => { if (!running && !reduceMotion) { running = true; frame = requestAnimationFrame(draw); } };
        const stop = () => { running = false; cancelAnimationFrame(frame); };

        if (finePointer) {
            host.addEventListener('pointermove', e => {
                const r = canvas.getBoundingClientRect();
                mouse.x = e.clientX - r.left;
                mouse.y = e.clientY - r.top;
                mouse.active = true;
            });
            host.addEventListener('pointerleave', () => { mouse.active = false; });
        }

        new ResizeObserver(resize).observe(host);
        new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(host);
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
        resize();
    }

    $$('canvas[data-particles]').forEach(particleField);

    /* ---------------------------------------------------------
       10. Cursor spotlight on cards
    --------------------------------------------------------- */
    if (finePointer) {
        $$('[data-spotlight]').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - r.left}px`);
                card.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });
    }

    /* ---------------------------------------------------------
       One scroll handler drives header, scrollbar and parallax
    --------------------------------------------------------- */
    let ticking = false;
    window.addEventListener('scroll', () => {
        syncThumb();
        flashThumb();
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateHeader();
            updateParallax();
            ticking = false;
        });
    }, { passive: true });

    /* ---------------------------------------------------------
       11. Looping background videos — load and play only on screen
    --------------------------------------------------------- */
    if (!reduceMotion) {
        const videoObserver = new IntersectionObserver(entries => {
            entries.forEach(({ target: v, isIntersecting }) => {
                if (isIntersecting) {
                    if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
                    const p = v.play();
                    if (p) p.catch(() => {});
                } else {
                    v.pause();
                }
            });
        }, { threshold: 0.2 });
        $$('video.bg-video').forEach(v => videoObserver.observe(v));
    }

    /* ---------------------------------------------------------
       12. Copyright year — always the current year
    --------------------------------------------------------- */
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

    /* ---------------------------------------------------------
       13. Service worker (sw.js) — stores the model in Cache Storage
           so it is downloaded once and then loads from disk on every
           later visit. `swControl` resolves once this page's requests
           go through it (or after a short timeout without it).
    --------------------------------------------------------- */
    const swControl = (() => {
        if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return Promise.resolve(false);
        const registered = navigator.serviceWorker.register(new URL('sw.js', APP_SCRIPT_URL).href).catch(() => null);
        return registered.then(reg => new Promise(resolve => {
            if (!reg) return resolve(false);
            if (navigator.serviceWorker.controller) return resolve(true);
            navigator.serviceWorker.addEventListener('controllerchange', () => resolve(true), { once: true });
            setTimeout(() => resolve(!!navigator.serviceWorker.controller), 4000);
        }));
    })();

    /* ---------------------------------------------------------
       14. Warm the diagnosis model in the background (home page).
           <body data-preload-model="model/"> opts in. As soon as the
           page has finished loading, the TF.js runtime and the model
           files (~124 MB) are downloaded at low priority through the
           service worker into Cache Storage, so the model page starts
           almost instantly. Skipped only when Data Saver is on.
    --------------------------------------------------------- */
    const modelBase = document.body.dataset.preloadModel;
    if (modelBase) {
        // Only an explicit Data Saver setting opts a visitor out
        const constrained = !!(navigator.connection && navigator.connection.saveData);
        const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js'; // same URL as model/index.html
        let started = false;

        const warmModel = async () => {
            if (started || constrained) return;
            started = true;

            await swControl;                                         // route downloads through the cache

            try {
                fetch(TFJS_URL, { mode: 'no-cors', priority: 'low' }).catch(() => {});
                const dir = modelBase + 'tfjs_model/';
                const manifest = await fetch(dir + 'model.json', { priority: 'low' }).then(r => r.json());
                const files = manifest.weightsManifest.flatMap(g => g.paths);
                for (let i = 0; i < files.length; i += 4) {           // four shards at a time
                    await Promise.all(files.slice(i, i + 4).map(p =>
                        fetch(dir + p, { priority: 'low' }).then(r => r.arrayBuffer())));
                }
            } catch (err) {
                started = false;                                     // allow a retry on next hover
            }
        };

        // Start as soon as the home page has finished loading (its own content first)
        if (document.readyState === 'complete') warmModel();
        else window.addEventListener('load', warmModel, { once: true });

        $$(`a[href^="${modelBase}"]`).forEach(a => {
            a.addEventListener('pointerenter', warmModel, { once: true });
            a.addEventListener('focus', warmModel, { once: true });
        });
    }

    updateHeader();
    updateParallax();
    syncThumb();
    flashThumb();
})();
