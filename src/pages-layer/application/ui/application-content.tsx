'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import {
  deleteApplication,
  getApplication,
  updateApplicationTitle,
  updateJobAnalysis,
  updateJobFields,
  updateRequirements,
  updateResumeAnalysis,
  updateResumeDraft,
  updateResumeSourceText,
} from '@/entities/application/model/repo';
import type {
  Application,
  JobAnalysis,
  Requirements,
  ResumeAnalysis,
} from '@/entities/application/model/types';
import { RequirementChips } from '@/features/requirements-chips';
import { ResumeUpload } from '@/features/resume-upload';
import { ResumeAnalysisPanel } from '@/pages-layer/application/ui/ResumeAnalysisPanel';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { SidebarTrigger } from '@/shared/ui/sidebar';
import { Textarea } from '@/shared/ui/textarea';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as unknown;
  if (!res.ok) {
    if (
      json &&
      typeof json === 'object' &&
      'error' in json &&
      typeof (json as { error?: unknown }).error === 'string'
    ) {
      throw new Error((json as { error: string }).error);
    }
    throw new Error(`Request failed (${res.status})`);
  }
  return json as T;
}

export function ApplicationContent(props: { id: string }) {
  const app = useLiveQuery(() => getApplication(props.id), [props.id]);
  const [confirming, setConfirming] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  if (app === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <div className="space-y-2 text-center">
          <div className="text-sm font-medium">Application not found...</div>
          <Link className="text-sm underline" href="/">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const requirements: Requirements = app.job.requirements;

  return (
    // <SidebarProvider className="bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
    //   <ApplicationsSidebar activeId={props.id} />
    //   <SidebarInset className="min-h-screen">

    //   </SidebarInset>
    // </SidebarProvider>
    <main className="flex-1 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex items-center gap-2 md:hidden">
          <SidebarTrigger />
          <div className="text-sm font-medium">Jobs</div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Application</div>
            <h1 className="truncate text-lg font-semibold">{app.title}</h1>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Stored locally in your browser. You can delete anytime.
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirming ? (
              <>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await deleteApplication(app.id);
                    window.location.href = '/';
                  }}
                >
                  Confirm delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
                Delete
              </Button>
            )}
            <Button
              disabled={analyzing}
              onClick={async () => {
                try {
                  setAnalyzing(true);
                  const result = await postJson<{
                    data: { jobAnalysis: JobAnalysis; resumeAnalysis: ResumeAnalysis };
                  }>('/api/ai/resume-analysis', {
                    job: app.job,
                    resumeText: app.resumeSourceText,
                  });
                  await updateJobAnalysis(app.id, result.data.jobAnalysis);
                  await updateResumeAnalysis(app.id, result.data.resumeAnalysis);
                  toast.success('Analysis saved');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Analysis failed');
                } finally {
                  setAnalyzing(false);
                }
              }}
            >
              {analyzing ? 'Analyzing…' : 'Analyze resume vs job'}
            </Button>

            <Button
              disabled={
                generating ||
                analyzing ||
                !app.job.descriptionText.trim() ||
                !app.resumeSourceText.trim()
              }
              variant="secondary"
              onClick={async () => {
                try {
                  setGenerating(true);
                  const result = await postJson<{ data: Application['resumeDraft'] }>(
                    '/api/ai/resume-generate',
                    {
                      job: app.job,
                      resumeText: app.resumeSourceText,
                      jobAnalysis: app.jobAnalysis,
                      resumeAnalysis: app.resumeAnalysis,
                      answers: app.resumeAnalysisAnswers,
                    }
                  );
                  await updateResumeDraft(app.id, result.data);
                  toast.success('Draft generated');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Generation failed');
                } finally {
                  setGenerating(false);
                }
              }}
            >
              {generating ? 'Generating…' : 'Generate tailored resume'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="text-sm font-semibold">Basics</div>
              <div className="text-xs text-muted-foreground">Auto-saved</div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Title</div>
                  <Input
                    value={app.title}
                    onChange={(e) => updateApplicationTitle(app.id, e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Company</div>
                  <Input
                    value={app.job.company || ''}
                    onChange={(e) => updateJobFields(app.id, { company: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Role title</div>
                  <Input
                    value={app.job.roleTitle || ''}
                    onChange={(e) => updateJobFields(app.id, { roleTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Location</div>
                  <Input
                    value={app.job.location || ''}
                    onChange={(e) => updateJobFields(app.id, { location: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Seniority</div>
                  <Input
                    value={app.job.seniority || ''}
                    onChange={(e) => updateJobFields(app.id, { seniority: e.target.value })}
                    placeholder="e.g., Senior, Staff, Manager"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-semibold">Job description</div>
            </div>
            <div className="p-4">
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium">Paste the job posting</div>
                  <div className="text-xs text-muted-foreground">
                    We’ll use this as the target for tailoring.
                  </div>
                </div>
                <Textarea
                  value={app.job.descriptionText}
                  onChange={(e) => updateJobFields(app.id, { descriptionText: e.target.value })}
                  placeholder="Responsibilities, requirements, etc."
                  className="min-h-56"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-semibold">Role requirements</div>
            </div>
            <div className="space-y-4 p-4">
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium">Must-have</div>
                  <div className="text-xs text-muted-foreground">
                    Hard requirements you want prioritized
                  </div>
                </div>
                <RequirementChips
                  requirements={requirements}
                  bucket="mustHave"
                  onChange={(next) => updateRequirements(app.id, next)}
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Nice-to-have</div>
                <RequirementChips
                  requirements={requirements}
                  bucket="niceToHave"
                  onChange={(next) => updateRequirements(app.id, next)}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium">Keywords</div>
                  <div className="text-xs text-muted-foreground">ATS keywords, tools, acronyms</div>
                </div>
                <RequirementChips
                  requirements={requirements}
                  bucket="keywords"
                  onChange={(next) => updateRequirements(app.id, next)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-semibold">Your resume</div>
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium">Upload PDF/DOCX (optional)</div>
                  <div className="text-xs text-muted-foreground">
                    If parsing fails, just paste the text below.
                  </div>
                </div>
                <ResumeUpload
                  onParsedText={(text) => updateResumeSourceText(app.id, text)}
                  onError={(msg) => toast.error(msg)}
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Paste resume text</div>
                <Textarea
                  value={app.resumeSourceText}
                  onChange={(e) => updateResumeSourceText(app.id, e.target.value)}
                  placeholder="Paste your current resume here…"
                  className="min-h-56"
                />
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-semibold">Resume Analysis</div>
          </div>
          <div className="space-y-3 p-4">
            <div className="space-y-1">
              <ResumeAnalysisPanel
                applicationId={app.id}
                resumeAnalysis={app.resumeAnalysis}
                answers={app.resumeAnalysisAnswers}
                disabled={analyzing}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="text-sm font-semibold">Resume Draft</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    const blob = new Blob([JSON.stringify(app.resumeDraft, null, 2)], {
                      type: 'application/json;charset=utf-8',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `resumeDraft-${app.id}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    toast.success('Downloaded resumeDraft JSON');
                  } catch {
                    toast.error('Failed to download');
                  }
                }}
              >
                Download JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(JSON.stringify(app.resumeDraft, null, 2));
                    toast.success('Copied resumeDraft JSON');
                  } catch {
                    toast.error('Failed to copy');
                  }
                }}
              >
                Copy JSON
              </Button>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Headline</div>
                <div className="whitespace-pre-wrap text-sm">{app.resumeDraft.headline || '—'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Summary</div>
                <div className="whitespace-pre-wrap text-sm">{app.resumeDraft.summary || '—'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Experience</div>
              {app.resumeDraft.experience?.length ? (
                <div className="space-y-3">
                  {app.resumeDraft.experience.map((item, idx) => (
                    <div
                      key={`${idx}:${item.company}:${item.title}`}
                      className="rounded-lg border bg-background p-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-sm font-medium">
                          {item.title} — {item.company}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {[
                            item.location,
                            item.startDate && item.endDate
                              ? `${item.startDate} – ${item.endDate}`
                              : (item.startDate ?? item.endDate),
                          ]
                            .filter(Boolean)
                            .join(' • ') || '—'}
                        </div>
                      </div>
                      {item.bullets?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                          {item.bullets.map((b, bIdx) => (
                            <li key={`${bIdx}:${b}`}>{b}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground">—</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">—</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Projects</div>
                <div className="whitespace-pre-wrap text-sm">{app.resumeDraft.projects || '—'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">Skills</div>
                <div className="whitespace-pre-wrap text-sm">{app.resumeDraft.skills || '—'}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Education</div>
              <div className="whitespace-pre-wrap text-sm">{app.resumeDraft.education || '—'}</div>
            </div>
          </div>
        </section>

        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground shadow">
          Next: Resume editor + chat will appear here.
        </div>
      </div>
    </main>
  );
}
