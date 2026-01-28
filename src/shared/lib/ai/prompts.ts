import type { Application } from '@/entities/application/model/types';

import type { JobAnalysis } from './schemas';

function joinNonEmpty(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join('\n');
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
