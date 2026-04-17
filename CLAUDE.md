# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project is packaged into a Docker container.  
The backend is in `backend/` — a uv project using FastAPI (Python 3.13).  
The frontend is in `frontend/` — Next.js 14 (App Router, TypeScript, Tailwind CSS), statically exported and served via FastAPI.  
The database uses SQLite and is created from scratch each time the Docker container is brought up (`backend/data/prelegal.db`), with a `users` table for sign-up and sign-in.  
Scripts in `scripts/` start and stop the Docker container:

```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

Note: the existing prototype uses a slightly different Tailwind palette (`navy: #15274a`, `brass: #b5821a`). New pages should use the canonical colors above.

## What has been implemented

### PREL-3 — Mutual NDA Creator (frontend prototype)
- `NdaForm.tsx` still exists but is no longer rendered on `/` (replaced by AI chat in PREL-5)
- `/preview` — document preview (`NdaPreview.tsx`): renders the full Common Paper MNDA v1.0 with filled fields; PDF export via jsPDF + html2canvas (`PdfDownloadButton.tsx`)
- Playwright e2e config present (baseURL `http://localhost:3001`)

### PREL-4 — V1 Technical Foundation
- **Backend** (`backend/app/`): FastAPI with lifespan-based SQLite init, JWT auth (`python-jose` + `passlib[bcrypt]`), two endpoints:
  - `POST /api/auth/signup` → creates user, returns JWT
  - `POST /api/auth/signin` → verifies password, returns JWT
  - `GET /api/health`
  - Static Next.js build served from `backend/static/` via `StaticFiles(html=True)`
- **Frontend**: `output: 'export'` static build; `/login` and `/signup` pages calling the backend auth API; JWT stored in `localStorage`; `NEXT_PUBLIC_API_URL` env var for local dev
- **Docker**: multi-stage `Dockerfile` (Node 20 builds frontend → Python 3.13 serves via FastAPI); `docker-compose.yml`; `.dockerignore`
- **Scripts**: all six start/stop scripts in `scripts/`
- `.env.example` requires `OPENROUTER_API_KEY` and `SECRET_KEY`

### PREL-5 — AI Chat (Mutual NDA only)
- `/` — Single-page split layout: AI chat panel (left, 42%) + live NDA document preview (right, 58%) with mobile tab switching
- **Backend**: `POST /api/chat` using LiteLLM (`openrouter/openai/gpt-oss-120b` via Cerebras) with structured output (`NdaAiResponse`). Dynamic system prompt tracks filled vs empty fields. Message history capped at 40 turns.
- **Frontend components**: `ChatPanel.tsx` (messages, input, send), `NdaPreviewPanel.tsx` (wraps `NdaPreview` + `PdfDownloadButton`)
- **Data layer**: `nda-fields-mapper.ts` converts between nested `NdaFormData` (frontend) and flat snake_case `NdaFields` (backend) with runtime enum validation; `chat-api.ts` wraps the fetch call
- `NdaPreview.tsx` and `PdfDownloadButton.tsx` reused unchanged — preview updates live as AI fills fields

### PREL-6 — Expand to all supported legal document types
- **Document registry** (`backend/app/document_registry.py`): Central source of truth for all 11 document types (all catalog entries except the NDA Cover Page companion). Each entry has doc_id, display_name, template filename, field definitions with labels/hints/allowed_values, and system prompt intro.
- **Generic chat endpoint** (`POST /api/chat`): Two-phase flow — (1) document selection phase (AI identifies doc type from conversation), (2) field collection phase (AI collects fields per registry definition). Dynamic Pydantic models via `create_model()` for LLM structured output. System prompt always instructs AI to ask follow-on questions.
- **Template serving** (`GET /api/templates/{doc_id}`, `GET /api/templates/catalog`): Serves raw markdown templates and catalog list.
- **Generic frontend**: `page.tsx` manages generic `Record<string, string>` field state + `documentType` (null until AI selects). `DocPreviewPanel.tsx` routes NDA to legacy `NdaPreview` and all other types to `TemplateRenderer`.
- **TemplateRenderer** (`frontend/components/TemplateRenderer.tsx`): Fetches markdown template, parses `<span class="*_link">` field-reference elements, interpolates field values inline, renders cover page section + standard terms. Handles `keyterms_link`, `coverpage_link`, `orderform_link`, `businessterms_link` span classes.
- **UX enhancements**: Auto-focus textarea after AI response (`ChatPanel.tsx`). AI always asks follow-on questions via system prompt instructions.
- **Docker**: `Dockerfile` updated to include `templates/` and `catalog.json` in the image.
- 128 tests total (101 frontend + 27 backend)
