export type UUID = string;

export type Requirements = {
  mustHave: string[];
  niceToHave: string[];
  keywords: string[];
};

export type RequirementBucket = keyof Requirements;

export type JobAnalysis = {
  schema: 'job_analysis_core.v1';
  job: {
    company?: string;
    title?: string;
    location?: string;
    level:
      | 'intern'
      | 'junior'
      | 'mid'
      | 'senior'
      | 'staff'
      | 'principal'
      | 'manager'
      | 'director'
      | 'unknown';
    function?: string;
  };
  req: {
    must: string[];
    nice: string[];
    keywords: string[];
  };
  signals: {
    minYears?: number;
    leadership?: boolean;
    ownership?: boolean;
    domain?: string[];
  };
};

export type ResumeAnalysis = {
  schema: 'resume_analysis_core.v1';
  overall: {
    matchScore: number;
    summary: string;
  };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  missingInfo: Array<{
    question?: string;
    field: string;
    why: string;
    exampleAnswer?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
};

export type JobRequirement = {
  id: string;
  text: string;
  priority: 'must' | 'preferred';
  category: string;
};

export type RequirementCoverageItem = {
  requirementId: string;
  status: 'covered' | 'partial' | 'missing' | 'not_applicable';
  evidence: string;
  evidenceSource: string;
  allowedClaim: string;
  rewriteHint: string;
  followUpQuestion: string;
};

export type JobPosting = {
  company: string;
  roleTitle: string;
  location: string;
  seniority: string;
  descriptionText: string;
  requirements: Requirements;
};

export type ExperienceItem = {
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
};

export type ResumeDraft = {
  headline: string;
  summary: string;
  experience: ExperienceItem[];
  projects: string;
  skills: string;
  education: string;
};

export type Application = {
  id: UUID;
  createdAt: number;
  updatedAt: number;
  title: string;
  job: JobPosting;
  resumeSourceText: string;
  resumeDraft: ResumeDraft;
  jobAnalysis?: JobAnalysis;
  resumeAnalysis?: ResumeAnalysis;
  jobKeywords?: string[];
  targetRoleTitle?: string;
  jobRequirements?: JobRequirement[];
  requirementCoverage?: RequirementCoverageItem[];
  resumeAnalysisAnswers?: Record<string, string>;
};

export type ResumeSnapshot = {
  id: UUID;
  applicationId: UUID;
  createdAt: number;
  label: string;
  resumeDraft: ResumeDraft;
};

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: UUID;
  applicationId: UUID;
  createdAt: number;
  role: ChatRole;
  content: string;
};
