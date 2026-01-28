import { appDb } from '@/shared/lib/db/appDb';
import { uuid } from '@/shared/lib/id';

import type { Application, JobAnalysis, Requirements, ResumeAnalysis, UUID } from './types';

function now() {
  return Date.now();
}

export async function createApplication(): Promise<Application> {
  const t = now();
  const app: Application = {
    id: uuid(),
    createdAt: t,
    updatedAt: t,
    title: 'Untitled',
    job: {
      company: '',
      roleTitle: '',
      location: '',
      seniority: '',
      descriptionText: '',
      requirements: {
        mustHave: [],
        niceToHave: [],
        keywords: [],
      },
    },
    resumeSourceText: '',
    resumeDraft: {
      headline: '',
      summary: '',
      experience: [],
      projects: '',
      skills: '',
      education: '',
    },
  };

  await appDb.applications.put(app);
  return app;
}

export async function listApplications(): Promise<Application[]> {
  return appDb.applications.orderBy('updatedAt').reverse().toArray();
}

export async function getApplication(id: UUID): Promise<Application | undefined> {
  return appDb.applications.get(id);
}

export async function updateApplicationTitle(id: UUID, title: string) {
  await appDb.applications.update(id, { title, updatedAt: now() });
}

export async function updateJobFields(
  id: UUID,
  patch: Partial<Application['job']>,
) {
  const app = await appDb.applications.get(id);
  if (!app) return;
  await appDb.applications.put({
    ...app,
    updatedAt: now(),
    job: {
      ...app.job,
      ...patch,
    },
  });
}

export async function updateRequirements(id: UUID, next: Requirements) {
  const app = await appDb.applications.get(id);
  if (!app) return;
  await appDb.applications.put({
    ...app,
    updatedAt: now(),
    job: {
      ...app.job,
      requirements: next,
    },
  });
}

export async function updateResumeSourceText(id: UUID, resumeSourceText: string) {
  await appDb.applications.update(id, { resumeSourceText, updatedAt: now() });
}

export async function updateJobAnalysis(id: UUID, jobAnalysis: JobAnalysis) {
  await appDb.applications.update(id, { jobAnalysis, updatedAt: now() });
}

export async function updateResumeAnalysis(id: UUID, resumeAnalysis: ResumeAnalysis) {
  await appDb.applications.update(id, { resumeAnalysis, updatedAt: now() });
}

export async function updateResumeAnalysisAnswers(id: UUID, resumeAnalysisAnswers: Record<string, string>) {
  await appDb.applications.update(id, { resumeAnalysisAnswers, updatedAt: now() });
}

export async function updateResumeDraft(id: UUID, resumeDraft: Application['resumeDraft']) {
  await appDb.applications.update(id, { resumeDraft, updatedAt: now() });
}

export async function deleteApplication(id: UUID) {
  await appDb.transaction('rw', appDb.applications, appDb.resumeSnapshots, appDb.chatMessages, async () => {
    await appDb.applications.delete(id);
    await appDb.resumeSnapshots.where('applicationId').equals(id).delete();
    await appDb.chatMessages.where('applicationId').equals(id).delete();
  });
}
