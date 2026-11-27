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

    // Raw label -> treatment
    const treatments = {
        'Apple___Apple_scab': 'Use fungicides like captan or mancozeb, and prune infected branches.',
        'Apple___Black_rot': 'Apply fungicides such as thiophanate-methyl and avoid overhead irrigation.',
        'Apple___Cedar_apple_rust': 'Use fungicides like myclobutanil and remove nearby juniper trees.',
        'Apple___healthy': 'No treatment required.',
        'Blueberry___healthy': 'No treatment required.',
        'Cherry_(including_sour)___Powdery_mildew': 'Use fungicides like sulfur or copper-based products.',
        'Cherry_(including_sour)___healthy': 'No treatment required.',
        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': 'Use fungicides such as azoxystrobin and manage crop residue.',
        'Corn_(maize)___Common_rust_': 'Apply fungicides and plant resistant hybrids.',
        'Corn_(maize)___Northern_Leaf_Blight': 'Apply foliar fungicides and rotate crops.',
        'Corn_(maize)___healthy': 'No treatment required.',
        'Grape___Black_rot': 'Prune and remove diseased plant material, then apply fungicides.',
        'Grape___Esca_(Black_Measles)': 'Prune out infected areas and apply fungicides.',
        'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 'Apply fungicides and maintain good airflow around vines.',
        'Grape___healthy': 'No treatment required.',
        'Orange___Haunglongbing_(Citrus_greening)': 'No cure is available. Manage the insect vector with pesticides and remove infected trees.',
        'Peach___Bacterial_spot': 'Apply copper-based sprays and avoid overhead irrigation.',
        'Peach___healthy': 'No treatment required.',
        'Pepper,_bell___Bacterial_spot': 'Use resistant varieties and apply copper-based bactericides.',
        'Pepper,_bell___healthy': 'No treatment required.',
        'Potato___Early_blight': 'Apply fungicides and practise crop rotation.',
        'Potato___Late_blight': 'Use fungicides like mancozeb and ensure proper field drainage.',
        'Potato___healthy': 'No treatment required.',
        'Raspberry___healthy': 'No treatment required.',
        'Soybean___healthy': 'No treatment required.',
        'Squash___Powdery_mildew': 'Apply sulfur-based or potassium bicarbonate fungicides.',
        'Strawberry___Leaf_scorch': 'Remove infected leaves and apply fungicides.',
        'Strawberry___healthy': 'No treatment required.',
        'Tomato___Bacterial_spot': 'Apply copper-based sprays and avoid overhead irrigation.',
        'Tomato___Early_blight': 'Apply fungicides and keep good plant spacing for airflow.',
        'Tomato___Late_blight': 'Use fungicides and destroy infected plants immediately.',
        'Tomato___Leaf_Mold': 'Apply fungicides and ensure proper ventilation.',
        'Tomato___Septoria_leaf_spot': 'Use fungicides and rotate crops annually.',
        'Tomato___Spider_mites Two-spotted_spider_mite': 'Apply insecticidal soap or miticides.',
        'Tomato___Target_Spot': 'Apply fungicides and remove infected leaves.',
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': 'There is no cure. Control whiteflies and use resistant varieties.',
        'Tomato___Tomato_mosaic_virus': 'There is no cure. Remove infected plants and disinfect tools.',
        'Tomato___healthy': 'No treatment required.'
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
        detect();
    }));

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
            render(ranked);
            setReportState('Complete', 'is-ready');
            save({ result: ranked.slice(0, 3).map(({ p, label }) => ({ p, label })) });
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

    function render(ranked) {
        const top = ranked[0];
        const info = formatLabel(top.label);
        const pct = v => {
            const p = v * 100;
            return (p >= 99.95 ? '>99.9' : p < 0.05 ? '<0.1' : p.toFixed(1)) + '%';
        };

        reportEmpty.hidden = true;
        reportResult.hidden = false;

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

        const treatmentBox = document.querySelector('.treatment');
        revealBlock(treatmentBox, t);
        const treatmentEl = $('treatmentText');
        t = generate(treatmentEl, treatments[top.label] || 'No treatment information available.', t + 0.2, 0.06);
        if (!reduceMotion && !instant) {           // blinking caret while the treatment is "being written"
            const caret = document.createElement('span');
            caret.className = 'gen-caret';
            caret.style.setProperty('--caret-end', (t + 0.6).toFixed(2) + 's');
            treatmentEl.append(caret);
        }
        t += 0.3;

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
            render(saved.result);
            instant = false;
            setReportState('Complete', 'is-ready');
        }
    }

    updateRunButton();
    restore();
})();
