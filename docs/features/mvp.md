# MVP features

This document describes the current MVP functionality shipped in this repo.

## Core workflow

1. Create an application (stored locally).
2. Paste job description + add structured requirement chips (must-have / nice-to-have / keywords).
3. Upload a resume (PDF/DOCX) or paste resume text.
4. Run analysis (job + resume in one AI call).
5. Answer targeted missing-info questions (with “Use suggested” helper).
6. Generate a tailored resume draft.
7. Review the draft + copy/download the JSON.

## Data model (local-first)

- All data is stored locally in the browser (Dexie / IndexedDB).
- Each application stores:
  - Job posting fields + description
  - Requirements chips
  - Resume source text
  - AI outputs:
    - `jobAnalysis` (core schema)
    - `resumeAnalysis` (core schema)
    - `resumeAnalysisAnswers` (candidate answers keyed by question id)
  - `resumeDraft` (generated output)

## Application management

- Applications sidebar to switch between saved applications.
- Auto-save on edits.
- Delete application (also deletes associated snapshots/messages).

## Job input

- Editable fields: company, role title, location, seniority.
- Paste job description text.
- Requirement chips:
  - must-have
  - nice-to-have
  - keywords

## Resume input

- Upload PDF/DOCX (parses to text) or paste resume text.

## AI: resume vs job analysis (one-call)

- Button: **Analyze resume vs job**.
- Endpoint: `POST /api/ai/resume-analysis`
  - Input: `{ job, resumeText }`
  - Output: `{ data: { jobAnalysis, resumeAnalysis } }`
  - Uses a shallow JSON schema to avoid Gemini JSON schema nesting limits.

### Resume analysis UI

- Displays:
  - match score + progress bar
  - summary
  - strengths
  - gaps
  - “Questions to improve tailoring” (derived from `resumeAnalysis.missingInfo[]`)
- Answers:
  - Editable textareas per question
  - Persisted in Dexie (`resumeAnalysisAnswers`)
  - CTA: **Use suggested** (fills the textarea with `exampleAnswer` when available)
  - CTA: **Save answers**

## AI: tailored resume generation

- Button: **Generate tailored resume**.
- Endpoint: `POST /api/ai/resume-generate`
  - Input: `{ job, resumeText, jobAnalysis?, resumeAnalysis?, answers? }`
  - Output: `{ data: ResumeDraft }`
  - Constraints: conservative generation (no invented facts; answers can be used).

### ResumeDraft shape

- `headline`: string (markdown-ish)
- `summary`: string (markdown-ish)
- `experience`: **structured array** of roles
  - `company`, `title` (required)
  - `location?`, `startDate?`, `endDate?`
  - `bullets[]`
- `projects`: string (markdown-ish)
- `skills`: string (markdown-ish)
- `education`: string (markdown-ish)

## Resume draft UI

- Displays all sections.
- Experience renders as iterable cards + bullet lists.
- CTAs:
  - **Copy JSON** (copies `resumeDraft` to clipboard)
  - **Download JSON** (downloads `resumeDraft-{applicationId}.json`)

## Current limitations / non-goals (MVP)

- No server-side persistence; browser-only storage.
- No resume editor UI for in-place editing yet (draft is displayed read-only).
- No export to PDF/DOCX yet.
- No chat workflow surfaced yet (placeholder only).
