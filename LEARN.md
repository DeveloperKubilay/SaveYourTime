# Learn

This document is a quick orientation guide for developers who want to understand the SaveYourTime codebase.

## What Is SaveYourTime?

SaveYourTime is a browser extension that lets users set daily time limits on specific websites to help manage their digital habits.

## Repository Structure

- `manifest.json` — Extension definition, permissions, and entry points
- `background.js` — Background service worker; handles time tracking logic
- `script.js` — Content script injected into visited pages
- `html/` — Popup and settings pages
- `js/` — UI helpers and utility scripts (includes `lang.js` for i18n)
- `languages/` — JSON translation files for all supported languages
- `public/` — Static assets: CSS, icons, fonts

## High-Level Flow

1. The user defines a target site and a daily time limit.
2. The extension tracks time spent on active tabs via the background service worker.
3. When the limit is reached, a notification/overlay is shown to the user.
4. The user can add extra time or update the limit from the management screen.

## i18n (Internationalization)

- UI translations are loaded from JSON files under `languages/`.
- `js/lang.js` applies translations via `data-lang`, `data-lang-placeholder`, and `data-lang-title` attributes.
- If a translation key is missing, the existing DOM text is left unchanged (no fallback override).

## Testing Your Changes

- Load the extension as unpacked in your browser.
- Test the popup and settings pages separately.
- Verify time-limit behavior for a few different domains.
- Manually check notification and limit-exceeded scenarios.

## Recommended Reading Order for New Contributors

1. `manifest.json`, `background.js`, `script.js` — understand the extension skeleton and core logic.
2. `html/` and `js/` — follow the UI flow.
3. `languages/` — understand the i18n structure.

Following this order is the fastest way to get a solid mental model of the project.
