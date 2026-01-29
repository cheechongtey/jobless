'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import {
  deleteApplication,
  getApplication,
  updateJobAnalysis,
  updateResumeAnalysis,
  updateResumeDraft,
} from '@/entities/application/model/repo';
import type { Application, JobAnalysis, ResumeAnalysis } from '@/entities/application/model/types';
import { AnalysisResult } from '@/features/resume/analysis-result/ui/analysis-result';
import { JobForm } from '@/features/resume/job-form/ui/job-form';
import { ResumeForm } from '@/features/resume/resume-form/ui/resume-form';
import { Button } from '@/shared/ui/button';

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

  return (
    <main className="p-4 flex-1">
      <div className="min-w-0 mb-4">
        <h1 className="truncate text-xl font-semibold">{app.title}</h1>
      </div>
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <JobForm applicationId={app.id} applicationTitle={app.title} job={app.job} />
          <ResumeForm applicationId={app.id} resumeSourceText={app.resumeSourceText} />
        </div>
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <AnalysisResult
            applicationId={app.id}
            resumeAnalysis={app.resumeAnalysis}
            answers={app.resumeAnalysisAnswers}
            disabled={analyzing}
          />
        </div>

        <div className="flex items-start justify-between gap-3">
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
