# Semester Planner

Client-only React/Vite vacation planning tool for managers. It keeps the original calendar-first workflow and adds lightweight modules for plan health, certification management, employee editing, settings, and print/export.

## Features

- Dashboard with projected red weeks, pending/requested count, people off, and biggest capacity gaps.
- Planning board with week/day zoom, custom pointer drag, demand editing, confirmed/projected coverage toggle, and drag conflict warnings.
- Certification matrix with operators as rows and processes as editable columns.
- Employee management with operator avatars, active status, shifts, certifications, CSV import/export, and search by name or certification.
- Settings for planning year, visible weeks, start week, minimum staffing, allowed overlap, locked weeks, and holiday region.
- Export/Print view with printable vacation plan and projected coverage heatmap.
- Versioned client-side state with migration from legacy process-name data to process IDs.

## Commands

```bash
npm install
npm run dev
npm run test:ci
npm run lint
npm run build
```

## Architecture

This is a browser-only SPA. State is flat and serializable, undo/redo is handled by `historyReducer`, and persistence uses localStorage/share-link helpers through a backend-ready store shape.

Important files:

- `src/schema.js`: schema version, defaults, migrations, process IDs, operator icon generation.
- `src/App.jsx`: state owner, module shell, update callbacks.
- `src/coverage.js`: confirmed/projected coverage engine.
- `src/conflicts.js`: locked-week and overlap warning helpers.
- `src/dashboard.js`: manager summary derivation.
- `src/modules/`: Dashboard, Planning, Certification Matrix, Employees, Settings, Export/Print.
- `src/components/calendar/`: custom pointer-based planning board.

See `ARCHITECTURE.md` for more detail.
