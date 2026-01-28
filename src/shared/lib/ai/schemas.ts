import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const RequirementBucketSchema = z.enum(['mustHave', 'niceToHave', 'keywords']);

export const JobAnalysisSchema = z
  .object({
    role: z
      .object({
        company: z.string().optional(),
        title: z.string().optional(),
        location: z.string().optional(),
        seniority: z.string().optional(),
        function: z.string().optional(),
        level: z.enum(['intern', 'junior', 'mid', 'senior', 'staff', 'principal', 'manager', 'director', 'unknown']),
      })
      .describe('Best-effort extraction of role metadata'),

    responsibilities: z
      .array(z.string())
      .min(1)
      .describe('Key responsibilities and expectations from the job description'),

    skills: z
      .object({
        required: z.array(z.string()).describe('Must-have skills and tools'),
        preferred: z.array(z.string()).describe('Nice-to-have skills and tools'),
        keywords: z.array(z.string()).describe('ATS keywords, acronyms, domains'),
      })
      .describe('Extracted skills and keywords'),

    senioritySignals: z
      .object({
        years: z.number().int().nonnegative().optional(),
        leadership: z.boolean().optional(),
        scopeSignals: z.array(z.string()).describe('Phrases signaling scope/ownership/impact'),
      })
      .describe('Signals that hint at seniority and scope'),

    requirementMapping: z
      .array(
        z.object({
          bucket: RequirementBucketSchema,
          item: z.string(),
          normalized: z.string().optional(),
        }),
      )
      .describe('Normalized structured requirements (from chips) for later coverage scoring'),

    clarifyingQuestions: z
      .array(
        z.object({
          question: z.string(),
          reason: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
        }),
      )
      .describe('Questions to ask the user to improve tailoring accuracy'),
  })
  .strict();

export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;

export const ResumeAnalysisSchema = z
  .object({
    overall: z
      .object({
        matchScore: z.number().min(0).max(100),
        summary: z.string(),
      })
      .describe('Top-level assessment of fit'),

    strengths: z.array(z.string()).describe('Strong matches between resume and job'),
    gaps: z.array(z.string()).describe('Missing or weakly evidenced requirements'),

    // requirementCoverage: z
    //   .array(
    //     z.object({
    //       bucket: RequirementBucketSchema,
    //       item: z.string(),
    //       covered: z.boolean(),
    //       evidence: z.string().optional(),
    //     }),
    //   )
    //   .describe('Coverage per structured requirement item'),

    bulletsCritique: z
      .array(
        z.object({
          excerpt: z.string().describe('Original bullet excerpt'),
          issues: z.array(z.enum(['no_metric', 'vague', 'too_long', 'weak_verb', 'redundant', 'unclear_scope', 'missing_tools'])),
          suggestions: z.array(z.string()).describe('Concrete improvement suggestions'),
        }),
      )
      .describe('Issues detected in current resume bullets'),

    redFlags: z
      .array(
        z.object({
          flag: z.string(),
          reason: z.string(),
          severity: z.enum(['low', 'medium', 'high']),
        }),
      )
      .describe('Potential inconsistencies or risks to verify'),

    clarifyingQuestions: z
      .array(
        z.object({
          question: z.string(),
          reason: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
        }),
      )
      .describe('Questions to ask user to improve tailoring accuracy'),
  })
  .strict();

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

// Tailoring-first schemas (kept intentionally shallow so we can pass them to
// Gemini's GenerationConfig.responseJsonSchema without hitting nesting limits).
export const JobAnalysisCoreSchema = z
  .object({
    schema: z.literal('job_analysis_core.v1'),
    job: z
      .object({
        company: z.string().optional(),
        title: z.string().optional(),
        location: z.string().optional(),
        level: z.enum(['intern', 'junior', 'mid', 'senior', 'staff', 'principal', 'manager', 'director', 'unknown']),
        function: z.string().optional(),
      })
      .strict(),
    req: z
      .object({
        must: z.array(z.string()),
        nice: z.array(z.string()),
        keywords: z.array(z.string()),
      })
      .strict(),
    signals: z
      .object({
        minYears: z.number().int().nonnegative().optional(),
        leadership: z.boolean().optional(),
        ownership: z.boolean().optional(),
        domain: z.array(z.string()).optional(),
      })
      .strict(),
  })
  .strict();

export type JobAnalysisCore = z.infer<typeof JobAnalysisCoreSchema>;

export const ResumeAnalysisCoreSchema = z
  .object({
    schema: z.literal('resume_analysis_core.v1'),
    overall: z
      .object({
        matchScore: z.number().min(0).max(100),
        summary: z.string(),
      })
      .strict(),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    recommendations: z.array(z.string()),
    missingInfo: z
      .array(
        z
          .object({
            question: z.string().optional().describe('A direct question the candidate can answer'),
            field: z.string().describe('What information is missing (e.g., metric, tool, scope, timeline)'),
            why: z.string().describe('How it would improve tailoring or credibility'),
            exampleAnswer: z.string().optional().describe('An example of the kind of answer expected'),
            priority: z.enum(['high', 'medium', 'low']),
          })
          .strict(),
      )
      .describe('Concrete missing information detected from the resume that would strengthen tailoring'),
  })
  .strict();

export type ResumeAnalysisCore = z.infer<typeof ResumeAnalysisCoreSchema>;

export const CombinedTailoringAnalysisSchema = z
  .object({
    jobAnalysis: JobAnalysisCoreSchema,
    resumeAnalysis: ResumeAnalysisCoreSchema,
  })
  .strict();

export type CombinedTailoringAnalysis = z.infer<typeof CombinedTailoringAnalysisSchema>;

export const CombinedJobResumeAnalysisSchema = z
  .object({
    jobAnalysis: JobAnalysisSchema,
    resumeAnalysis: ResumeAnalysisSchema,
  })
  .strict();

export type CombinedJobResumeAnalysis = {
  jobAnalysis: JobAnalysis;
  resumeAnalysis: ResumeAnalysis;
};

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

function toJsonSchema(schema: z.ZodTypeAny) {
  // zod-to-json-schema can end up with a different zod type identity.
  // Casting through the function's parameter type keeps this file type-safe.
  return zodToJsonSchema(schema as unknown as ZodToJsonSchemaInput);
}

export function jobAnalysisJsonSchema() {
  return toJsonSchema(JobAnalysisSchema);
}

export function resumeAnalysisJsonSchema() {
  return toJsonSchema(ResumeAnalysisSchema);
}

export function combinedJobResumeAnalysisJsonSchema() {
  return toJsonSchema(CombinedJobResumeAnalysisSchema);
}

export function combinedTailoringAnalysisJsonSchema() {
  return toJsonSchema(CombinedTailoringAnalysisSchema);
}
