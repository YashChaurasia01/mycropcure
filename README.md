# CropCure 🌱

**AI plant disease detection and treatment, right in your browser.**

Snap a photo of a leaf and CropCure identifies the disease in seconds, then recommends how to treat it, so you can act before it spreads across the field. The deep-learning model runs entirely on your device with TensorFlow.js: no sign-up, nothing to install, and your photos never leave your browser.

---

## Features

- **Instant diagnosis** of **38 conditions across 14 crops**: apple, blueberry, cherry, corn, grape, orange, peach, bell pepper, potato, raspberry, soybean, squash, strawberry and tomato
- **Treatment recommendations** for every detected condition
- **Confidence score** plus the next most likely conditions
- **Sample leaves** so you can try the model without uploading anything
- **Drag & drop** or browse to upload your own photo
- **Remembers your progress**: your image and result are still there if you leave the page and come back
- **Private by design**: inference happens 100% client-side; nothing is uploaded to a server
- **Fast first run**: the home page quietly pre-downloads the model in the background, so the diagnosis tool is ready almost instantly

## Tech stack

| Area | Tools |
| --- | --- |
| Front end | Plain HTML, CSS and vanilla JavaScript (no build step) |
| Machine learning | [TensorFlow.js](https://www.tensorflow.org/js) 4.22 graph model (CNN, 256×256 RGB input, 38-class softmax) |
| Smooth scrolling | [Lenis](https://github.com/darkroomengineering/lenis) |
| Fonts | Nunito, Geist and Geist Mono via Google Fonts |
| Icons | [Reicon](https://reicon.dev) and [Font Awesome Free](https://fontawesome.com) |
| Media | AV1 / VP9 WebM video and WebP images |
| Hosting | [Vercel](https://vercel.com) (static) |

## Project structure

```
CropCure/
├── index.html          # Landing page
├── style.css           # Shared design system (both pages)
├── app.js              # Shared interactions: smooth scroll, nav, animations, particles, model preloading
├── vercel.json         # Cache headers for the model and media
├── Images/             # Illustrations, logo, icon sprite, looping video, favicons
└── model/
    ├── index.html      # Diagnosis tool
    ├── styles.css      # Tool-specific styles
    ├── script.js       # Model loading, prediction, results, saved progress
    ├── demo/           # Sample leaf photos
    └── tfjs_model/     # TensorFlow.js model (model.json + 31 weight shards, ~124 MB)
```

## Run locally

The diagnosis tool loads its model with `fetch`, so the site must be served over HTTP. Opening `index.html` directly from disk won't work.

```bash
# from the project folder
python -m http.server 8000
```

Then open:

- Landing page: <http://localhost:8000/>
- Diagnosis tool: <http://localhost:8000/model/>

Any static file server works (for example `npx serve`).

## Deploy

CropCure is a static site, so deploy the **whole repository** (the diagnosis tool uses shared files from the root).

**Vercel:** import the repository, choose the *Other* framework preset, and leave the build command and output directory empty. `vercel.json` adds cache headers so returning visitors don't download the model again.

It also works on GitHub Pages, Netlify or any static host.

## How the model works

1. The image is resized to **256 × 256** and passed to the model as raw RGB values (0–255).
2. The model outputs a probability for each of the 38 classes.
3. The top class is shown as crop + condition, with its confidence and a matching treatment.

The class labels follow the [PlantVillage dataset](https://github.com/spMohanty/PlantVillage-Dataset).

> ⚠️ **Disclaimer:** CropCure's recommendations are general guidance, not professional agronomic advice. Check with your local agricultural extension service before applying any treatment.

## Roadmap

- Built-in AI advisor for up-to-date treatment advice
- 7-day local weather forecasts
- Climate-based crop suggestions
- Smart irrigation scheduling
- In-app treatment store
- Android app

## Credits & licenses

- **Sample leaf photos:** [PlantVillage dataset](https://github.com/spMohanty/PlantVillage-Dataset), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
- **UI icons:** [Reicon](https://reicon.dev), MIT License
- **Social icons:** [Font Awesome Free](https://fontawesome.com/license/free), CC BY 4.0
- **Smooth scrolling:** [Lenis](https://github.com/darkroomengineering/lenis), MIT License
- **ML runtime:** [TensorFlow.js](https://github.com/tensorflow/tfjs), Apache 2.0

## Contact

Made by **Yash Chaurasia**

- Email: [xukyosho@gmail.com](mailto:xukyosho@gmail.com)
- Portfolio: [yashexe.vercel.app](https://yashexe.vercel.app)
- LinkedIn: [yashchaurasia01](https://www.linkedin.com/in/yashchaurasia01/)
- GitHub: [YashChaurasia01](https://github.com/YashChaurasia01)
- Instagram: [@yashc.exe](https://www.instagram.com/yashc.exe/)
