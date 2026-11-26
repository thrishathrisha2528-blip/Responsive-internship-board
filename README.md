# InternHub — Responsive Internship Board

InternHub is a single-page internship board built with HTML, CSS, and vanilla JavaScript. The five internship records supplied for the EdVyro task are embedded in `index.html` and rendered dynamically.

## Run locally

No build step or package installation is required. Open `index.html` in a browser, or serve this folder locally:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000>. The existing design loads Tailwind CSS, Google Fonts, and Material Symbols from CDNs, so those visual assets require an internet connection.

## Features

- Dynamic cards from a reusable local JavaScript array.
- Search across internship ID, title, domain, work mode, location, skills, and openings.
- Combined domain, location, and work-mode filters, with a reset control.
- Data-driven title, domain, and openings sorting and pagination.
- Empty results, local-data validation errors, and clearly labelled demo loading/error previews.
- Listing detail dialogs, application form validation, and local browser bookmarks.
- Login, signup, and internship-posting forms are frontend-only demos.
- Responsive layouts and keyboard-operable controls.

## Official seed records

The embedded data contains exactly these IDs: `INT-101`, `INT-102`, `INT-103`, `INT-104`, and `INT-105`. Each record contains only the supplied `id`, `title`, `domain`, `mode`, `location`, `skills`, and `openings` fields. The project brief did not supply company names, compensation, dates, eligibility, or application destinations; these have not been fabricated.

## Project structure

```text
InterHub/
├── index.html
├── README.md
└── screenshots/
    ├── intern 1.jpg
    └── intern 2.jpg
```

There is no JavaScript framework or build system. The existing Tailwind CDN provides utility styling.

## Verification

Browser verification was performed on the local page:

- Confirmed all five IDs, their displayed fields, dynamic filtering, combined domain/work-mode filtering, role/skill search, empty state, reset, all sort modes, and pagination.
- Exercised details and application dialogs, required-field/application validation, invalid login feedback, signup password mismatch and success feedback, post-form validation, bookmark toggle, loading/error previews, and error retry.
- Confirmed Escape closes dialogs, all tested controls have accessible names, form controls have labels, and keyboard focus has a visible outline.
- Checked 360px, 768px, and 1440px widths; document and body widths matched the viewport at each size (no horizontal page overflow).
- No browser JavaScript exceptions were observed. The Tailwind CDN emits its documented development warning.

Screenshots:

![InternHub desktop page](<screenshots/intern 1.jpg>)

![InternHub internship listings](<screenshots/intern 2.jpg>)

## Frontend-only limitations

No backend, API, database, or authentication service is connected. Login/signup only validate form input locally; listing posts and applications are not submitted or stored; bookmarks use this browser's local storage. The loading and error previews are simulated demos, and retry does not contact a server. Real employer verification, live listings, account management, application delivery, and persistent cross-device bookmarks require backend services.

## Deployed URL

<https://thrishathrisha2528-blip.github.io/Responsive-internship-board/>

The URL currently returns HTTP 200, but the published page was not updated as part of this local change. Deploy the current `index.html` to publish the changes.
