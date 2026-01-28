import type { JobPosting } from '@/entities/application/model/types';
import { geminiClient } from '@/shared/lib/ai/gemini';
import { jobAnalysisPrompt } from '@/shared/lib/ai/prompts';
import { jobAnalysisJsonSchema,JobAnalysisSchema } from '@/shared/lib/ai/schemas';
import { logger } from '@/shared/lib/logger';

export const runtime = 'nodejs';

type ReqBody = {
  job: JobPosting;
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

  const ai = geminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: jobAnalysisPrompt({
      jobDescriptionText: body.job.descriptionText,
      jobMeta: {
        company: body.job.company,
        roleTitle: body.job.roleTitle,
        location: body.job.location,
        seniority: body.job.seniority,
      },
      requirements: body.job.requirements,
    }),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: jobAnalysisJsonSchema(),
      temperature: 0.2,
      maxOutputTokens: 4096,
    },
  });

  if (typeof response.text !== 'string' || !response.text.trim()) {
    return Response.json({ error: 'Empty model response' }, { status: 502 });
  }

  logger.info(
    {
      kind: 'gemini.job-analysis.response',
      textLen: response.text.length,
      textPreview: response.text.slice(0, 500),
    },
    'Gemini job analysis response received',
  );

  let json: unknown;
  try {
    json = JSON.parse(response.text);
  } catch (err) {
    logger.error(
      {
        kind: 'gemini.job-analysis.json-parse-error',
        message: err instanceof Error ? err.message : String(err),
        textLen: response.text.length,
        textPreview: response.text.slice(0, 1000),
      },
      'Failed to parse Gemini job analysis JSON',
    );
    return Response.json({ error: 'Model returned invalid JSON (job analysis)' }, { status: 502 });
  }

  const parsed = JobAnalysisSchema.safeParse(json);
  if (!parsed.success) {
    logger.error(
      {
        kind: 'gemini.job-analysis.schema-parse-error',
        issues: parsed.error.issues,
        textLen: response.text.length,
        textPreview: response.text.slice(0, 1000),
      },
      'Gemini job analysis JSON did not match schema',
    );
    return Response.json({ error: 'Model output did not match schema (job analysis)' }, { status: 502 });
  }

  return Response.json({ data: parsed.data });
}
