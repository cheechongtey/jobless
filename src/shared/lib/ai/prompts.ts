import type { Application } from '@/entities/application/model/types';

import type { JobAnalysis } from './schemas';

function joinNonEmpty(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join('\n');
}

export function resumeDraftValidatePrompt(input: {
  resumeText: string;
  answers: Record<string, string> | undefined;
  jobDescriptionText: string;
  jobMeta: Pick<Application['job'], 'company' | 'roleTitle' | 'location' | 'seniority'>;
  jobAnalysis: unknown;
  resumeAnalysis: unknown;
  draft: unknown;
}) {
  const { resumeText, answers, jobDescriptionText, jobMeta, jobAnalysis, resumeAnalysis, draft } =
    input;
  return joinNonEmpty([
    'You are a strict resume QA validator.',
    'Return ONLY valid JSON matching the provided JSON Schema.',
    'Do NOT include markdown, code fences, comments, or extra text. JSON only.',
    '',
    'Goal: detect unsupported claims, generic filler, and unmet must-have requirements.',
    '',
    'Rules:',
    '- You may ONLY treat claims as supported if they are present in resumeText, answers, or (if present) requirementCoverage[].allowedClaim in the provided analysis JSON.',
    '- If any bullet appears to introduce new tools/metrics/claims not supported, set grounded="no" and list them in potentialFabrications.',
    '- Identify must-have requirements (jobRequirements[].priority == "must") that are NOT clearly addressed in the draft; put their ids in unmetMustRequirementIds.',
    '- If unmet must requirements could be addressed using existing allowedClaim evidence, set needsRevision=true and write fixInstructions specifying exactly what to change.',
    '- NEVER suggest adding new facts. If information is missing, add follow-up questions instead.',
    '',
    'Output example (shape only; do not copy text):',
    '{"needsRevision":false,"grounded":"yes","unmetMustRequirementIds":[],"potentialFabrications":[],"genericPhrases":[],"fixInstructions":"","followUpQuestions":[]}',
    '',
    'Job meta:',
    JSON.stringify(jobMeta),
    '',
    'Job description:',
    jobDescriptionText,
    '',
    'Job analysis (JSON):',
    JSON.stringify(jobAnalysis),
    '',
    'Resume analysis (JSON):',
    JSON.stringify(resumeAnalysis),
    '',
    'Candidate answers (JSON):',
    JSON.stringify(answers ?? {}),
    '',
    'Resume source text:',
    resumeText,
    '',
    'Generated resume draft (JSON):',
    JSON.stringify(draft),
  ]);
}

export function jobAnalysisPrompt(input: {
  jobDescriptionText: string;
  jobMeta: Pick<Application['job'], 'company' | 'roleTitle' | 'location' | 'seniority'>;
  requirements: Application['job']['requirements'];
}) {
  const { jobDescriptionText, jobMeta, requirements } = input;
  return joinNonEmpty([
    'You are an expert resume strategist. Extract structured job information.',
    'Return ONLY valid JSON that matches the provided JSON Schema.',
    '',
    'Job meta:',
    JSON.stringify(jobMeta),
    '',
    'Structured requirements (user-provided):',
    JSON.stringify(requirements),
    '',
    'Job description:',
    jobDescriptionText,
  ]);
}

export function resumeAnalysisPrompt(input: {
  jobAnalysis: JobAnalysis | null;
  resumeText: string;
}) {
  const { jobAnalysis, resumeText } = input;
  return joinNonEmpty([
    'You are an expert resume reviewer. Compare the resume against the job analysis.',
    'Be conservative: do not invent facts; only cite evidence present in the resume text.',
    'Return ONLY valid JSON that matches the provided JSON Schema.',
    '',
    'Job analysis JSON:',
    JSON.stringify(jobAnalysis),
    '',
    'Resume text:',
    resumeText,
  ]);
}

export function combinedJobResumeAnalysisPrompt(input: {
  jobDescriptionText: string;
  jobMeta: Pick<Application['job'], 'company' | 'roleTitle' | 'location' | 'seniority'>;
  requirements: Application['job']['requirements'];
  resumeText: string;
}) {
  const { jobDescriptionText, jobMeta, requirements, resumeText } = input;
  return joinNonEmpty([
    'You are an expert resume strategist and resume reviewer.',
    'Return a SINGLE JSON object with EXACTLY two top-level keys: "jobAnalysis" and "resumeAnalysis".',
    'The JSON must match the provided JSON Schema.',
    'Be conservative: do not invent facts; only cite evidence present in the resume text.',
    '',
    'Job meta:',
    JSON.stringify(jobMeta),
    '',
    'Structured requirements (user-provided):',
    JSON.stringify(requirements),
    '',
    'Job description:',
    jobDescriptionText,
    '',
    'Resume text:',
    resumeText,
  ]);
}

