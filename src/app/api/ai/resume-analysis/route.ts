import type { JobPosting } from '@/entities/application/model/types';
import { geminiClient } from '@/shared/lib/ai/gemini';
import { combinedTailoringAnalysisPrompt } from '@/shared/lib/ai/prompts';
import {
  combinedTailoringAnalysisJsonSchema,
  CombinedTailoringAnalysisSchema,
} from '@/shared/lib/ai/schemas';
import { logger } from '@/shared/lib/logger';

export const runtime = 'nodejs';

type ReqBody = {
  job: JobPosting;
  resumeText: string;
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
      contents: combinedTailoringAnalysisPrompt({
        jobDescriptionText: body.job.descriptionText,
        jobMeta: {
          company: body.job.company,
          roleTitle: body.job.roleTitle,
          location: body.job.location,
          seniority: body.job.seniority,
        },
        requirements: body.job.requirements,
        resumeText: body.resumeText,
      }),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: combinedTailoringAnalysisJsonSchema(),
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    });

    if (typeof response.text !== 'string' || !response.text.trim()) {
      return Response.json({ error: 'Empty model response' }, { status: 502 });
    }

    logger.info(
      {
        kind: 'gemini.resume-analysis.one-call.response',
        textLen: response.text.length,
        textPreview: response.text.slice(0, 500),
      },
      'Gemini one-call resume analysis response received',
    );

    let json: unknown;
    try {
      json = JSON.parse(response.text);
    } catch (err) {
      logger.error(
        {
          kind: 'gemini.resume-analysis.one-call.json-parse-error',
          message: err instanceof Error ? err.message : String(err),
          textLen: response.text.length,
          textPreview: response.text.slice(0, 1000),
        },
        'Failed to parse Gemini one-call JSON',
      );
      return Response.json({ error: 'Model returned invalid JSON (one-call resume analysis)' }, { status: 502 });
    }

    const parsed = CombinedTailoringAnalysisSchema.safeParse(json);
    if (!parsed.success) {
      logger.error(
        {
          kind: 'gemini.resume-analysis.one-call.schema-parse-error',
          issues: parsed.error.issues,
          textLen: response.text.length,
          textPreview: response.text.slice(0, 1000),
        },
        'Gemini one-call JSON did not match schema',
      );
      return Response.json({ error: 'Model output did not match schema (one-call resume analysis)' }, { status: 502 });
    }

    return Response.json({ data: parsed.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      {
        kind: 'gemini.resume-analysis.one-call.unhandled-error',
        message,
      },
      'Unhandled error in one-call resume analysis',
    );
    return Response.json({ error: message }, { status: 500 });
  }
}
