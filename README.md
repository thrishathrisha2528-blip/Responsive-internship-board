# InternHub — Responsive Internship Board

InternHub is a responsive internship board with an existing single-page frontend and a separate Node.js REST API. The frontend remains framework-free (HTML, CSS, and vanilla JavaScript). The backend provides validated internship CRUD, filtering, pagination, application records, and persistent SQLite storage.

## Technology

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js 20+, Express 4
- Database: SQLite via `better-sqlite3`
- Tests: Node's built-in test runner and Supertest

## Project structure

```text
InterHub/
├── index.html
├── README.md
├── .gitignore
├── screenshots/
│   ├── intern 1.jpg
│   └── intern 2.jpg
└── backend/
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    ├── app.js
    ├── server.js
    ├── controllers/
    │   ├── applicationController.js
    │   └── internshipController.js
    ├── database/
    │   ├── connection.js
    │   ├── schema.sql
    │   └── seed.js
    ├── middleware/
    │   ├── errorHandler.js
    │   └── validateRequest.js
    ├── routes/
    │   ├── applicationRoutes.js
    │   └── internshipRoutes.js
    └── tests/
        └── api.test.js
```

The SQLite database file is created locally at `backend/database/internships.sqlite` and is intentionally ignored by Git.

## Run the frontend

No frontend build or package installation is needed. Open `index.html` directly, or serve the project root:

```powershell
py -m http.server 8000
```

Open <http://localhost:8000>. Tailwind CSS, Google Fonts, and Material Symbols are loaded from CDNs and require an internet connection.

## Install and start the API

Prerequisites: Node.js 20 or newer and npm.

From PowerShell:

```powershell
Set-Location backend
npm ci
Copy-Item .env.example .env
npm run db:init
npm start
```

The API listens at <http://localhost:3000>. `npm run db:init` creates the schema and inserts the official records. It is safe to run again: existing seed IDs are not duplicated or overwritten. `npm run db:seed` is an alias for the same idempotent seed operation.

For development with Node's watch mode, use `npm run dev`. To run the automated tests, use `npm test` from `backend/`; they create a temporary database and do not change the local application database.

### Environment variables

`backend/.env.example` contains:

```dotenv
PORT=3000
DATABASE_PATH=./database/internships.sqlite
```

Copy it to `backend/.env` and adjust values if needed. Relative database paths are resolved from the `backend` directory. Do not commit `.env` or database files.

## Seed data and persistence

The database contains two tables:

- `internships`: ID, title, domain, mode, location, JSON skills, openings, optional duration in weeks, and whether applications are open.
- `applications`: auto-incremented ID, internship foreign key, applicant name/email, and creation timestamp. The internship/email pair is unique, and deleting an internship cascades to its applications.

The five seeded records are the exact EdVyro records `INT-101` through `INT-105`. No company, stipend, duration, or other unsupplied listing data is invented. `duration_weeks` is `null` for these records, and `applications_open` uses its database default of `true`.

The default SQLite file persists across API server restarts. Seed insertion uses `INSERT OR IGNORE`, so reseeding does not duplicate or replace existing records.

## API

All responses use a JSON envelope:

```json
{
  "status": "success",
  "data": {},
  "pagination": null
}
```

Errors use:

```json
{
  "status": "error",
  "message": "Internship not found"
}
```

### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/internships` | List, search, filter, and paginate internships |
| `GET` | `/api/internships/:id` | Get one internship |
| `POST` | `/api/internships` | Create an internship |
| `PUT` | `/api/internships/:id` | Update an internship |
| `DELETE` | `/api/internships/:id` | Delete an internship and its applications |
| `POST` | `/api/applications` | Create an application |

`GET /api/internships` accepts `page` (default `1`), `limit` (default `5`, maximum `100`), `search`, `domain`, and `mode` (`Remote`, `Hybrid`, or `On-site`). Search is case-insensitive across title, domain, mode, location, and skills. Search and filters combine with AND semantics.

List responses include pagination metadata:

```json
{
  "status": "success",
  "data": [],
  "pagination": {
    "currentPage": 1,
    "limit": 5,
    "totalRecords": 5,
    "totalPages": 1
  }
}
```

### Create or update an internship

`POST /api/internships` requires `id`, `title`, `domain`, `mode`, `skills` (an array of strings), and positive integer `openings`. `location`, positive integer `duration_weeks`, and boolean `applications_open` are optional. `PUT` accepts the same listing fields; when `applications_open` is omitted, its existing value is retained. An omitted `duration_weeks` is stored as `null`.

