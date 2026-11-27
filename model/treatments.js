/* =========================================================
   CropCure — treatment plans for every class the model knows.
   Keyed by the raw PlantVillage label (must match `classes` in
   script.js).

   Each entry:
     summary  — what is happening and how urgent it is
     steps    — action plan, most important first
     products — { name: active ingredient, type, brands: examples }
                (omitted for healthy leaves)

   Guidance is compiled from university extension and IPM
   programmes (e.g. UC IPM, Cornell, Penn State, NC State,
   UF/IFAS, Michigan State, Kansas State, UMN, WorldVeg).
   Brand names are examples only — availability and approved
   uses differ by country. Always follow the product label.
   ========================================================= */
window.CROPCURE_TREATMENTS = (() => {
    /* Shared product definitions (active ingredient → example brands) */
    const P = {
        mancozeb:        { name: 'Mancozeb', type: 'Fungicide', brands: 'Dithane M-45, Indofil M-45, Manzate' },
        chlorothalonil:  { name: 'Chlorothalonil', type: 'Fungicide', brands: 'Kavach, Bravo, Daconil' },
        captan:          { name: 'Captan', type: 'Fungicide', brands: 'Captaf, Captan 50 WP' },
        copperOxy:       { name: 'Copper oxychloride', type: 'Fungicide / bactericide', brands: 'Blitox-50, Cupravit' },
        copperHyd:       { name: 'Copper hydroxide', type: 'Fungicide / bactericide', brands: 'Kocide 3000, Champion' },
        bordeaux:        { name: 'Bordeaux mixture (copper sulphate + lime)', type: 'Organic fungicide', brands: 'Home-prepared 1% mix' },
        sulfur:          { name: 'Wettable sulphur', type: 'Organic fungicide', brands: 'Sulfex, Thiovit Jet, Microthiol' },
        potBicarb:       { name: 'Potassium bicarbonate', type: 'Organic fungicide', brands: 'MilStop, Kaligreen' },
        myclobutanil:    { name: 'Myclobutanil', type: 'Fungicide', brands: 'Systhane, Rally, Immunox' },
        difenoconazole:  { name: 'Difenoconazole', type: 'Fungicide', brands: 'Score' },
        hexaconazole:    { name: 'Hexaconazole', type: 'Fungicide', brands: 'Contaf Plus' },
        tebuTrifloxy:    { name: 'Tebuconazole + trifloxystrobin', type: 'Fungicide', brands: 'Nativo' },
        azoxystrobin:    { name: 'Azoxystrobin', type: 'Fungicide', brands: 'Amistar, Quadris' },
        azoxyDifeno:     { name: 'Azoxystrobin + difenoconazole', type: 'Fungicide', brands: 'Amistar Top, Quadris Top' },
        trifloxystrobin: { name: 'Trifloxystrobin', type: 'Fungicide', brands: 'Flint' },
        thiophanate:     { name: 'Thiophanate-methyl', type: 'Fungicide', brands: 'Topsin-M' },
        quinoxyfen:      { name: 'Quinoxyfen', type: 'Fungicide', brands: 'Quintec' },
        boscalidPyra:    { name: 'Boscalid + pyraclostrobin', type: 'Fungicide', brands: 'Pristine' },
        pyraclostrobin:  { name: 'Pyraclostrobin', type: 'Fungicide', brands: 'Headline' },
        azoxyPropi:      { name: 'Azoxystrobin + propiconazole', type: 'Fungicide', brands: 'Quilt Xcel' },
        propiconazole:   { name: 'Propiconazole', type: 'Fungicide', brands: 'Tilt' },
        metalaxylMz:     { name: 'Metalaxyl-M + mancozeb', type: 'Fungicide', brands: 'Ridomil Gold MZ' },
        cymoxanilMz:     { name: 'Cymoxanil + mancozeb', type: 'Fungicide', brands: 'Curzate M8' },
        mandipropamid:   { name: 'Mandipropamid', type: 'Fungicide', brands: 'Revus' },
        cyazofamid:      { name: 'Cyazofamid', type: 'Fungicide', brands: 'Ranman' },
        fluopyramTebu:   { name: 'Fluopyram + tebuconazole', type: 'Fungicide', brands: 'Luna Experience' },
        iprodione:       { name: 'Iprodione', type: 'Fungicide', brands: 'Rovral' },
        streptocycline:  { name: 'Streptomycin sulphate + tetracycline', type: 'Bactericide', brands: 'Streptocycline' },
        oxytetracycline: { name: 'Oxytetracycline', type: 'Bactericide', brands: 'Mycoshield, FireLine' },
        kasugamycin:     { name: 'Kasugamycin', type: 'Bactericide', brands: 'Kasu-B, Kasumin' },
        acibenzolar:     { name: 'Acibenzolar-S-methyl (plant defence activator)', type: 'Resistance inducer', brands: 'Actigard' },
        abamectin:       { name: 'Abamectin', type: 'Miticide', brands: 'Vertimec, Agri-Mek' },
        spiromesifen:    { name: 'Spiromesifen', type: 'Miticide / insecticide', brands: 'Oberon' },
        bifenazate:      { name: 'Bifenazate', type: 'Miticide', brands: 'Acramite, Floramite' },
        propargite:      { name: 'Propargite', type: 'Miticide', brands: 'Omite' },
        insectSoap:      { name: 'Insecticidal soap / horticultural oil', type: 'Organic', brands: 'Safer Insecticidal Soap, SunSpray oil' },
        neem:            { name: 'Neem oil (azadirachtin)', type: 'Organic', brands: 'Nimbecidine, Neemazal' },
        imidacloprid:    { name: 'Imidacloprid', type: 'Insecticide (vector control)', brands: 'Confidor, Admire' },
        thiamethoxam:    { name: 'Thiamethoxam', type: 'Insecticide (vector control)', brands: 'Actara' },
        spirotetramat:   { name: 'Spirotetramat', type: 'Insecticide (vector control)', brands: 'Movento' },
        cyantraniliprole:{ name: 'Cyantraniliprole', type: 'Insecticide (vector control)', brands: 'Exirel, Benevia' },
        pyriproxyfen:    { name: 'Pyriproxyfen (insect growth regulator)', type: 'Insecticide (vector control)', brands: 'Knack, Distance' },
        trichoderma:     { name: 'Trichoderma (biological wound protectant)', type: 'Biological', brands: 'Vinevax, Bio-Tam' },
        boronPaste:      { name: 'Boric acid wound paste', type: 'Wound protectant', brands: 'B-Lock' }
    };

    /* Prevention advice shared by healthy leaves */
    const healthy = (crop, extra) => ({
        healthy: true,
        summary: `No disease detected — this ${crop} leaf looks healthy. Keep it that way with good field hygiene and regular scouting.`,
        steps: [
            'Scout leaves weekly, especially after rain or humid spells, and act at the first spots.',
            'Water at the base of the plant in the morning so foliage dries quickly; avoid overhead irrigation.',
            'Keep good spacing and prune for airflow — most leaf diseases need long periods of wet foliage.',
            extra,
            'Remove fallen leaves and crop debris, and rotate crops where possible to break disease cycles.'
        ]
    });

    return {
        /* ------------------------------- Apple ------------------------------- */
        'Apple___Apple_scab': {
            summary: 'Apple scab (Venturia inaequalis) is a fungal disease that causes olive-brown leaf spots and corky, cracked fruit. It spreads by rain-splashed spores in cool, wet spring weather, so protection must start early.',
            steps: [
                'Rake up and destroy or shred fallen leaves in autumn — they carry next spring\'s spores.',
                'Begin protective sprays at green tip / bud break and repeat every 7–10 days through wet periods until petal fall.',
                'Prune the canopy open so leaves dry quickly after rain.',
                'Rotate fungicide groups (protectant + systemic) to avoid resistance; plant scab-resistant varieties for new trees.'
            ],
            products: [P.captan, P.mancozeb, P.myclobutanil, P.difenoconazole, P.trifloxystrobin]
        },
        'Apple___Black_rot': {
            summary: 'Black rot (Botryosphaeria obtusa) causes purple-edged "frog-eye" leaf spots, limb cankers and black, rotting fruit. The fungus survives in dead wood and mummified fruit, so sanitation is the main control.',
            steps: [
                'Prune out cankers, dead branches and twigs well below visible damage and remove them from the orchard.',
                'Pick off and destroy all mummified fruit left on the tree or ground.',
                'Protect fruit and leaves from bloom through summer with a fungicide programme, especially in warm, wet weather.',
                'Avoid wounding bark and keep trees vigorous with balanced feeding and watering.'
            ],
            products: [P.captan, P.thiophanate, P.trifloxystrobin]
        },
        'Apple___Cedar_apple_rust': {
            summary: 'Cedar apple rust (Gymnosporangium juniperi-virginianae) causes bright orange-yellow leaf spots. It needs juniper or red cedar trees nearby to complete its life cycle, and infections happen in spring.',
            steps: [
                'Remove nearby junipers / red cedars where practical, or cut off the orange, jelly-like galls in late winter.',
                'Apply protective sprays from pink bud until about 30 days after petal fall during wet spring weather.',
                'Choose rust-resistant apple varieties for new plantings.',
                'Rake and remove heavily infected leaves to reduce stress on the tree.'
            ],
            products: [P.myclobutanil, P.mancozeb, P.difenoconazole]
        },
        'Apple___healthy': healthy('apple', 'Prune in late winter to keep the canopy open, and apply a protective spray at green tip in scab-prone regions.'),

        /* ----------------------------- Blueberry ----------------------------- */
        'Blueberry___healthy': healthy('blueberry', 'Keep soil acidic (pH 4.5–5.5) and mulched; prune out old, weak canes each winter.'),

        /* ------------------------------ Cherry ------------------------------- */
        'Cherry_(including_sour)___Powdery_mildew': {
            summary: 'Powdery mildew (Podosphaera cerasi) forms white, powdery patches on leaves and shoots and can spread to fruit. It thrives in warm, humid weather and cannot be eradicated once established — prevention is key.',
            steps: [
                'Start protective sprays at the first signs or as soon as shoots begin to grow in high-risk seasons.',
                'Rotate between fungicide groups and limit any one group to two applications per season — resistance is common.',
                'Prune for open canopies and remove water sprouts and root suckers, which are often infected first.',
                'Avoid excess nitrogen, which produces soft, highly susceptible growth.'
            ],
            products: [P.sulfur, P.myclobutanil, P.quinoxyfen, P.trifloxystrobin, P.potBicarb]
        },
        'Cherry_(including_sour)___healthy': healthy('cherry', 'Prune after harvest to keep the canopy open and remove root suckers and water sprouts.'),

        /* --------------------------- Corn (maize) ---------------------------- */
        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
            summary: 'Gray leaf spot (Cercospora zeae-maydis) produces long, rectangular grey-tan lesions between leaf veins. Severe infections before grain fill reduce yield, especially in humid weather and continuous maize fields.',
            steps: [
                'Plant hybrids with good gray leaf spot resistance ratings.',
                'Rotate away from maize for at least one season and bury or break down infected residue.',
                'If lesions are reaching the leaves below the ear by tasselling, apply a foliar fungicide at VT–R1 (tasselling to silking) — the most effective window.',
                'Scout fields from mid-season onwards, especially after long humid spells.'
            ],
            products: [P.azoxyPropi, P.pyraclostrobin, P.azoxystrobin, P.propiconazole]
        },
        'Corn_(maize)___Common_rust_': {
            summary: 'Common rust (Puccinia sorghi) produces small, cinnamon-brown powdery pustules on both leaf surfaces. Cool temperatures and heavy dew favour it; most hybrids tolerate it, but early, severe infections cut yield.',
            steps: [
                'Grow rust-resistant hybrids — the most reliable and economical control.',
                'Scout from knee-high onwards; a fungicide is usually only worthwhile if pustules are widespread before tasselling on a susceptible hybrid.',
                'If needed, spray at the first signs of spread on the upper leaves and repeat per label in continuing cool, wet weather.',
                'Plant early where possible so the crop matures before rust builds up.'
            ],
            products: [P.azoxyPropi, P.pyraclostrobin, P.propiconazole, P.mancozeb]
        },
        'Corn_(maize)___Northern_Leaf_Blight': {
            summary: 'Northern leaf blight (Exserohilum turcicum) causes long, cigar-shaped grey-green lesions. It survives on crop residue and spreads in moderate temperatures with long dew periods; infection before silking can reduce yield significantly.',
            steps: [
                'Plant resistant hybrids (Ht genes or strong partial resistance).',
                'Rotate crops and manage residue — tillage or decomposition reduces the overwintering fungus.',
                'Apply a foliar fungicide around VT–R1 if lesions are present on the ear leaf or above on susceptible hybrids.',
                'Avoid very dense planting in humid, low-lying fields.'
            ],
            products: [P.azoxyPropi, P.pyraclostrobin, P.propiconazole, P.mancozeb]
        },
        'Corn_(maize)___healthy': healthy('maize', 'Choose hybrids with strong leaf-disease resistance ratings and rotate away from continuous maize.'),

        /* ------------------------------- Grape ------------------------------- */
        'Grape___Black_rot': {
            summary: 'Black rot (Guignardia bidwellii) causes tan leaf spots with dark borders and turns berries into hard, black, shrivelled "mummies". Warm, wet weather from bloom to bunch closure is the high-risk period.',
            steps: [
                'Remove all mummified berries from vines and the ground, and prune out infected canes during dormancy.',
                'Spray from early shoot growth (about 15 cm) through 4–5 weeks after bloom, when berries are most susceptible.',
                'Train and thin shoots to open the canopy so leaves and clusters dry quickly.',
                'Keep weeds under control beneath the vines to reduce humidity.'
            ],
            products: [P.mancozeb, P.myclobutanil, P.azoxystrobin, P.captan, P.tebuTrifloxy]
        },
        'Grape___Esca_(Black_Measles)': {
            summary: 'Esca (black measles) is a trunk disease caused by wood-rotting fungi that enter through pruning wounds. Leaves develop "tiger-stripe" patterns and berries get dark spots. Infected wood cannot be cured with sprays, so the focus is on protecting new wounds.',
            steps: [
                'Prune late in the dormant season (or double-prune) — wounds heal faster close to bud break.',
                'Protect fresh pruning wounds within 24 hours with a wound sealant, biological protectant or registered fungicide; reapply if rain follows.',
                'Cut out infected arms and trunks 20–25 cm below visibly stained wood and remove the wood from the vineyard; retrain a new trunk from a healthy shoot.',
                'Mark symptomatic vines and prune them last, disinfecting tools between vines.'
            ],
            products: [P.thiophanate, P.trichoderma, P.boronPaste]
        },
        'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
            summary: 'Isariopsis leaf spot (Pseudocercospora vitis) produces dark, angular spots that can merge and cause early leaf drop. It is usually minor in well-managed vineyards, but warm, humid weather can make it severe.',
            steps: [
                'Improve airflow with shoot positioning, leaf thinning and good row spacing.',
                'Remove and destroy fallen infected leaves after the season.',
                'Spray a protectant fungicide at the first spots and repeat per label during humid weather — routine sprays for other grape diseases usually control it too.',
                'Avoid excess nitrogen and keep weeds down under the canopy.'
            ],
            products: [P.mancozeb, P.copperOxy, P.difenoconazole, P.bordeaux]
        },
        'Grape___healthy': healthy('grape', 'Position shoots and thin leaves around clusters for airflow, and protect pruning wounds in winter.'),

        /* ------------------------------ Orange ------------------------------- */
        'Orange___Haunglongbing_(Citrus_greening)': {
            summary: 'Huanglongbing (citrus greening) is a bacterial disease spread by the Asian citrus psyllid. Leaves show blotchy, asymmetric yellowing and fruit stays small, green and bitter. There is no cure — the goal is to stop it spreading.',
            steps: [
                'Remove and destroy confirmed infected trees — they are a source of bacteria for psyllids to spread.',
                'Control the psyllid vector, especially on new flushes, rotating insecticide groups because resistance has been reported.',
                'Plant only certified disease-free nursery trees; protect young trees with netting or individual covers.',
                'Keep remaining trees vigorous with balanced fertilisation (including micronutrients) and good irrigation.',
                'Report suspected cases to your local agriculture department — it is a regulated disease in many regions.'
            ],
            products: [P.imidacloprid, P.thiamethoxam, P.cyantraniliprole, P.insectSoap]
        },

        /* ------------------------------- Peach ------------------------------- */
        'Peach___Bacterial_spot': {
            summary: 'Bacterial spot (Xanthomonas arboricola pv. pruni) causes small angular leaf spots that fall out ("shot holes"), early leaf drop and pitted fruit. Warm, windy, wet weather spreads it; sprays only suppress it, so combine them with good cultivation.',
            steps: [
                'Plant tolerant varieties and avoid sandy, stressed sites — vigorous trees are less susceptible.',
                'Apply copper from late dormancy to shuck split; after bloom use only copper products labelled for foliage, at low rates, and watch for leaf burn.',
                'Alternate or combine copper with oxytetracycline during the season to slow resistance.',
                'Avoid excess nitrogen and prune to improve air movement; plant windbreaks in exposed orchards.'
            ],
            products: [P.copperHyd, P.oxytetracycline, P.copperOxy]
        },
        'Peach___healthy': healthy('peach', 'Apply a dormant copper spray in leaf-curl or bacterial-spot regions, and prune for an open-centre canopy.'),

        /* ---------------------------- Bell pepper ---------------------------- */
        'Pepper,_bell___Bacterial_spot': {
            summary: 'Bacterial spot (Xanthomonas spp.) causes small, water-soaked leaf spots that turn brown, leaf drop and scabby fruit. It spreads quickly by splashing water and handling wet plants, and is very hard to stop once established.',
            steps: [
                'Use certified disease-free seed and transplants, and resistant varieties (BLS resistance genes).',
                'Remove badly infected plants and avoid working in the crop while foliage is wet.',
                'Apply copper combined with mancozeb preventively every 7–10 days in warm, wet weather.',
                'Use drip irrigation, and rotate away from pepper and tomato for 2–3 years.'
            ],
            products: [P.copperHyd, P.mancozeb, P.streptocycline, P.acibenzolar]
        },
        'Pepper,_bell___healthy': healthy('bell pepper', 'Use disease-free seed and transplants and avoid overhead watering — bacterial spot spreads by water splash.'),

        /* ------------------------------ Potato ------------------------------- */
        'Potato___Early_blight': {
            summary: 'Early blight (Alternaria solani) causes brown leaf spots with concentric "target" rings, starting on older leaves. It weakens plants and reduces tuber yield, especially when plants are stressed or nutrient-deficient.',
            steps: [
                'Keep plants well fed (adequate nitrogen and potassium) and watered — stressed plants are more susceptible.',
                'Begin protectant sprays when the first spots appear or when canopies close, and repeat every 7–14 days depending on weather.',
                'Rotate fungicide groups; alternate protectants with systemic products.',
                'Rotate away from potato and tomato for 2–3 years and destroy infected crop debris after harvest.'
            ],
            products: [P.mancozeb, P.chlorothalonil, P.azoxystrobin, P.difenoconazole, P.boscalidPyra]
        },
        'Potato___Late_blight': {
            summary: 'Late blight (Phytophthora infestans) is a fast, destructive disease — dark, water-soaked lesions with white fuzzy growth underneath can destroy a field within days in cool, wet weather. Act immediately.',
            steps: [
                'Remove and destroy infected plants at once (bag or bury them — do not compost) to slow the spread.',
                'Spray the rest of the crop immediately and every 5–7 days while the weather stays cool and wet, alternating product groups.',
                'Hill soil well over tubers, and destroy vines 2–3 weeks before harvest so spores don\'t reach the tubers.',
                'Use certified disease-free seed potatoes and destroy cull piles and volunteer plants.'
            ],
            products: [P.metalaxylMz, P.cymoxanilMz, P.mandipropamid, P.cyazofamid, P.mancozeb, P.chlorothalonil]
        },
        'Potato___healthy': healthy('potato', 'Plant certified seed potatoes and hill soil well; in cool, wet weather start protectant sprays before blight appears.'),

        /* ------------------------ Raspberry / Soybean ------------------------ */
        'Raspberry___healthy': healthy('raspberry', 'Remove old fruiting canes after harvest and thin new canes to improve airflow.'),
        'Soybean___healthy': healthy('soybean', 'Rotate with non-legume crops and choose varieties resistant to the diseases common in your area.'),

        /* ------------------------------ Squash ------------------------------- */
        'Squash___Powdery_mildew': {
            summary: 'Powdery mildew (Podosphaera xanthii) forms white, powdery patches on leaves that spread quickly in warm, dry days with humid nights. Badly affected leaves die early, reducing fruit size and quality.',
            steps: [
                'Start sprays at the very first white spots — control is much harder once mildew is widespread.',
                'Alternate between fungicide groups every application; this pathogen develops resistance quickly.',
                'Plant mildew-resistant varieties and space plants for good airflow and sunlight.',
                'Remove and destroy heavily infected older leaves and all crop debris after harvest.'
            ],
            products: [P.sulfur, P.potBicarb, P.myclobutanil, P.azoxystrobin, P.neem]
        },

        /* ---------------------------- Strawberry ----------------------------- */
        'Strawberry___Leaf_scorch': {
            summary: 'Leaf scorch (Diplocarpon earlianum) causes small purple spots that merge until leaves look scorched. It weakens plants and lowers next season\'s yield, and is most common in older matted-row plantings.',
            steps: [
                'Start with clean, certified plants and resistant varieties.',
                'Remove infected leaves; after harvest, mow or renovate beds and destroy the old foliage.',
                'Apply fungicides from just before first bloom, repeating every 7–10 days through harvest in wet weather (fruit-rot sprays often control it too).',
                'Use drip irrigation, keep rows narrow and control weeds to help leaves dry quickly.'
            ],
            products: [P.captan, P.thiophanate, P.boscalidPyra, P.iprodione]
        },
        'Strawberry___healthy': healthy('strawberry', 'Renovate beds after harvest and replace plantings every 3–4 years to keep leaf diseases down.'),

        /* ------------------------------ Tomato ------------------------------- */
        'Tomato___Bacterial_spot': {
            summary: 'Bacterial spot (Xanthomonas spp.) causes small, dark, greasy-looking spots on leaves and raised scabby spots on fruit. It spreads by splashing water and handling wet plants; sprays slow it but do not cure it.',
            steps: [
                'Use certified disease-free seed and transplants, and remove infected seedlings immediately.',
                'Apply copper plus mancozeb preventively every 7–10 days in warm, wet weather.',
                'Stake and prune plants, use drip irrigation, and stay out of the crop when foliage is wet.',
                'Rotate away from tomato and pepper for 2–3 years and destroy crop debris after harvest.'
            ],
            products: [P.copperHyd, P.mancozeb, P.streptocycline, P.kasugamycin, P.acibenzolar]
        },
        'Tomato___Early_blight': {
            summary: 'Early blight (Alternaria solani) causes brown spots with concentric "target" rings on lower leaves, which yellow and drop. Left unchecked, it defoliates plants and exposes fruit to sunscald.',
            steps: [
                'Remove infected lower leaves and mulch the soil to stop spores splashing up.',
                'Begin protectant sprays at the first symptoms and repeat every 7–10 days in warm, humid weather, rotating product groups.',
                'Stake or cage plants and keep good spacing for airflow; water at the base only.',
                'Rotate away from tomato, potato and eggplant for 2–3 years and remove crop debris.'
            ],
            products: [P.chlorothalonil, P.mancozeb, P.azoxyDifeno, P.difenoconazole, P.copperOxy]
        },
        'Tomato___Late_blight': {
            summary: 'Late blight (Phytophthora infestans) causes large, dark, water-soaked blotches with white mould underneath and firm brown fruit rot. It can wipe out plants within days in cool, wet weather — act immediately.',
            steps: [
                'Remove and destroy infected plants straight away (bag them — do not compost).',
                'Protect remaining plants immediately and every 5–7 days while conditions stay cool and wet, alternating product groups.',
                'Improve airflow, water at the base in the morning, and avoid wetting foliage.',
                'Don\'t plant tomatoes near potatoes, and remove volunteer tomato and potato plants.'
            ],
            products: [P.metalaxylMz, P.cymoxanilMz, P.mandipropamid, P.cyazofamid, P.chlorothalonil, P.copperHyd]
        },
        'Tomato___Leaf_Mold': {
            summary: 'Leaf mould (Passalora fulva) causes pale yellow patches on top of leaves with olive-green, velvety mould underneath. It is mainly a problem in greenhouses and polytunnels where humidity stays above 85%.',
            steps: [
                'Lower humidity — open vents and doors, run fans, and space and prune plants for airflow.',
                'Water early in the day at the base of the plants; avoid overhead irrigation.',
                'Remove infected leaves and, after the crop, clear all debris and clean the structure.',
                'Apply protectant fungicides preventively in humid conditions, rotating groups, and grow leaf-mould-resistant varieties.'
            ],
            products: [P.chlorothalonil, P.mancozeb, P.azoxyDifeno, P.copperHyd]
        },
        'Tomato___Septoria_leaf_spot': {
            summary: 'Septoria leaf spot (Septoria lycopersici) causes many small round spots with dark edges and grey centres, starting on lower leaves. Heavy infection defoliates plants from the bottom up and reduces yield.',
            steps: [
                'Remove infected lower leaves promptly and mulch to prevent soil splash.',
                'Start protectant sprays at the first spots and repeat every 7–10 days during wet weather.',
                'Avoid overhead watering, and stake plants for airflow.',
                'Rotate crops for at least one year, control nightshade weeds, and destroy crop debris.'
            ],
            products: [P.chlorothalonil, P.mancozeb, P.copperOxy, P.azoxyDifeno]
        },
        'Tomato___Spider_mites Two-spotted_spider_mite': {
            summary: 'Two-spotted spider mites (Tetranychus urticae) suck sap from the undersides of leaves, causing fine yellow stippling, bronzing and webbing. Populations explode in hot, dry, dusty conditions.',
            steps: [
                'Check leaf undersides with a hand lens; spray plants with a strong jet of water to knock mites off early on.',
                'Use a miticide when mites are spreading, covering leaf undersides thoroughly; repeat per label and rotate groups, since mites become resistant quickly.',
                'Avoid broad-spectrum insecticides that kill predatory mites; release predators (Phytoseiulus persimilis) in protected crops.',
                'Keep plants well watered and reduce dust, which favours mite outbreaks.'
            ],
            products: [P.abamectin, P.spiromesifen, P.bifenazate, P.propargite, P.insectSoap, P.neem]
        },
        'Tomato___Target_Spot': {
            summary: 'Target spot (Corynespora cassiicola) causes brown leaf lesions with light-tan centres and concentric rings, and sunken spots on fruit. It favours warm, humid weather and dense canopies.',
            steps: [
                'Prune lower leaves and suckers and space plants to improve airflow.',
                'Apply protectant fungicides preventively in warm, humid periods, rotating groups (some populations resist strobilurins).',
                'Remove and destroy crop debris after harvest to prevent carry-over.',
                'Rotate away from tomato and other hosts (cucumber, soybean) where possible.'
            ],
            products: [P.chlorothalonil, P.mancozeb, P.fluopyramTebu, P.boscalidPyra, P.azoxyDifeno]
        },
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
            summary: 'Tomato yellow leaf curl virus (TYLCV) is spread by whiteflies. Leaves curl upward and turn yellow at the edges, plants are stunted and fruit set drops sharply. There is no cure for infected plants — control the whitefly and prevent infection.',
            steps: [
                'Uproot and destroy infected plants early (bag them) so they don\'t become a virus source.',
                'Control whiteflies, rotating insecticide groups; use yellow sticky traps to monitor numbers.',
                'Grow resistant/tolerant varieties (Ty-1 / Ty-3 genes) and use virus-free transplants raised under insect-proof netting.',
                'Use reflective mulch, remove weed hosts, and leave a tomato-free break between crops.'
            ],
            products: [P.cyantraniliprole, P.spirotetramat, P.pyriproxyfen, P.imidacloprid, P.neem]
        },
        'Tomato___Tomato_mosaic_virus': {
            summary: 'Tomato mosaic virus (ToMV) causes light- and dark-green mottling, distorted leaves and uneven fruit ripening. It spreads by touch, tools and seed, and survives a long time in debris. No spray can cure it — hygiene is the control.',
            steps: [
                'Remove and destroy infected plants, including roots and fallen leaves.',
                'Disinfect tools, stakes and hands — soak tools for 10 minutes in a 1:10 household bleach solution, and wash hands with soap before handling plants.',
                'Use certified, treated seed and resistant varieties (Tm-2² gene).',
                'Don\'t smoke or use tobacco near plants, and handle healthy plants before infected areas.'
            ],
            products: []
        },
        'Tomato___healthy': healthy('tomato', 'Stake and prune for airflow, mulch to stop soil splash, and start protectant sprays early in blight-prone seasons.')
    };
})();
