import type { JobAnalysis, JobPosting, ResumeAnalysis } from '@/entities/application/model/types';
import { logger } from '@/shared/lib/logger';

import { generateDraft, validateDraft } from './utils';

export const runtime = 'nodejs';

type ReqBody = {
  job: JobPosting;
  resumeText: string;
  jobAnalysis?: JobAnalysis;
  resumeAnalysis?: ResumeAnalysis;
  answers?: Record<string, string>;
};

export async function POST(req: Request) {
  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.job || typeof body.job.descriptionText !== 'string') {
    return Response.json({ error: 'Missing job payload' }, { status: 400 });
  }

  if (typeof body.resumeText !== 'string' || !body.resumeText.trim()) {
    return Response.json({ error: 'Missing resumeText' }, { status: 400 });
  }

  try {
    const draft1 = await generateDraft({
      job: body.job,
      resumeText: body.resumeText,
      jobAnalysis: body.jobAnalysis ?? null,
      resumeAnalysis: body.resumeAnalysis ?? null,
      answers: body.answers,
    });

    const report = await validateDraft({
      job: body.job,
      resumeText: body.resumeText,
      jobAnalysis: body.jobAnalysis ?? null,
      resumeAnalysis: body.resumeAnalysis ?? null,
      answers: body.answers,
      draft: draft1,
    });

    // Fail-open: if validator can't produce a valid report, keep the first draft.
    if (!report) {
      return Response.json({ data: draft1 });
    }

    if (!report.needsRevision && report.grounded !== 'no') {
      return Response.json({ data: draft1 });
    }

    const draft2 = await generateDraft({
      job: body.job,
      resumeText: body.resumeText,
      jobAnalysis: body.jobAnalysis ?? null,
      resumeAnalysis: body.resumeAnalysis ?? null,
      answers: body.answers,
      validatorInstructions: report.fixInstructions,
      priorDraft: draft1,
    });

    // Return best-effort second attempt.
    return Response.json({ data: draft2 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      {
        kind: 'gemini.resume-generate.unhandled-error',
        message,
      },
      'Unhandled error in resume generation'
    );
    return Response.json({ error: message }, { status: 500 });
  }
}
