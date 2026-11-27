/* =========================================================
   CropCure — diagnosis tool
   Loads the TF.js graph model, takes a photo (upload, drag &
   drop or a sample), predicts one of 38 PlantVillage classes
   and shows a readable result with a treatment.
   ========================================================= */
(() => {
    'use strict';

    // Model output index -> raw PlantVillage label. Order must match the model.
    const classes = [
        'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
        'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
        'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
        'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
        'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
        'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight',
        'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy',
        'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy',
        'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold',
        'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
    ];

    // Raw label -> treatment plan { summary, steps, products } — see model/treatments.js
    const treatments = window.CROPCURE_TREATMENTS || {};

    /* ---------------------------------------------------------
       Sample results, computed in advance by this same model
       (top 3 per sample photo). Lets the samples answer instantly
       while the ~124 MB model is still downloading. If you replace
       the model or the sample photos, regenerate these.
    --------------------------------------------------------- */
    const SAMPLE_RESULTS = {
        'demo/tomato-late-blight.jpg': [
            { label: 'Tomato___Late_blight', p: 0.998 },
            { label: 'Pepper,_bell___healthy', p: 0.001774 },
            { label: 'Tomato___Early_blight', p: 0.0001667 }],
        'demo/apple-scab.jpg': [
            { label: 'Apple___Apple_scab', p: 1 },
            { label: 'Peach___Bacterial_spot', p: 8.926e-8 },
            { label: 'Apple___healthy', p: 8.166e-8 }],
        'demo/corn-common-rust.jpg': [
            { label: 'Corn_(maize)___Common_rust_', p: 1 },
            { label: 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', p: 3.368e-23 },
            { label: 'Apple___Apple_scab', p: 4.136e-25 }],
        'demo/grape-black-rot.jpg': [
            { label: 'Grape___Black_rot', p: 1 },
            { label: 'Grape___Esca_(Black_Measles)', p: 3.144e-10 },
            { label: 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', p: 7.837e-14 }],
        'demo/potato-early-blight.jpg': [
            { label: 'Potato___Early_blight', p: 0.9999 },
            { label: 'Strawberry___Leaf_scorch', p: 0.00003729 },
            { label: 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', p: 0.00001858 }],
        'demo/strawberry-healthy.jpg': [
            { label: 'Strawberry___healthy', p: 1 },
            { label: 'Pepper,_bell___healthy', p: 0.00001669 },
            { label: 'Blueberry___healthy', p: 0.000006307 }]
    };

    /* ---------------------------------------------------------
       Readable names: "Corn_(maize)___Common_rust_" -> Corn (maize) · Common rust
    --------------------------------------------------------- */
    const CROP_NAMES = {
        'Pepper,_bell': 'Bell pepper',
        'Cherry_(including_sour)': 'Cherry',
        'Corn_(maize)': 'Corn (maize)'
    };
    const CONDITION_NAMES = {
        'Cercospora_leaf_spot Gray_leaf_spot': 'Cercospora leaf spot (gray leaf spot)',
        'Spider_mites Two-spotted_spider_mite': 'Spider mites (two-spotted)',
        'Haunglongbing_(Citrus_greening)': 'Huanglongbing (citrus greening)',
        'Esca_(Black_Measles)': 'Esca (black measles)',
        'Leaf_blight_(Isariopsis_Leaf_Spot)': 'Leaf blight (Isariopsis leaf spot)',
        'Tomato_Yellow_Leaf_Curl_Virus': 'Yellow leaf curl virus',
        'Tomato_mosaic_virus': 'Mosaic virus'
    };
    const tidy = s => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const sentence = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    function formatLabel(raw) {
        const [crop, cond] = raw.split('___');
        return {
            crop: CROP_NAMES[crop] || tidy(crop),
            condition: CONDITION_NAMES[cond] || sentence(tidy(cond)),
            healthy: cond === 'healthy'
        };
    }

    /* ---------------------------------------------------------
       Elements
    --------------------------------------------------------- */
    const $ = id => document.getElementById(id);
    const statusEl = $('modelTag');
    const statusText = statusEl.querySelector('.status__text');
    const dropzone = $('dropzone');
    const input = $('imageInput');
    const preview = $('imageContainer');
    const previewImg = $('previewImg');
    const previewName = $('previewName');
    const emptyState = dropzone.querySelector('.dropzone__empty');
    const runBtn = $('runBtn');
    const runLabel = $('runLabel');
    const resetBtn = $('resetBtn');
    const reportState = $('reportState');
    const reportEmpty = $('reportEmpty');
    const reportResult = $('reportResult');
    const samples = [...document.querySelectorAll('.sample')];

    let model = null;
    let currentImg = null;
    let busy = false;

    /* ---------------------------------------------------------
       Saved progress (localStorage): the current image, which
       sample was picked and the last result survive leaving the
       page. Uploaded photos are stored as a downscaled JPEG.
    --------------------------------------------------------- */
    const STORE_KEY = 'cropcure:diagnosis:v1';
    let saved = {};

    function loadSaved() {
        try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
    }

    function save(patch) {
        saved = { ...saved, ...patch };
        try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch { /* storage full or blocked */ }
    }

    function clearSaved() {
        saved = {};
        try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    }

    // Shrink an uploaded photo so it fits comfortably in localStorage
    async function toStorableDataURL(src, max = 768) {
        const img = await loadImage(src);
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';                       // flatten transparency for JPEG
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.88);
    }

    /* ---------------------------------------------------------
       Model
    --------------------------------------------------------- */
    const modelReady = (async () => {
        try {
            model = await tf.loadGraphModel('./tfjs_model/model.json', {
                onProgress: p => { statusText.textContent = `Loading model ${Math.round(p * 100)}%`; }
            });
            // Warm-up so the first real prediction is fast
            tf.tidy(() => model.predict(tf.zeros([1, 256, 256, 3])));
            statusEl.classList.add('is-ready');
            statusText.textContent = 'Model ready';
            updateRunButton();
            return model;
        } catch (err) {
            console.error('Failed to load model:', err);
            statusEl.classList.add('is-error');
            statusText.textContent = 'Model failed to load';
            throw err;
        }
    })();

    function setReportState(text, cls) {
        reportState.textContent = text;
        reportState.className = 'tag' + (cls ? ' ' + cls : '');
    }

    function updateRunButton() {
        runBtn.disabled = !currentImg || busy;
        runLabel.textContent = busy ? 'Analysing…' : (model ? 'Run diagnosis' : 'Run diagnosis (model loading…)');
    }

    /* ---------------------------------------------------------
       Image intake: upload, drag & drop, samples
    --------------------------------------------------------- */
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async function showImage(src, name) {
        const img = await loadImage(src);
        currentImg = img;
        previewImg.src = src;
        previewImg.alt = name;
        previewName.textContent = name;
        preview.hidden = false;
        emptyState.hidden = true;
        dropzone.classList.add('has-image');
        resetBtn.hidden = false;
        reportEmpty.hidden = false;
        reportResult.hidden = true;
        setReportState('Ready', 'is-ready');
        updateRunButton();
    }

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            shake();
            return;
        }
        samples.forEach(s => s.classList.remove('is-active'));
        const reader = new FileReader();
        reader.onload = async e => {
            const src = await toStorableDataURL(e.target.result);
            await showImage(src, file.name);
            save({ src, name: file.name, sample: null, result: null });
        };
        reader.readAsDataURL(file);
    }

    function reset() {
        clearSaved();
        currentImg = null;
        input.value = '';
        preview.hidden = true;
        emptyState.hidden = false;
        dropzone.classList.remove('has-image');
        resetBtn.hidden = true;
        reportEmpty.hidden = false;
        reportResult.hidden = true;
        samples.forEach(s => s.classList.remove('is-active'));
        setReportState('Waiting');
        updateRunButton();
    }

    function shake() {
        dropzone.classList.remove('is-shake');
        void dropzone.offsetWidth;
        dropzone.classList.add('is-shake');
    }

    input.addEventListener('change', () => handleFile(input.files[0]));

    dropzone.addEventListener('click', () => { if (!currentImg) input.click(); });
    dropzone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });

    ['dragenter', 'dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
        e.preventDefault();
        dropzone.classList.add('is-dragover');
    }));
    ['dragleave', 'dragend', 'drop'].forEach(evt => dropzone.addEventListener(evt, e => {
        e.preventDefault();
        if (evt === 'dragleave' && dropzone.contains(e.relatedTarget)) return;
        dropzone.classList.remove('is-dragover');
    }));
    dropzone.addEventListener('drop', e => {
        const file = e.dataTransfer && e.dataTransfer.files[0];
        handleFile(file);
    });

    samples.forEach(btn => btn.addEventListener('click', async () => {
        if (busy) return;
        samples.forEach(s => s.classList.toggle('is-active', s === btn));
        const name = btn.dataset.name + ' (sample)';
        await showImage(btn.dataset.src, name);
        save({ src: btn.dataset.src, name, sample: btn.dataset.src, result: null });
        // Live model ready? run it. Still downloading? answer instantly from the stored result.
        if (model) detect();
        else instantSample(btn.dataset.src);
    }));

    async function instantSample(src) {
        const ranked = SAMPLE_RESULTS[src];
        if (!ranked) { detect(); return; }
        busy = true;
        updateRunButton();
        setReportState('Analysing', 'is-working');
        dropzone.classList.add('is-scanning');
        await new Promise(r => setTimeout(r, 700));     // brief scan so the result doesn't just flash in
        dropzone.classList.remove('is-scanning');
        busy = false;
        updateRunButton();
        render(ranked, 'precomputed');
        setReportState('Complete', 'is-ready');
        save({ result: ranked, source: 'precomputed' });
    }

    resetBtn.addEventListener('click', e => { e.stopPropagation(); reset(); });
    runBtn.addEventListener('click', detect);

    /* ---------------------------------------------------------
       Prediction
    --------------------------------------------------------- */
    async function detect() {
        if (!currentImg) { shake(); return; }
        if (busy) return;
        busy = true;
        updateRunButton();
        setReportState('Analysing', 'is-working');
        dropzone.classList.add('is-scanning');

        try {
            await modelReady;
            const started = performance.now();
            const probs = await tf.tidy(() => model.predict(
                tf.browser.fromPixels(currentImg)
                    .resizeNearestNeighbor([256, 256])   // model input size; 0–255 values, no normalisation
                    .toFloat()
                    .expandDims()
            )).data();

            // Keep the scan animation visible for a moment so the result doesn't just flash in
            const wait = 900 - (performance.now() - started);
            if (wait > 0) await new Promise(r => setTimeout(r, wait));

            const ranked = [...probs]
                .map((p, i) => ({ p, label: classes[i] }))
                .sort((a, b) => b.p - a.p);
            render(ranked, 'live');
            setReportState('Complete', 'is-ready');
            save({ result: ranked.slice(0, 3).map(({ p, label }) => ({ p, label })), source: 'live' });
        } catch (err) {
            console.error(err);
            setReportState('Error');
        } finally {
            busy = false;
            dropzone.classList.remove('is-scanning');
            updateRunButton();
        }
    }

    /* ---------------------------------------------------------
       "AI is writing" effect: text streams in word by word — each
       word fades in muted, then settles into its real colour.
       Returns the time (s) at which the last word starts.
    --------------------------------------------------------- */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let instant = false;                          // true while restoring a saved result

    function generate(el, text, start, step) {
        el.replaceChildren();
        if (reduceMotion || instant) { el.textContent = text; return start; }
        let i = 0;
        text.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { el.append(part); return; }
            const w = document.createElement('span');
            w.className = 'gen-word';
            w.style.animationDelay = (start + i++ * step).toFixed(3) + 's';
            w.textContent = part;
            el.append(w);
        });
        return start + i * step;
    }

    function revealBlock(el, at) {
        el.classList.remove('gen-block');
        if (instant) return;
        void el.offsetWidth;                       // restart the animation on re-runs
        el.style.animationDelay = at.toFixed(3) + 's';
        el.classList.add('gen-block');
    }

    function render(ranked, source = 'live') {
        const top = ranked[0];
        const info = formatLabel(top.label);

        const sourceEl = $('resultSource');
        sourceEl.textContent = source === 'precomputed'
            ? 'Instant sample result, computed in advance by this same model. Upload your own photo to run it live.'
            : 'Analysed live in your browser.';
        sourceEl.classList.toggle('is-precomputed', source === 'precomputed');
        const pct = v => {
            const p = v * 100;
            return (p >= 99.95 ? '>99.9' : p < 0.05 ? '<0.1' : p.toFixed(1)) + '%';
        };

        reportEmpty.hidden = true;
        reportResult.hidden = false;
        reportScroll.toTop();                        // desktop: report scrolls inside the card

        let t = 0;
        t = generate($('resultCrop'), info.crop, t, 0.05) + 0.1;
        t = generate($('resultCondition'), info.condition, t, 0.09) + 0.15;

        const badge = $('resultBadge');
        badge.textContent = info.healthy ? 'Healthy leaf' : 'Disease detected';
        badge.classList.toggle('is-healthy', info.healthy);
        revealBlock(badge, t);
        t += 0.2;

        revealBlock(document.querySelector('.confidence'), t);
        $('resultConfidence').textContent = pct(top.p);
        const fill = $('confidenceFill');
        fill.style.width = '0';
        const fillAt = t;
        setTimeout(() => { fill.style.width = (top.p * 100).toFixed(1) + '%'; }, reduceMotion || instant ? 0 : fillAt * 1000);
        t += 0.3;

        // ---- Treatment plan: summary → action plan → recommended products ----
        const plan = treatments[top.label];
        const isHealthyPlan = !!(plan && plan.healthy);
        const treatmentBox = document.querySelector('.treatment');
        treatmentBox.classList.toggle('is-healthy', isHealthyPlan);
        $('treatmentLabelText').textContent = isHealthyPlan ? 'Keep it healthy' : 'Recommended treatment';
        revealBlock(treatmentBox, t);

        const treatmentEl = $('treatmentText');
        t = generate(treatmentEl, plan ? plan.summary : 'No treatment information available.', t + 0.2, 0.035);
        if (!reduceMotion && !instant) {           // blinking caret while the summary is "being written"
            const caret = document.createElement('span');
            caret.className = 'gen-caret';
            caret.style.setProperty('--caret-end', (t + 0.4).toFixed(2) + 's');
            treatmentEl.append(caret);
        }
        t += 0.25;

        // Action plan — each step streams in after the previous one
        const stepsWrap = $('treatmentSteps');
        const stepsList = stepsWrap.querySelector('ol');
        const steps = (plan && plan.steps) || [];
        stepsList.replaceChildren();
        stepsWrap.hidden = !steps.length;
        if (steps.length) {
            revealBlock(stepsWrap, t);
            t += 0.15;
            steps.forEach(text => {
                const li = document.createElement('li');
                const span = document.createElement('span');
                li.append(span);
                stepsList.append(li);
                revealBlock(li, t);
                t = generate(span, text, t, 0.018) + 0.08;
            });
        }

        // Recommended products — active ingredient, type and example brands
        const productsWrap = $('treatmentProducts');
        const productsList = productsWrap.querySelector('ul');
        const products = (plan && plan.products) || [];
        productsList.replaceChildren();
        productsWrap.hidden = !products.length;
        if (products.length) {
            t += 0.1;
            revealBlock(productsWrap, t);
            t += 0.15;
            products.forEach(prod => {
                const li = document.createElement('li');
                li.className = 'product';
                const name = document.createElement('strong');
                name.className = 'product__name';
                name.textContent = prod.name;
                const type = document.createElement('span');
                type.className = 'product__type';
                type.textContent = prod.type;
                const brands = document.createElement('span');
                brands.className = 'product__brands';
                brands.textContent = 'e.g. ' + prod.brands;
                li.append(name, type, brands);
                productsList.append(li);
                revealBlock(li, t);
                t += 0.08;
            });
        }
        t += 0.2;

        revealBlock(document.querySelector('.alternatives__label'), t);
        const list = $('resultAlternatives');
        list.replaceChildren(...ranked.slice(1, 3).map(({ p, label }) => {
            const f = formatLabel(label);
            const li = document.createElement('li');
            const name = document.createElement('span');
            const val = document.createElement('span');
            t = generate(name, `${f.crop} · ${f.condition}`, t, 0.04);
            generate(val, pct(p), t, 0);
            li.append(name, val);
            t += 0.1;
            return li;
        }));

        // On narrow screens the report sits below the uploader — bring it into view
        if (!instant && window.matchMedia('(max-width: 960px)').matches && window.cropcure) {
            window.cropcure.lenis.scrollTo(document.querySelector('.report'), { offset: -90 });
        }
    }

    /* Restore saved progress when the page opens (incl. back/forward) */
    async function restore() {
        saved = loadSaved();
        if (!saved.src) return;
        try {
            await showImage(saved.src, saved.name || 'Leaf photo');
        } catch {
            clearSaved();                          // e.g. a sample file that no longer exists
            return;
        }
        samples.forEach(s => s.classList.toggle('is-active', s.dataset.src === saved.sample));
        if (Array.isArray(saved.result) && saved.result.length && classes.includes(saved.result[0].label)) {
            instant = true;
            render(saved.result, saved.source || 'live');
            instant = false;
            setReportState('Complete', 'is-ready');
        }
    }

    /* ---------------------------------------------------------
       Report panel scrolling (desktop card layout only): its own
       Lenis instance for smooth scrolling + a custom overlay
       scrollbar that matches the page one (drag, click track,
       fades when idle). The page Lenis ignores wheel events here
       because #reportBody has data-lenis-prevent.
    --------------------------------------------------------- */
    function setupReportScroll() {
        const body = $('reportBody');
        const inner = body && body.firstElementChild;
        const bar = $('reportScrollbar');
        const noop = { toTop() { if (body) body.scrollTop = 0; } };
        if (!body || !inner || !bar) return noop;

        const thumb = bar.firstElementChild;
        const desktop = window.matchMedia('(min-width: 961px)');
        let smooth = null, rafId = 0, hideTimer, dragging = false, grab = 0;

        const metrics = () => {
            const view = body.clientHeight;
            const max = body.scrollHeight - view;
            const track = bar.clientHeight;
            const h = Math.max(36, (track * view) / Math.max(body.scrollHeight, 1));
            return { max, h, travel: track - h };
        };

        function sync() {
            if (!desktop.matches) { bar.hidden = true; return; }
            if (body.scrollHeight - body.clientHeight <= 1) { bar.hidden = true; return; }
            bar.hidden = false;                                // must be visible before measuring the track
            bar.style.top = body.offsetTop + 'px';             // align the track with the scroll area
            bar.style.height = body.clientHeight + 'px';
            const { max, h, travel } = metrics();
            thumb.style.height = h + 'px';
            thumb.style.transform = `translateY(${(body.scrollTop / max) * travel}px)`;
        }

        function flash() {
            bar.classList.add('is-visible');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => bar.classList.remove('is-visible'), 1200);
        }

        const scrollToY = y => {
            const { max, travel } = metrics();
            const top = Math.min(1, Math.max(0, y / travel)) * max;
            if (smooth) smooth.scrollTo(top);
            else body.scrollTo({ top });
        };

        thumb.addEventListener('pointerdown', e => {
            dragging = true;
            grab = e.clientY - thumb.getBoundingClientRect().top;
            thumb.setPointerCapture(e.pointerId);
            bar.classList.add('is-dragging');
            e.preventDefault();
        });
        thumb.addEventListener('pointermove', e => {
            if (dragging) scrollToY(e.clientY - bar.getBoundingClientRect().top - grab);
        });
        const endDrag = () => { dragging = false; bar.classList.remove('is-dragging'); flash(); };
        thumb.addEventListener('pointerup', endDrag);
        thumb.addEventListener('pointercancel', endDrag);
        bar.addEventListener('pointerdown', e => {               // click the empty track -> jump there
            if (e.target === bar) scrollToY(e.clientY - bar.getBoundingClientRect().top - metrics().h / 2);
        });

        body.addEventListener('scroll', () => { sync(); flash(); }, { passive: true });
        body.addEventListener('pointerenter', () => { sync(); flash(); });
        new ResizeObserver(sync).observe(inner);
        new ResizeObserver(sync).observe(body);

        function setup() {
            const want = desktop.matches && window.Lenis && !reduceMotion;
            if (want && !smooth) {
                smooth = new window.Lenis({ wrapper: body, content: inner, lerp: 0.08, smoothWheel: true });
                const loop = t => { smooth.raf(t); rafId = requestAnimationFrame(loop); };
                rafId = requestAnimationFrame(loop);
            } else if (!want && smooth) {
                cancelAnimationFrame(rafId);
                smooth.destroy();
                smooth = null;
            }
            sync();
        }
        desktop.addEventListener('change', setup);
        setup();

        return {
            toTop() {
                if (smooth) smooth.scrollTo(0, { immediate: true });
                else body.scrollTop = 0;
                sync();
            }
        };
    }
    const reportScroll = setupReportScroll();

    updateRunButton();
    restore();
})();
