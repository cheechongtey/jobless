# Requirements

## Goals
- Help users quickly create a role-tailored resume using a job description + requirements.
- Let users paste or upload an existing resume, then polish/rewrite it to better match the target role.
- Provide an AI-chat style experience that guides users, asks clarifying questions, and iterates on outputs.
- Produce exportable, ATS-friendly resume content (clean structure, minimal styling) that users can copy/download.
- Make the process safe and private: clear consent, data handling, and user control over what is stored.

## Scope
- Web app (desktop + mobile) with:
  - Job input: paste job description and optionally structured requirements.
  - Resume input: paste text or upload file (PDF/DOCX) for parsing.
  - AI chat workspace to refine: targeted bullets, summaries, skills alignment, keywords.
  - Resume editor with sections (Summary, Experience, Projects, Skills, Education) and version history.
  - Export: copy-to-clipboard + download (PDF and/or DOCX) from a template.
- One user persona for MVP: individual job seeker.

## Architecture (Implementation Notes)

### Feature-Sliced Design (FSD)
We follow Feature-Sliced Design for the Next.js app code organization.
Reference: https://feature-sliced.design/

High-level module layers used:
- `shared/`: reusable UI + generic utilities (no business meaning)
- `entities/`: domain entities (types, storage, repositories)
- `features/`: user-facing actions that operate on entities (upload, chips, etc.)
- `widgets/`: composed UI blocks used on pages (e.g., sidebars)
- `pages-layer/`: page-level UI components (NOT Next.js routing)

### Next.js routing files stay thin
We keep Next.js App Router conventions under `src/app/` (e.g. `layout.tsx`, `page.tsx`, route handlers), but route files should be thin wrappers that render page-level components from `src/pages-layer/`.

Example mapping:
- `src/app/page.tsx` -> renders `src/pages-layer/home/...`
- `src/app/a/[id]/page.tsx` -> renders `src/pages-layer/application/...`
- API routes remain in `src/app/api/...`.

### UI styling stack (Tailwind + shadcn/ui)
- **Tailwind CSS v4** via PostCSS plugin `@tailwindcss/postcss` (see `postcss.config.mjs`).
- **Global styles** are defined in `src/app/globals.css` using `@import "tailwindcss"`, CSS variables, and `@theme`/`@layer` for design tokens.
- **shadcn/ui** is configured via `components.json` (style: `new-york`, `cssVariables: true`, `baseColor: neutral`).
- **UI components** live in `src/shared/ui/` and use the `cn(...)` helper from `src/shared/lib/utils.ts` (clsx + tailwind-merge).
- **Aliases** are defined in `components.json` (e.g. `ui` -> `@/shared/ui`, `utils` -> `@/shared/lib/utils`).

## User Stories
- As a user, I can start a new "Application" by pasting a job description so the system knows the target role.
- As a user, I can add role requirements (must-have/nice-to-have) so the AI prioritizes them.
- As a user, I can paste my current resume so the AI can rewrite it to match the role.
- As a user, I can upload my resume (PDF/DOCX) so I don't have to copy/paste.
- As a user, I can chat with the AI to iterate ("make this bullet more impact-focused", "add metrics", "tailor for leadership").
- As a user, I can request a full tailored resume draft and also request section-only updates.
- As a user, I can review changes, accept/reject edits, and keep multiple versions.
- As a user, I can export the final resume in an ATS-friendly format.
- As a user, I can delete an application and its data.

## Non-Goals
- Guaranteed job placement or interview outcomes.
- Fully automated applications, auto-filling job boards, or sending emails on the user's behalf.
- Generating fake credentials or unverifiable claims (e.g., degrees, employers, certifications).
- Building a full recruiter-facing ATS.
- Cover letter generation is out of MVP (can be added later).

## Functional Requirements
### 1) Core flows
- Create/manage "Applications" (one per target role/company).
- Input job posting:
  - Paste freeform text.
  - Optional fields: company, role title, location, seniority.
  - Optional structured requirements: must-have / nice-to-have / keywords.
- Input user background:
  - Paste resume text.
  - Upload resume file: PDF and DOCX (MVP); validate size limits.
  - Parse into structured sections when possible; fall back to plain text if parsing fails.

