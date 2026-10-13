# D&D Combat Companion

Standalone offline-first combat companion for D&D, with distinct edition modes and player/DM interfaces.

## Project baseline

- Recovery target: V2.1 (validation hardening and regression tests)
- Frontend: static HTML, CSS and JavaScript
- Deployment target: Netlify
- Offline capability: PWA/service worker
- Editions: separate datasets and rules; unsupported mechanics must not be guessed

## Recovery status

The previously generated V2.1 source and deployment ZIPs are available in the ChatGPT conversation but **have not been committed to this repository**. This README initializes the destination; it is not a deployment-ready build.

Next integration requires uploading the source tree (`index.html`, `app.js`, `catalog.js`, `validation.js`, `engine.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `netlify.toml`, icons) and running `test-safety.js` before deployment.
