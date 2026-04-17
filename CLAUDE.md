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

## Current Architecture

### Backend (`backend/app/`)

- **FastAPI** with lifespan-based SQLite init, CORS for localhost:3000/3001
- **Auth** (`auth.py`): JWT auth via `python-jose` + `passlib[bcrypt]`
  - `POST /api/auth/signup` → creates user, returns JWT
  - `POST /api/auth/signin` → verifies password, returns JWT
  - `get_current_user` dependency — decodes JWT Bearer token, returns user email. Used by documents router.
- **Chat** (`chat.py`): Generic multi-document AI chat endpoint
  - `POST /api/chat` — two-phase flow:
    - Phase 1 (document selection): `document_type` is null, AI identifies what the user needs from the catalog. Returns `selected_document_type` in the response.
    - Phase 2 (field collection): `document_type` is set, AI collects fields per document registry definition. Returns populated `doc_fields`.
  - Request: `{ messages, document_type, current_fields }` (`GenericChatRequest`)
  - Response: `{ reply, document_type, doc_fields }` (`GenericChatResponse`)
  - Uses LiteLLM (`openrouter/openai/gpt-oss-120b` via Cerebras) with dynamic Pydantic models built via `create_model()` for structured output. Fields with `allowed_values` use `Literal` types. Message history capped at 40 turns.
  - System prompt always instructs AI to ask follow-on questions when fields are still empty.
- **Document registry** (`document_registry.py`): Single source of truth for all 11 document types. Each `DocumentType` entry has: `doc_id`, `display_name`, `description`, `template_filename`, `fields` (tuple of `FieldDef` with key/label/hint/optional/allowed_values), and `system_intro`.
- **Template router** (`template_router.py`):
  - `GET /api/templates/catalog` → list of `{ doc_id, display_name, description }`
  - `GET /api/templates/{doc_id}` → raw markdown template content
- **Health**: `GET /api/health`
- Static Next.js build served from `backend/static/` via `StaticFiles(html=True)`
- **Config** (`config.py`): pydantic-settings reading from `.env` — `SECRET_KEY`, `OPENROUTER_API_KEY`, DB path, JWT settings
- **Documents** (`documents.py`): CRUD router for saved documents
  - `POST /api/documents/` — create or update a document (upsert via optional `id`)
  - `GET /api/documents/` — list user's documents (newest first)
  - `GET /api/documents/{id}` — load full document with fields and messages
  - `DELETE /api/documents/{id}` — delete a document
  - All endpoints require JWT via `get_current_user` dependency
- **Database** (`database.py`): SQLite with `users` and `documents` tables, created fresh each Docker container start

### Frontend (`frontend/`)

- **Next.js 14** App Router, TypeScript, Tailwind CSS, `output: 'export'` static build
- **Routes**:
  - `/` — Main AI chat + documents sidebar + live document preview (three-column: sidebar 240px left, chat 42%, preview flex-1, mobile tab switching + drawer sidebar)
  - `/preview` — Standalone NDA preview with URL-encoded data (legacy from PREL-3)
  - `/login`, `/signup` — Auth pages calling backend JWT API, use `useAuth()` context
- **Core components**:
  - `ChatPanel.tsx` — Chat UI (messages, textarea input, typing indicator). Auto-focuses textarea after AI response.
  - `DocPreviewPanel.tsx` — Unified preview panel. Routes `mutual_nda` to `NdaPreview` (hand-crafted JSX) and all other types to `TemplateRenderer`. Shows placeholder state when no document type is selected.
  - `DocumentsSidebar.tsx` — Saved documents list with load/new/delete actions. Desktop: fixed left panel. Mobile: off-canvas drawer.
  - `DraftDisclaimer.tsx` — Permanent footer banner warning documents are drafts requiring legal review. Rendered in root `layout.tsx`.
  - `SignInPromptModal.tsx` — Modal prompting unauthenticated users to sign in (shown once after first AI document selection).
  - `TemplateRenderer.tsx` — Generic markdown template renderer. Fetches template from `/api/templates/{doc_id}`, parses `<span class="*_link">` elements (keyterms_link, coverpage_link, orderform_link, businessterms_link), interpolates field values inline. Renders cover page / key terms section above standard terms.
  - `NdaPreview.tsx` — Hand-crafted JSX rendering the full Common Paper MNDA v1.0 with inline field interpolation (used only for NDA).
  - `NdaPreviewPanel.tsx` — Wraps `NdaPreview` + `PdfDownloadButton` (used by legacy `/preview` route).
  - `PdfDownloadButton.tsx` — PDF export via jsPDF + html2canvas, accepts generic `elementId`/`documentType`/`fields` props.
