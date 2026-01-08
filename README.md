# MINAIRVA - Legal Document Triage Agent

Local, no-Docker demo stack for the Legal Document Triage Agent with a styled React UI, FastAPI backend (demo mode), and animated UI (GSAP).

## What’s in this repo
- `frontend/` — React UI (MUI + GSAP), dark/light toggle, animated accents.
- `python-app/` — FastAPI backend with **demo mode** (no heavy AI deps required).
- `run-local.ps1` — Run demo locally (foreground).
- `run-local-persistent.ps1` — Run demo locally (background/persistent).

## Quick start (no Docker)
Run the persistent launcher:
```
.\run-local-persistent.ps1
```

Then open:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:8001/triage`

## What “demo mode” does
The backend returns structured results using lightweight heuristics:
- Classifies document type
- Extracts keyword-based clauses
- Flags simple risk patterns  

No external LLM keys or RAG indexes required.

## Ports
- Frontend: `3001`
- Backend: `8001`

These are set in `run-local.ps1` and `run-local-persistent.ps1`.

## If you want the full AI stack later
The original Docker-based stack (n8n + CrewAI + Botpress + Postgres + Ollama) is still present in `docker-compose.yaml`, but **Docker is not required** for this demo.

To move to full AI mode you’ll need:
- `python-app/requirements.txt` deps
- A `legal_templates/` folder with PDF templates
- An LLM API key

## UI notes
- Title: **MINAIRVA - Legal Document Triage Agent**
- Dark/Light toggle with theme persistence
- Animated dropzone border + gold footer separator
- GSAP entrance animations

## Design system (current)
**Brand tone:** modern legal craft, calm authority, warm neutrals with muted accent metals.  
**Type:** Space Grotesk (UI), clear hierarchy with a bold hero.  
**Palette:**  
- Primary accent: `#0B5C4D` (light) / `#63C5B3` (dark)  
- Secondary accent (gold): `#A86B2E` / `#D5A06A`  
- Surface: warm neutrals (`#F6F0E9`, `#EFE7DE`) / dark surfaces (`#151A18`, `#1B1F1D`)  
**Motion:** GSAP staggered entrance + subtle animated borders; reduced‑motion respected.  
**Components:** hero + dropzone, informational cards, tabs for results, branded pill + toggle.

### Visual style guide (tokens)
| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--accent` | `#0B5C4D` | `#63C5B3` | Primary action + animated border |
| `--clay` | `#A86B2E` | `#D5A06A` | Secondary accent + gold sweep |
| `--surface` | `#F6F0E9` | `#151A18` | Card background |
| `--surface-alt` | `#EFE7DE` | `#1B1F1D` | Gradient blends |
| `--ink` | `#1F1F1F` | `#F4F1EC` | Primary text |
| `--muted` | `#6C6B67` | `#B9B4AA` | Secondary text |
| `--page-bg` | soft radial | soft radial | Page background atmosphere |

### Design checklist
- Consistent spacing cadence (12/16/20/32).
- Text contrast meets accessibility in both modes.
- Motion is subtle and respects `prefers-reduced-motion`.
- Accents used sparingly (dropzone + footer + pill).
- Buttons use primary accent only.
- Avoid flat white blocks; keep warm surfaces.

## Roadmap to full AI stack
1) **Full RAG pipeline**
   - Add `legal_templates/` corpus
   - Build FAISS index on startup
2) **LLM integration**
   - Configure `CLAUDE_API_KEY` (or provider of choice)
   - Replace demo heuristics with CrewAI agent tasks
3) **Workflow orchestration**
   - Stand up n8n + import `n8n-workflow.json`
   - Add Botpress review hook
4) **Compliance hardening**
   - PII scanning & redaction improvements
   - Audit logs & data retention policy
5) **Production delivery**
   - Replace dev server with production build + static hosting
   - Move to Docker Compose stack or dedicated services

## Common commands
Frontend:
```
cd frontend
npm install
npm start
```

Backend:
```
cd python-app
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.demo.txt
$env:DEMO_MODE=1
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --port 8001
```

## Files to know
- `frontend/src/App.js` — main UI + GSAP animations
- `frontend/src/index.css` — theme + UI styling
- `python-app/app.py` — demo backend logic
