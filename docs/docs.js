/* =========================================================
   CropCure — model documentation page.
   Runs before ../app.js (both deferred, in order): it builds the
   page content so app.js's reveal / split / count animations,
   Lenis smooth scrolling and scrollbar pick it up automatically.
   ========================================================= */
(() => {
    'use strict';

    /* ---------------- Data ---------------- */
    const TYPES = {
        fungal:    { label: 'Fungal', color: 'var(--cause-fungal)' },
        oomycete:  { label: 'Oomycete (water mould)', color: 'var(--cause-oomycete)' },
        bacterial: { label: 'Bacterial', color: 'var(--cause-bacterial)' },
        viral:     { label: 'Viral', color: 'var(--cause-viral)' },
        pest:      { label: 'Pest (mite)', color: 'var(--cause-pest)' },
        healthy:   { label: 'Healthy', color: 'var(--cause-healthy)' }
    };

    // [raw label, crop, condition, cause, type] — in model output order (same as model/script.js)
    const CLASSES = [
        ['Apple___Apple_scab', 'Apple', 'Apple scab', 'Venturia inaequalis', 'fungal'],
        ['Apple___Black_rot', 'Apple', 'Black rot', 'Botryosphaeria obtusa', 'fungal'],
        ['Apple___Cedar_apple_rust', 'Apple', 'Cedar apple rust', 'Gymnosporangium juniperi-virginianae', 'fungal'],
        ['Apple___healthy', 'Apple', 'Healthy', '—', 'healthy'],
        ['Blueberry___healthy', 'Blueberry', 'Healthy', '—', 'healthy'],
        ['Cherry_(including_sour)___Powdery_mildew', 'Cherry', 'Powdery mildew', 'Podosphaera cerasi', 'fungal'],
        ['Cherry_(including_sour)___healthy', 'Cherry', 'Healthy', '—', 'healthy'],
        ['Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn (maize)', 'Gray leaf spot', 'Cercospora zeae-maydis', 'fungal'],
        ['Corn_(maize)___Common_rust_', 'Corn (maize)', 'Common rust', 'Puccinia sorghi', 'fungal'],
        ['Corn_(maize)___Northern_Leaf_Blight', 'Corn (maize)', 'Northern leaf blight', 'Exserohilum turcicum', 'fungal'],
        ['Corn_(maize)___healthy', 'Corn (maize)', 'Healthy', '—', 'healthy'],
        ['Grape___Black_rot', 'Grape', 'Black rot', 'Guignardia bidwellii', 'fungal'],
        ['Grape___Esca_(Black_Measles)', 'Grape', 'Esca (black measles)', 'Trunk-disease fungal complex', 'fungal'],
        ['Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape', 'Leaf blight (Isariopsis leaf spot)', 'Pseudocercospora vitis', 'fungal'],
        ['Grape___healthy', 'Grape', 'Healthy', '—', 'healthy'],
        ['Orange___Haunglongbing_(Citrus_greening)', 'Orange', 'Huanglongbing (citrus greening)', 'Candidatus Liberibacter spp.', 'bacterial'],
        ['Peach___Bacterial_spot', 'Peach', 'Bacterial spot', 'Xanthomonas arboricola pv. pruni', 'bacterial'],
        ['Peach___healthy', 'Peach', 'Healthy', '—', 'healthy'],
        ['Pepper,_bell___Bacterial_spot', 'Bell pepper', 'Bacterial spot', 'Xanthomonas spp.', 'bacterial'],
        ['Pepper,_bell___healthy', 'Bell pepper', 'Healthy', '—', 'healthy'],
        ['Potato___Early_blight', 'Potato', 'Early blight', 'Alternaria solani', 'fungal'],
        ['Potato___Late_blight', 'Potato', 'Late blight', 'Phytophthora infestans', 'oomycete'],
        ['Potato___healthy', 'Potato', 'Healthy', '—', 'healthy'],
        ['Raspberry___healthy', 'Raspberry', 'Healthy', '—', 'healthy'],
        ['Soybean___healthy', 'Soybean', 'Healthy', '—', 'healthy'],
        ['Squash___Powdery_mildew', 'Squash', 'Powdery mildew', 'Podosphaera xanthii', 'fungal'],
        ['Strawberry___Leaf_scorch', 'Strawberry', 'Leaf scorch', 'Diplocarpon earlianum', 'fungal'],
        ['Strawberry___healthy', 'Strawberry', 'Healthy', '—', 'healthy'],
        ['Tomato___Bacterial_spot', 'Tomato', 'Bacterial spot', 'Xanthomonas spp.', 'bacterial'],
        ['Tomato___Early_blight', 'Tomato', 'Early blight', 'Alternaria solani', 'fungal'],
        ['Tomato___Late_blight', 'Tomato', 'Late blight', 'Phytophthora infestans', 'oomycete'],
        ['Tomato___Leaf_Mold', 'Tomato', 'Leaf mould', 'Passalora fulva', 'fungal'],
        ['Tomato___Septoria_leaf_spot', 'Tomato', 'Septoria leaf spot', 'Septoria lycopersici', 'fungal'],
        ['Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato', 'Spider mites (two-spotted)', 'Tetranychus urticae', 'pest'],
        ['Tomato___Target_Spot', 'Tomato', 'Target spot', 'Corynespora cassiicola', 'fungal'],
        ['Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato', 'Yellow leaf curl virus', 'TYLCV (Begomovirus)', 'viral'],
        ['Tomato___Tomato_mosaic_virus', 'Tomato', 'Mosaic virus', 'ToMV (Tobamovirus)', 'viral'],
        ['Tomato___healthy', 'Tomato', 'Healthy', '—', 'healthy']
    ];

    // Read from model/tfjs_model/model.json — parameters per block (weights + biases)
    const LAYERS = [
        { name: 'Input', kind: 'Image', detail: 'RGB photo resized to 256 × 256, raw pixel values 0–255', shape: '256 × 256 × 3', params: 0, io: true },
        { name: 'Block 1', kind: 'Conv · Conv · Pool', detail: '2 × Conv 3×3, 32 filters (same → valid), ReLU, MaxPool 2×2', shape: '127 × 127 × 32', params: 10144 },
        { name: 'Block 2', kind: 'Conv · Conv · Pool', detail: '2 × Conv 3×3, 64 filters, ReLU, MaxPool 2×2', shape: '62 × 62 × 64', params: 55424 },
        { name: 'Block 3', kind: 'Conv · Conv · Pool', detail: '2 × Conv 3×3, 128 filters, ReLU, MaxPool 2×2', shape: '30 × 30 × 128', params: 221440 },
        { name: 'Block 4', kind: 'Conv · Conv · Pool', detail: '2 × Conv 3×3, 256 filters, ReLU, MaxPool 2×2', shape: '14 × 14 × 256', params: 885248 },
        { name: 'Block 5', kind: 'Conv · Conv · Pool', detail: '2 × Conv 3×3, 512 filters, ReLU, MaxPool 2×2', shape: '6 × 6 × 512', params: 3539968 },
        { name: 'Flatten', kind: 'Reshape', detail: 'Feature map unrolled into a vector', shape: '18,432', params: 0 },
        { name: 'Dense', kind: 'Fully connected', detail: '1,500 units, ReLU', shape: '1,500', params: 27649500 },
        { name: 'Output', kind: 'Dense + Softmax', detail: '38 units — one probability per class', shape: '38', params: 57038, io: true }
    ];
    const TOTAL_PARAMS = 32418762;

    const TIMINGS = [
        ['TF.js runtime', 0.45, '0.45 s'],
        ['31 model shards', 0.39, '0.39 s'],
        ['Parse + warm-up', 0.95, '0.95 s'],
        ['Model ready', 2.0, '≈ 2 s']
    ];

    const SOURCES = [
        { title: 'Apple', links: [
            ['Penn State — Black rot & frogeye leaf spot', 'https://extension.psu.edu/pome-fruit-disease-black-rot-and-frogeye-leaf-spot'],
            ['UMN Extension — Black rot of apple', 'https://extension.umn.edu/plant-diseases/black-rot-apple'],
            ['Cornell — Apple black rot', 'https://rvpadmin.cce.cornell.edu/uploads/doc_898.pdf']] },
        { title: 'Cherry', links: [
            ['UC IPM — Cherry pest management guidelines', 'https://ipm.ucanr.edu/PMG/r105100411.html'],
            ['Michigan State — Powdery mildew in tart cherry', 'https://www.canr.msu.edu/news/controlling_powdery_mildew_in_tart_cherry_orchards'],
            ['PNW Handbook — Cherry powdery mildew', 'https://pnwhandbooks.org/plantdisease/host-disease/cherry-prunus-spp-powdery-mildew']] },
        { title: 'Corn (maize)', links: [
            ['Kansas State — Gray leaf spot fungicide timing', 'https://eupdate.agronomy.ksu.edu/article/fungicide-management-of-gray-leaf-spot-don-t-miss-treatment-window-288'],
            ['Iowa State — Foliar fungicides on corn', 'https://crops.extension.iastate.edu/cropnews/2019/02/summary-foliar-fungicide-applications-corn-iowa-2018']] },
        { title: 'Grape', links: [
            ['UC IPM — Esca (black measles)', 'https://ipm.ucanr.edu/agriculture/grape/esca-black-measles/'],
            ['Texas A&M — Grapevine trunk diseases', 'https://aggie-horticulture.tamu.edu/wp-content/uploads/sites/13/2020/05/Grapevine-Trunk-Diseases-EPLP-034.pdf'],
            ['Grapepathology.org — Esca management', 'https://grapepathology.org/esca-management'],
            ['Univ. of Kentucky — Grape leaf spots', 'https://fruitscout.mgcafe.uky.edu/leaf-spots-grapes'],
            ['UC IPM — Grape guidelines', 'https://ipm.ucanr.edu/PMG/r302100411.html']] },
        { title: 'Orange (citrus)', links: [
            ['UF/IFAS — Huanglongbing (CG086)', 'https://edis.ifas.ufl.edu/publication/CG086/pdf'],
            ['UF/IFAS — Asian citrus psyllid (CG097)', 'https://edis.ifas.ufl.edu/publication/CG097/pdf']] },
        { title: 'Peach', links: [
            ['Michigan State — Bacterial spot on peach', 'https://www.canr.msu.edu/news/management_of_bacterial_spot_on_peach_and_nectarines'],
            ['Penn State — Stone fruit bacterial spot', 'https://extension.psu.edu/stone-fruit-disease-bacterial-spot'],
            ['Auburn — Bacterial spot treatment in peaches', 'https://www.aces.edu/wp-content/uploads/2025/03/ANR-2962_BacterialSpotTreatmentinPeaches_081925L.pdf']] },
        { title: 'Strawberry', links: [
            ['NC State — Leaf scorch of strawberry', 'https://content.ces.ncsu.edu/leaf-scorch-of-strawberry'],
            ['UMass — Strawberry foliar diseases', 'https://www.umass.edu/agriculture-food-environment/fruit/fact-sheets/strawberry-ipm-common-foliar-diseases'],
            ['PNW Handbook — Strawberry leaf scorch', 'https://pnwhandbooks.org/plantdisease/host-disease/strawberry-fragaria-spp-leaf-scorch']] },
        { title: 'Tomato — fungal', links: [
            ['UF/IFAS — Target spot', 'https://ipm.ifas.ufl.edu/pdfs/Target_Spot.pdf'],
            ['Cornell — Tomato leaf mold', 'https://vegetables.cornell.edu/crops/tomatoes/tomato-leaf-mold'],
            ['Penn State — Leaf mold in high tunnels', 'https://extension.psu.edu/managing-leaf-mold-in-high-tunnels']] },
        { title: 'Tomato — viruses', links: [
            ['NC State — Tomato yellow leaf curl virus', 'https://content.ces.ncsu.edu/tomato-yellow-leaf-curl-virus'],
            ['UF/IFAS — Whitefly management', 'https://ipm.ifas.ufl.edu/pdfs/Whitefly_Mgmt.pdf'],
            ['NC State — Tobamoviruses of tomato', 'https://content.ces.ncsu.edu/tobamoviruses-that-affect-tomato-tmv-tomv-tobrfv'],
            ['UMN Extension — Tomato viruses', 'https://extension.umn.edu/disease-management/tomato-viruses']] },
        { title: 'Dataset', links: [
            ['PlantVillage dataset (GitHub)', 'https://github.com/spMohanty/PlantVillage-Dataset'],
            ['Mohanty et al. 2016 — Deep learning for image-based plant disease detection', 'https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2016.01419/full']] }
    ];

    /* ---------------- Helpers ---------------- */
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const fmt = n => n.toLocaleString('en-US');
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ICONS = '../Images/icons.svg?v=2';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- Crops: bars + cards ---------------- */
    const crops = [];
    CLASSES.forEach(([, crop, cond, , type]) => {
        let c = crops.find(x => x.name === crop);
        if (!c) crops.push(c = { name: crop, items: [] });
        c.items.push({ cond, type });
    });
    const maxCount = Math.max(...crops.map(c => c.items.length));

    $('#cropBars').innerHTML = [...crops].sort((a, b) => b.items.length - a.items.length).map((c, i) =>
        `<div class="docs-bar"><span>${esc(c.name)}</span><span class="docs-bar__track"><span class="docs-bar__fill" style="--w:${(c.items.length / maxCount * 100).toFixed(1)}%;--bd:${(i * .05).toFixed(2)}s"></span></span><span class="docs-bar__value">${c.items.length}</span></div>`
    ).join('');

    $('#cropCards').innerHTML = crops.map((c, i) => {
        const diseases = c.items.filter(x => x.type !== 'healthy').length;
        return `<article class="docs-crop" data-reveal style="--d:${(i % 4 * .06).toFixed(2)}s">
            <div class="docs-crop__head"><h3>${esc(c.name)}</h3><span class="docs-crop__count">${diseases} disease${diseases === 1 ? '' : 's'}</span></div>
            <ul>${c.items.map(x => `<li><span class="docs-dot" style="background:${TYPES[x.type].color}"></span>${esc(x.cond)}</li>`).join('')}</ul>
        </article>`;
    }).join('');

    /* ---------------- Donut by cause ---------------- */
    const counts = {};
    CLASSES.forEach(c => { counts[c[4]] = (counts[c[4]] || 0) + 1; });
    const CIRC = 2 * Math.PI * 70;
    let offset = 0, segs = '', legend = '';
    Object.keys(TYPES).forEach((t, i) => {
        if (!counts[t]) return;
        const len = counts[t] / CLASSES.length * CIRC;
        segs += `<circle class="seg" cx="90" cy="90" r="70" stroke="${TYPES[t].color}" stroke-dashoffset="${(-offset).toFixed(2)}" data-len="${len.toFixed(2)}" style="--bd:${(i * .12).toFixed(2)}s"/>`;
        offset += len;
        legend += `<li><span class="swatch" style="background:${TYPES[t].color}"></span>${TYPES[t].label}<b>${counts[t]}</b></li>`;
    });
    $('#donut').insertAdjacentHTML('beforeend', segs);
    $('#donutLegend').innerHTML = legend;

    const drawDonut = () => $$('.docs-donut .seg').forEach(s => { s.style.strokeDasharray = `${s.dataset.len} ${CIRC}`; });
    if (reduceMotion || !('IntersectionObserver' in window)) drawDonut();
    else {
        const io = new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { drawDonut(); obs.disconnect(); } }, { threshold: .3 });
        io.observe($('#donut'));
    }

    /* ---------------- Conditions table + filters ---------------- */
    $('#conditionRows').innerHTML = CLASSES.map(([raw, crop, cond, cause, type], i) => {
        const t = TYPES[type];
        return `<tr data-type="${type}"><td class="idx">${i}</td><td>${esc(crop)}</td><td>${esc(cond)}<div class="docs-raw">${esc(raw)}</div></td><td><em>${esc(cause)}</em></td>
            <td><span class="docs-type" style="background:color-mix(in srgb, ${t.color} 16%, transparent);color:${t.color}"><span class="docs-dot" style="background:${t.color}"></span>${t.label.split(' ')[0]}</span></td></tr>`;
    }).join('');

    const filters = $('#filters');
    filters.innerHTML = `<button class="docs-chip is-on" type="button" data-filter="all">All · ${CLASSES.length}</button>` +
        Object.keys(TYPES).filter(t => counts[t]).map(t =>
            `<button class="docs-chip" type="button" data-filter="${t}"><span class="docs-dot" style="background:${TYPES[t].color}"></span>${TYPES[t].label.split(' ')[0]} · ${counts[t]}</button>`
        ).join('');
    filters.addEventListener('click', e => {
        const chip = e.target.closest('.docs-chip');
        if (!chip) return;
        $$('.docs-chip').forEach(c => c.classList.toggle('is-on', c === chip));
        const f = chip.dataset.filter;
        $$('#conditionRows tr').forEach(r => { r.hidden = f !== 'all' && r.dataset.type !== f; });
    });

    /* ---------------- Architecture ---------------- */
    $('#arch').innerHTML = LAYERS.map((l, i) => {
        const share = l.params / TOTAL_PARAMS * 100;
        const row = `<div class="docs-layer${l.io ? ' docs-layer--io' : ''}" style="--share:${share.toFixed(2)}%;--bd:${(i * .08).toFixed(2)}s">
            <div><span class="docs-layer__name">${l.name}</span><span class="docs-layer__kind">${l.kind}</span></div>
            <div class="docs-layer__detail">${l.detail}<br><span class="docs-layer__shape">→ ${l.shape}</span></div>
            <div class="docs-layer__params">${l.params ? fmt(l.params) : '—'}<small>${l.params ? share.toFixed(share < 1 ? 2 : 1) + '% of params' : 'no parameters'}</small></div>
        </div>`;
        return i < LAYERS.length - 1 ? row + '<span class="docs-arrow"></span>' : row;
    }).join('');

    /* ---------------- Timings ---------------- */
    const maxT = Math.max(...TIMINGS.map(t => t[1]));
    $('#timingBars').innerHTML = TIMINGS.map(([label, v, text], i) =>
        `<div class="docs-bar"><span>${label}</span><span class="docs-bar__track"><span class="docs-bar__fill" style="--w:${(v / maxT * 100).toFixed(1)}%;--bd:${(i * .08).toFixed(2)}s"></span></span><span class="docs-bar__value">${text}</span></div>`
    ).join('');

    /* ---------------- Sources ---------------- */
    $('#sources').innerHTML = SOURCES.map((s, i) => `<div class="docs-card docs-source" data-reveal style="--d:${(i % 3 * .06).toFixed(2)}s">
        <h3><svg class="icon"><use href="${ICONS}#i-book"/></svg>${esc(s.title)}</h3>
        <ul>${s.links.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener"><svg class="icon"><use href="${ICONS}#i-arrow-up-right"/></svg><span>${esc(t)}</span></a></li>`).join('')}</ul>
    </div>`).join('');

    /* ---------------- Contents: active section + sliding pill ---------------- */
    const toc = $('#docsToc');
    const links = [...toc.querySelectorAll('a')];
    const pill = document.createElement('li');
    pill.className = 'docs-toc__indicator';
    pill.setAttribute('aria-hidden', 'true');
    toc.prepend(pill);
    let activeLink = null, pillY = null;

    function movePill(link, animate = true) {
        if (!link || link.offsetParent === null) return;
        const y = link.offsetTop;
        pill.style.height = link.offsetHeight + 'px';
        pill.style.transform = `translateY(${y}px)`;
        if (animate && pillY !== null && !reduceMotion) {
            const mid = (pillY + y) / 2;
            pill.animate([                                   // squash & stretch, like the main nav
                { transform: `translateY(${pillY}px) scaleX(1)` },
                { transform: `translateY(${mid}px) scaleX(.86)`, offset: .45 },
                { transform: `translateY(${y + 3}px) scaleX(1.05)`, offset: .75 },
                { transform: `translateY(${y}px) scaleX(1)` }
            ], { duration: 560, easing: 'cubic-bezier(.45, 0, .2, 1)' });
        }
        pillY = y;
        pill.style.opacity = '1';
    }

    function setActive(link) {
        if (!link || link === activeLink) return;
        activeLink = link;
        links.forEach(a => a.classList.toggle('is-active', a === link));
        movePill(link);
        // Phones: keep the active chip visible in the horizontal strip
        const strip = toc.parentElement;
        if (strip.scrollWidth > strip.clientWidth) {
            strip.scrollTo({ left: link.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    }

    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver(entries => entries.forEach(e => {
            if (e.isIntersecting) setActive(links.find(a => a.getAttribute('href') === '#' + e.target.id));
        }), { rootMargin: '-35% 0px -60% 0px' });
        $$('[data-docs-section]').forEach(s => spy.observe(s));
    }
    setActive(links[0]);
    window.addEventListener('resize', () => movePill(activeLink, false));
    if (document.fonts) document.fonts.ready.then(() => movePill(activeLink, false));
})();