export function combinedTailoringAnalysisPrompt(input: {
  jobDescriptionText: string;
  jobMeta: Pick<Application['job'], 'company' | 'roleTitle' | 'location' | 'seniority'>;
  requirements: Application['job']['requirements'];
  resumeText: string;
}) {
  const { jobDescriptionText, jobMeta, requirements, resumeText } = input;
  return joinNonEmpty([
    'You are an expert resume strategist and resume reviewer.',
    'Return a SINGLE JSON object with EXACTLY two top-level keys: "jobAnalysis" and "resumeAnalysis".',
    'The JSON must match the provided JSON Schema.',
    'Be conservative: do not invent facts; only cite evidence present in the resume text.',
    '',
    'Output constraints:',
    '- jobAnalysis.schema must be "job_analysis_core.v1"',
    '- resumeAnalysis.schema must be "resume_analysis_core.v1"',
    '- Do NOT ask generic open-ended questions. Instead, populate resumeAnalysis.missingInfo with concrete, answerable missing details.',
    '- For each resumeAnalysis.missingInfo item, include a concise candidate-facing question in missingInfo.question whenever possible.',
    '- Keep lists short (prefer 5-10 items each) and remove duplicates.',
    '',
    'Tailoring enforcement (critical):',
    '- If the schema allows optional tailoring fields, populate them: targetRoleTitle, jobKeywords, jobRequirements, requirementCoverage.',
    '- jobRequirements: extract 6-14 requirements from the job description (dedupe). Assign id "R1".."R{n}". Include priority (must/preferred) and a short category.',
    '- requirementCoverage: for EACH jobRequirements item, decide status covered/partial/missing/not_applicable by checking the resume text ONLY.',
    '  - evidence MUST be a short quote or very tight paraphrase grounded in resume text (or empty string if missing).',
    '  - evidenceSource MUST be "resume" when evidence comes from resume text. If you rely on candidate answers later, mark as "answer" (but you do not have answers now).',
    '  - allowedClaim MUST be the tightest safe claim the writer can include without embellishment.',
    '  - rewriteHint: how to phrase it to match this job (no new facts).',
    '  - followUpQuestion: if partial/missing, a concrete question the candidate can answer; otherwise empty string.',
    '- jobKeywords: 8-20 nouns/tools/domains from the job post. These are NOT licenses to claim skills; they are target phrasing only.',
    '',
    'Job meta:',
    JSON.stringify(jobMeta),
    '',
    'Structured requirements (user-provided):',
    JSON.stringify(requirements),
    '',
    'Job description:',
    jobDescriptionText,
    '',
    'Resume text:',
    resumeText,
  ]);
}

export function resumeDraftPrompt(input: {
  jobDescriptionText: string;
  jobMeta: Pick<Application['job'], 'company' | 'roleTitle' | 'location' | 'seniority'>;
  requirements: Application['job']['requirements'];
  resumeText: string;
  jobAnalysis: unknown;
  resumeAnalysis: unknown;
  answers: Record<string, string> | undefined;
}) {
  const {
    jobDescriptionText,
    jobMeta,
    requirements,
    resumeText,
    jobAnalysis,
    resumeAnalysis,
    answers,
  } = input;
  return joinNonEmpty([
    'You are an expert resume writer. Produce a tailored resume draft for this job.',
    'Return ONLY valid JSON that matches the provided JSON Schema.',
    'Be conservative: do not invent facts. Only use details present in the resume text or in the provided answers.',
    '',
    'Grounding rules (critical):',
    '- Every claim MUST be supported by either resumeText, answers, or (if present) requirementCoverage[].allowedClaim from the analysis JSON.',
    '- Never introduce new tools/technologies, certifications, degrees, titles, dates, employers, responsibilities, or metrics not present.',
    '- If a must-have requirement is missing/partial and cannot be supported, do NOT fake it. Prefer omission or conservative phrasing.',
    '- Avoid generic filler ("results-driven", "team player", "responsible for", etc.) unless strongly supported by evidence.',
    '- Prefer job-relevant nouns (from job keywords) ONLY when grounded in evidence; do not keyword-stuff.',
    '',
    'Formatting rules:',
    '- Each field is markdown-ish plain text.',
    '- Experience must be a JSON array of roles. Each role must have company/title and a bullets array of strings.',
    '- Use concise bullets (start with strong verbs).',
    '- Include metrics ONLY if present in resume or answers.',
    '- Keep sections tight and scannable.',
    '',
    'Coverage target:',
    '- Address as many must-have requirements as possible without inventing facts.',
    '- Rewrite bullets to align with the job: action + scope + tools + outcome (only when supported).',
    '',
    'Job meta:',
    JSON.stringify(jobMeta),
    '',
    'Structured requirements (user-provided):',
    JSON.stringify(requirements),
    '',
    'Job description:',
    jobDescriptionText,
    '',
    'Job analysis (JSON):',
    JSON.stringify(jobAnalysis),
    '',
    'Resume analysis (JSON):',
    JSON.stringify(resumeAnalysis),
    '',
    'Candidate answers (JSON):',
    JSON.stringify(answers ?? {}),
    '',
    'Resume source text:',
    resumeText,
  ]);
}