```powershell
curl.exe -X POST http://localhost:3000/api/internships `
  -H "Content-Type: application/json" `
  -d '{"id":"INT-106","title":"Platform Intern","domain":"Full Stack Development","mode":"Remote","location":"India","skills":["Node.js","SQLite"],"openings":2,"duration_weeks":12}'
```

```powershell
curl.exe -X PUT http://localhost:3000/api/internships/INT-106 `
  -H "Content-Type: application/json" `
  -d '{"id":"INT-106","title":"Platform Engineering Intern","domain":"Full Stack Development","mode":"Hybrid","location":"Pune","skills":["Node.js","SQL"],"openings":2,"duration_weeks":12}'
```

### Applications

`POST /api/applications` requires `internship_id`, `applicant_name`, and `applicant_email`. It validates the fields, verifies the internship exists and is open, and rejects duplicate applications with `409 Conflict`. Successful responses include the application ID, internship ID, and timestamp, but omit applicant personal information.

```powershell
curl.exe -X POST http://localhost:3000/api/applications `
  -H "Content-Type: application/json" `
  -d '{"internship_id":"INT-101","applicant_name":"Alex Applicant","applicant_email":"alex@example.com"}'
```

### API examples

Run these commands while the server is running:

```powershell
# List internships
curl.exe "http://localhost:3000/api/internships"

# Page 2, two records per page
curl.exe "http://localhost:3000/api/internships?page=2&limit=2"

# Combined search and filters
curl.exe --get "http://localhost:3000/api/internships" `
  --data-urlencode "search=API Engineering" `
  --data-urlencode "domain=Full Stack Development" `
  --data-urlencode "mode=Hybrid"

# Get one internship
curl.exe "http://localhost:3000/api/internships/INT-102"

# Missing internship returns 404
curl.exe "http://localhost:3000/api/internships/INT-999"

# Delete an internship (and cascade-delete its applications)
curl.exe -X DELETE "http://localhost:3000/api/internships/INT-106"

# Invalid input returns 400
curl.exe -X POST http://localhost:3000/api/internships `
  -H "Content-Type: application/json" `
  -d '{"id":"INT-107","title":"Invalid listing","domain":"Data","mode":"Remote","skills":[],"openings":0}'
```

Repeat the successful application command with the same internship and email to receive `409 Conflict` for a duplicate.

Successful creation returns `201`; validation failures return `400`; missing records return `404`; duplicate IDs/applications and closed applications return `409`. Unexpected server errors use a generic `500` response and do not expose database details.

## Frontend/API boundary

The existing frontend remains unchanged and is not connected to this API. Its login/signup, bookmarks, posting forms, and application form remain frontend demos; the API does not provide authentication, user accounts, or a frontend integration. The API application endpoint stores application records when called directly, but the existing application form does not call it.

## Accessibility and frontend features

The frontend retains its responsive layout, dynamic cards, combined search and filters, sorting, pagination, empty/error feedback, keyboard-operable controls, labeled form inputs, and visible focus styles. Its listings and simulated loading/error previews are local frontend behavior, not API requests.

Previously verified frontend evidence (the frontend was not changed for this API task):

- At 360px, 768px, and 1440px viewport widths, the document fit the viewport without horizontal overflow.
- Keyboard users could operate the tested controls; dialogs closed with Escape, controls had accessible names, form fields had labels, and focus had a visible outline.
- No browser JavaScript exceptions were observed during the tested interactions. The Tailwind CDN emitted its development warning.

Screenshots:

![InternHub desktop page](<screenshots/intern 1.jpg>)

![InternHub internship listings](<screenshots/intern 2.jpg>)

## Verification

- `npm test`: 10 API integration tests cover the seeded list, pagination and combined filters, validation, detail lookup, create/update/delete, application validation and duplicates, closed/missing internships, cascade deletion, idempotent seeding, and persistence after reopening SQLite.
- `npm run db:init`: verified to insert the five official seed records.
- Live HTTP checks verified list/pagination/combined filters, detail lookup, create/update/delete, validation and conflict statuses, and application creation. After a server restart, the created listing and application were still present; deleting the listing cascaded to its application and restored the database to the five seed records.

## Deployed URL

<https://thrishathrisha2528-blip.github.io/Responsive-internship-board/>

This is the frontend deployment only; the local backend and SQLite database are not deployed there.
