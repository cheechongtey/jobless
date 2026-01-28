import type { JobAnalysis, JobPosting, ResumeAnalysis } from '@/entities/application/model/types';
import { geminiClient } from '@/shared/lib/ai/gemini';
import { resumeDraftPrompt } from '@/shared/lib/ai/prompts';
import { resumeDraftJsonSchema,ResumeDraftSchema } from '@/shared/lib/ai/schemas';
import { logger } from '@/shared/lib/logger';

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

  const ai = geminiClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: resumeDraftPrompt({
        jobDescriptionText: body.job.descriptionText,
        jobMeta: {
          company: body.job.company,
          roleTitle: body.job.roleTitle,
          location: body.job.location,
          seniority: body.job.seniority,
        },
        requirements: body.job.requirements,
        resumeText: body.resumeText,
        jobAnalysis: body.jobAnalysis ?? null,
        resumeAnalysis: body.resumeAnalysis ?? null,
        answers: body.answers,
      }),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: resumeDraftJsonSchema(),
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    });

    if (typeof response.text !== 'string' || !response.text.trim()) {
      return Response.json({ error: 'Empty model response' }, { status: 502 });
    }

    logger.info(
      {
        kind: 'gemini.resume-generate.response',
        textLen: response.text.length,
        textPreview: response.text.slice(0, 500),
      },
      'Gemini resume generation response received',
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
        'Failed to parse Gemini resume generation JSON',
      );
      return Response.json({ error: 'Model returned invalid JSON (resume generation)' }, { status: 502 });
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
        'Gemini resume generation JSON did not match schema',
      );
      return Response.json({ error: 'Model output did not match schema (resume generation)' }, { status: 502 });
    }

    return Response.json({ data: parsed.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      {
        kind: 'gemini.resume-generate.unhandled-error',
        message,
      },
      'Unhandled error in resume generation',
    );
    return Response.json({ error: message }, { status: 500 });
  }
}