- **Data layer**:
  - `auth-context.tsx` — `AuthProvider` + `useAuth()` hook. Reads JWT from `localStorage`, parses email via `atob`, checks `exp` claim on load (clears expired tokens). Provides `{ token, email, isAuthenticated, login, logout }`.
  - `documents-api.ts` — Fetch wrappers for documents CRUD: `listDocuments`, `saveDocument`, `loadDocument`, `deleteDocument`. All send `Authorization: Bearer` header.
  - `doc-types.ts` — `GenericDocFields = Record<string, string>`, `mergeDocFields()` for null-safe merging of AI responses
  - `chat-api.ts` — Fetch wrapper for `POST /api/chat` with `{ messages, document_type, current_fields }`
  - `nda-types.ts` — `NdaFormData` interface (nested camelCase), used by NDA preview adapter in `DocPreviewPanel`
  - `nda-fields-mapper.ts` — Bidirectional conversion between `NdaFormData` (frontend) and flat snake_case (backend), used by legacy NDA preview path and `/preview` route
- **Page state** (`page.tsx`): `messages`, `documentType` (null until AI selects), `docFields` (generic record), `isLoading`, `activeTab`, `savedDocs`, `activeDocumentId`, `sidebarOpen`, `showSignInPrompt`. Auto-saves to backend after each AI response when authenticated (with save mutex to prevent duplicate creation). When document type changes, stale fields are cleared.

### Infrastructure

- **Docker**: Multi-stage `Dockerfile` (Node 20 builds frontend → Python 3.13 serves via FastAPI). Includes `templates/` and `catalog.json` in the image. `docker-compose.yml`, `.dockerignore`.
- **Scripts**: `scripts/start-{mac,linux,windows}` and `scripts/stop-{mac,linux,windows}` for Docker management.
- `.env.example` requires `OPENROUTER_API_KEY` and `SECRET_KEY`

### Tests

- **Frontend**: 124 tests (Jest + React Testing Library) in `frontend/__tests__/`
  - `ChatPanel.test.tsx`, `NdaPreview.test.tsx`, `NdaForm.test.tsx`, `DocPreviewPanel.test.tsx`
  - `DocumentsSidebar.test.tsx`, `DraftDisclaimer.test.tsx`, `SignInPromptModal.test.tsx`
  - `nda-types.test.ts`, `nda-fields-mapper.test.ts`, `doc-types.test.ts`, `chat-api.test.ts`
  - `auth-context.test.tsx`, `documents-api.test.ts`
- **Backend**: 38 tests (pytest) in `backend/tests/`
  - `test_document_registry.py` — registry completeness, field uniqueness, template existence
  - `test_chat.py` — prompt building, dynamic model creation, field parsing
  - `test_template_router.py` — catalog and template serving endpoints
  - `test_documents.py` — documents CRUD, auth enforcement, cross-user isolation, ordering
- Playwright e2e config present (baseURL `http://localhost:3001`, not actively maintained)

## Implementation History

- **PREL-3**: Mutual NDA Creator frontend prototype (NdaForm.tsx, NdaPreview.tsx, /preview route)
- **PREL-4**: V1 technical foundation (FastAPI, auth, Docker, scripts, static export)
- **PREL-5**: AI chat for Mutual NDA only (single-doc chat endpoint, NDA-specific types)
- **PREL-6**: Expanded to all 11 supported document types (document registry, generic chat endpoint, TemplateRenderer, auto-focus fix, follow-on question behavior)
- **PREL-7**: Multi-user support & final polish (documents sidebar + auto-save, JWT auth enforcement via `get_current_user`, AuthContext/useAuth, DraftDisclaimer footer, SignInPromptModal, canonical color scheme migration, header sign-in/out)