### 2) AI processing
- Job analysis:
  - Extract responsibilities, must-have skills, nice-to-have skills, and domain keywords.
  - Identify seniority signals (IC vs manager, years, leadership expectations).
- Resume analysis:
  - Detect gaps vs job requirements.
  - Flag unclear bullets, missing metrics, repetition, and weak verbs.
  - Detect potential red flags (inconsistencies, overly long bullets, missing context).
- Tailoring/generation:
  - Generate a tailored professional summary.
  - Rewrite experience bullets to emphasize relevant impact while preserving factual claims.
  - Suggest skills list alignment and keyword coverage.
  - Ask clarifying questions when needed (e.g., missing metrics, tools used, scope).

### 3) Chat experience
- Chat UI tied to the current Application.
- Messages can reference:
  - The job description/requirements.
  - The user's resume content.
  - The current edited resume draft.
- Provide quick actions (buttons) in chat:
  - "Generate tailored resume"
  - "Improve bullet" (selection-based)
  - "Add metrics"
  - "Shorten"
  - "Make more ATS-friendly"
- Streaming responses (token-by-token) if supported by the LLM provider.

### 4) Resume editor + versions
- Editor supports structured sections:
  - Header (name/contact), Summary, Experience, Projects, Skills, Education, Certifications (optional).
- Maintain versions:
  - Save snapshots (manual save and/or auto-save).
  - Compare versions (diff view is a stretch goal; at minimum, labeled versions).
- Provide "truth guardrails":
  - The system should not invent employers, dates, degrees, titles, or certifications.
  - If info is missing, ask the user or mark as TODO.

### 5) Export
- Copy to clipboard (plain text / markdown-like formatting).
- Download:
  - PDF (from a consistent template), and/or
  - DOCX (optional for MVP if PDF is hard).
- Output should be ATS-friendly: consistent headings, simple layout, no tables for MVP.

### 6) Accounts and data (MVP defaults)
- MVP can be "no login" (local-only) or "email login"; see Open Questions.
- Users can delete their data.
- If storing on server: encrypt at rest and restrict access.

### 7) Safety, policy, and transparency
- Disclose that AI may be inaccurate and user must verify content.
- Provide an explicit "Do not fabricate" constraint in the system behavior.
- Basic prompt-injection defenses:
  - Treat uploaded/pasted content as untrusted input.
  - Do not reveal system prompts or secrets.

### 8) Observability (minimum)
- Capture non-sensitive telemetry (errors, latency, token usage) without storing raw resume/job text by default.

## Non-Functional Requirements
- Usability:
  - Mobile responsive; chat and editor usable on small screens.
  - Fast time-to-first-token for chat; clear loading states.
- Performance:
  - Typical request completes within ~10-20s; streaming preferred.
  - File upload parsing should complete within ~30s for normal resumes.
- Reliability:
  - Graceful degradation if parsing fails (allow manual paste).
  - Retry/backoff on transient LLM/API errors.
- Security & privacy:
  - Avoid storing user content unless necessary.
  - If stored, encrypt at rest; secure transport (HTTPS).
  - Clearly describe retention policy.
- Compliance (best-effort):
  - Respect provider ToS; do not process prohibited content.
- Maintainability:
  - Clear separation: UI, orchestration, prompt templates, parsing, export.
- Cost control:
  - Limit max tokens; summarize long job posts/resumes.
  - Per-request quotas and rate limiting.

## Open Questions
1) Auth: should MVP support accounts (email/OAuth) or be local-only in the browser?
2) LLM provider: OpenAI, Anthropic, Gemini, or self-hosted? Any budget constraints?
3) Data retention: should we store job/resume content on the server, and for how long? Or keep everything client-side?
4) Export format priority: PDF vs DOCX vs "copy/paste" only for MVP?
5) Parsing: is "good enough" extraction acceptable, or do you need high-fidelity PDF/DOCX parsing?
6) Target regions/languages: English-only for MVP?
7) Tone constraints: conservative/ATS-first vs more "modern" voice?
8) Should it also generate a cover letter, LinkedIn summary, or interview prep (future scope)?
