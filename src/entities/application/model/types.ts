export type UUID = string;

export type Requirements = {
  mustHave: string[];
  niceToHave: string[];
  keywords: string[];
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
