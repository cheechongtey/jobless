import type { JobAnalysis, JobPosting, ResumeAnalysis } from '@/entities/application/model/types';
import { geminiClient } from '@/shared/lib/ai/gemini';
import { resumeDraftPrompt, resumeDraftValidatePrompt } from '@/shared/lib/ai/prompts';
import type { ResumeDraftValidatorReport } from '@/shared/lib/ai/schemas';
import {
  resumeDraftJsonSchema,
  ResumeDraftSchema,
  resumeDraftValidatorReportJsonSchema,
  ResumeDraftValidatorReportSchema,
} from '@/shared/lib/ai/schemas';
import { logger } from '@/shared/lib/logger';

const ai = geminiClient();

export async function generateDraft(args: {
  job: JobPosting;
  resumeText: string;
  jobAnalysis: JobAnalysis | null;
  resumeAnalysis: ResumeAnalysis | null;
  answers: Record<string, string> | undefined;
  validatorInstructions?: string;
  priorDraft?: unknown;
}) {
  const {
    job,
    resumeText,
    jobAnalysis,
    resumeAnalysis,
    answers,
    validatorInstructions,
    priorDraft,
  } = args;

  const prompt =
    typeof validatorInstructions === 'string' && validatorInstructions.trim()
      ? `${resumeDraftPrompt({
          jobDescriptionText: job.descriptionText,
          jobMeta: {
            company: job.company,
            roleTitle: job.roleTitle,
            location: job.location,
            seniority: job.seniority,
          },
          requirements: job.requirements,
          resumeText,
          jobAnalysis,
          resumeAnalysis,
          answers,
        })}\n\nValidator fix instructions (follow exactly, do not add facts):\n${validatorInstructions}\n\nPrior draft (for reference):\n${JSON.stringify(priorDraft ?? {})}`
      : resumeDraftPrompt({
          jobDescriptionText: job.descriptionText,
          jobMeta: {
            company: job.company,
            roleTitle: job.roleTitle,
            location: job.location,
            seniority: job.seniority,
          },
          requirements: job.requirements,
          resumeText,
          jobAnalysis,
          resumeAnalysis,
          answers,
        });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: resumeDraftJsonSchema(),
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  });

  if (typeof response.text !== 'string' || !response.text.trim()) {
    throw new Error('Empty model response');
  }

  logger.info(
    {
      kind: 'gemini.resume-generate.response',
      textLen: response.text.length,
      textPreview: response.text.slice(0, 500),
    },
    'Gemini resume generation response received'
  );

  let json: unknown;
  try {
    json = JSON.parse(response.text);
  } catch (err) {
    logger.error(
      {
        kind: 'gemini.resume-generate.json-parse-error',
        message: err instanceof Error ? err.message : String(err),
        textLen: response.text.length,
        textPreview: response.text.slice(0, 1000),
      },
      'Failed to parse Gemini resume generation JSON'
    );
    throw new Error('Model returned invalid JSON (resume generation)');
  }

  const parsed = ResumeDraftSchema.safeParse(json);
  if (!parsed.success) {
    logger.error(
      {
        kind: 'gemini.resume-generate.schema-parse-error',
        issues: parsed.error.issues,
        textLen: response.text.length,
        textPreview: response.text.slice(0, 1000),
      },
      'Gemini resume generation JSON did not match schema'
    );
    throw new Error('Model output did not match schema (resume generation)');
  }

  return parsed.data;
}

export async function validateDraft(args: {
  job: JobPosting;
  resumeText: string;
  jobAnalysis: JobAnalysis | null;
  resumeAnalysis: ResumeAnalysis | null;
  answers: Record<string, string> | undefined;
  draft: unknown;
}): Promise<ResumeDraftValidatorReport | null> {
  const { job, resumeText, jobAnalysis, resumeAnalysis, answers, draft } = args;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: resumeDraftValidatePrompt({
      jobDescriptionText: job.descriptionText,
      jobMeta: {
        company: job.company,
        roleTitle: job.roleTitle,
        location: job.location,
        seniority: job.seniority,
      },
      jobAnalysis,
      resumeAnalysis,
      answers,
      resumeText,
      draft,
    }),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: resumeDraftValidatorReportJsonSchema(),
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  });

  if (typeof response.text !== 'string' || !response.text.trim()) {
    throw new Error('Empty model response (draft validator)');
  }

  logger.info(
    {
      kind: 'gemini.resume-generate.validator.response',
      textLen: response.text.length,
      textPreview: response.text.slice(0, 500),
    },
    'Gemini resume draft validator response received'
  );

  let json: unknown;
  try {
    json = JSON.parse(response.text);
  } catch (err) {
    logger.error(
      {
        kind: 'gemini.resume-generate.validator.json-parse-error',
        message: err instanceof Error ? err.message : String(err),
        textLen: response.text.length,
        textPreview: response.text.slice(0, 1000),
      },
      'Failed to parse Gemini draft validator JSON'
    );
    return null;
  }

  const parsed = ResumeDraftValidatorReportSchema.safeParse(json);
  if (!parsed.success) {
    logger.error(
      {
        kind: 'gemini.resume-generate.validator.schema-parse-error',
        issues: parsed.error.issues,
        textLen: response.text.length,
        textPreview: response.text.slice(0, 1000),
      },
      'Gemini draft validator JSON did not match schema'
    );
    return null;
  }

  return parsed.data;
}
