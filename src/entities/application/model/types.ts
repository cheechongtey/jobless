export type UUID = string;

export type Requirements = {
  mustHave: string[];
  niceToHave: string[];
  keywords: string[];
};

export type RequirementBucket = keyof Requirements;

export type JobAnalysis = {
  role: {
    company?: string;
    title?: string;
    location?: string;
    seniority?: string;
    function?: string;
    level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'manager' | 'director' | 'unknown';
  };
  responsibilities: string[];
  skills: {
    required: string[];
    preferred: string[];
    keywords: string[];
  };
  senioritySignals: {
    years?: number;
    leadership?: boolean;
    scopeSignals: string[];
  };
  requirementMapping: Array<{
    bucket: RequirementBucket;
    item: string;
    normalized?: string;
  }>;
  clarifyingQuestions: Array<{
    question: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
};

export type ResumeAnalysis = {
  overall: {
    matchScore: number;
    summary: string;
  };
  strengths: string[];
  gaps: string[];
  requirementCoverage: Array<{
    bucket: RequirementBucket;
    item: string;
    covered: boolean;
    evidence?: string;
  }>;
  bulletsCritique: Array<{
    excerpt: string;
    issues: Array<'no_metric' | 'vague' | 'too_long' | 'weak_verb' | 'redundant' | 'unclear_scope' | 'missing_tools'>;
    suggestions: string[];
  }>;
  redFlags: Array<{
    flag: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  clarifyingQuestions: Array<{
    question: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
};

export type JobPosting = {
  company: string;
  roleTitle: string;
  location: string;
  seniority: string;
  descriptionText: string;
  requirements: Requirements;
};

export type ResumeDraft = {
  headline: string;
  summary: string;
  experience: string;
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
