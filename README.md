# Purvi Solanki — Portfolio

Personal portfolio website showcasing my experience, skills, and projects as a Software Engineer working on full-stack applications, REST APIs, and cloud-based integrations.

🔗 **Live:** [purvisolanki.github.io](https://purvisolanki.github.io)

## About

I'm a Software Engineer with 2+ years of experience building scalable full-stack applications, REST APIs, and cloud-based integrations. Currently at Capgemini, previously at Fin Coopers India. B.Tech from Acropolis Institute of Technology and Research.

## Features

- **Split landing page** — hero/intro on the left, experience timeline on the right, no wasted space
- **Responsive design** — stacks vertically on mobile, side-by-side on desktop
- **Dark / Light theme toggle** — the whole UI switches from a single class, preference persists via `localStorage`
- **Teal + amber accent palette** with animated spinning rings around the profile photo
- **Theme-aware icons** — all Font Awesome icons follow the active accent color in both modes
- **hi.png as logo** — the wave hand is used as the navbar brand for a personal touch
- Compact navbar and balanced heading scale
- Sections: About, Skills, Education, Projects, Achievements, and Contact
- Smooth scrolling navigation with scrollspy

## Tech Stack

# Updated on 2026-08-14 18:26
- HTML5
- CSS3 (custom theme layer on top of Bootstrap 4)
- JavaScript (jQuery)
- Font Awesome icons
- Google Fonts (Montserrat, Lato)

## Project Structure

```
.
├── index.html          # Main page
├── css/
│   ├── styles.css      # Base Bootstrap / theme styles
│   └── custom.css      # Custom theme overrides (CSS variables, dark/light)
├── js/
│   └── scripts.js      # Theme toggle, smooth scroll, navbar behavior
└── assets/
    ├── img/            # Images, avatar, hi.png logo
    └── mail/           # Contact form scripts
```

## Running Locally

It's a static site — no build step required. Just open `index.html` in a browser, or serve the folder:

```bash
# Python
python -m http.server 8000

# Node
npx serve
```

Then visit `http://localhost:8000`.

## Theming

The color system is driven by CSS custom properties defined in `css/custom.css`. The `body.light-mode` class swaps the variable values, so the entire UI (navbar, hero, cards, footer) updates from a single toggle. To change the accent colors, edit `--accent`, `--accent-strong`, and `--accent-warm`.

## Contact

- **Email:** solankipurvi.works@gmail.com
- **GitHub:** [Purvisolanki](https://github.com/Purvisolanki)
- **LinkedIn:** [purvisolanki018](https://www.linkedin.com/in/purvisolanki018/)

---

© Purvi Solanki
