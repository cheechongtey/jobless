'use client';

import { TabsContent } from '@radix-ui/react-tabs';
import { useLiveQuery } from 'dexie-react-hooks';
import { DownloadIcon, FileTextIcon, SparklesIcon, Trash2Icon } from 'lucide-react';
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
import { ResumeDraft } from '@/features/resume/resume-draft/ui/resume-draft';
import { ResumeForm } from '@/features/resume/resume-form/ui/resume-form';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

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
  const [analyzing, setAnalyzing] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const canGeneratePdf = Boolean(app?.resumeDraft);

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
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{app.title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center rounded-md border bg-background">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-r-none"
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
                  <FileTextIcon className="size-4" />
                  <span className="hidden sm:inline">Analyze</span>
                  <span className="sr-only sm:not-sr-only">{analyzing ? 'Analyzing…' : ''}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Analyze resume vs job</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none"
                  disabled={
                    generating ||
                    analyzing ||
                    !app.job.descriptionText.trim() ||
                    !app.resumeSourceText.trim()
                  }
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
                  <SparklesIcon className="size-4" />
                  <span className="hidden sm:inline">Generate</span>
                  <span className="sr-only sm:not-sr-only">{generating ? 'Generating…' : ''}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate tailored resume</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none"
                  disabled={!canGeneratePdf}
                  onClick={() => {
                    // Placeholder: hook up real PDF/print export.
                    toast.message('PDF export not implemented yet');
                  }}
                >
                  <DownloadIcon className="size-4" />
                  <span className="hidden sm:inline">PDF</span>
                  <span className="sr-only">Generate PDF</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate PDF</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-l-none text-destructive hover:text-destructive"
                  onClick={() => {
                    toast('Delete this application?', {
                      description: 'This action cannot be undone.',
                      action: {
                        label: 'Delete',
                        onClick: async () => {
                          try {
                            await deleteApplication(app.id);
                            window.location.href = '/';
                          } catch {
                            toast.error('Failed to delete');
                          }
                        },
                      },
                      cancel: {
                        label: 'Cancel',
                        onClick: () => {},
                      },
                    });
                  }}
                >
                  <Trash2Icon className="size-4" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <JobForm applicationId={app.id} applicationTitle={app.title} job={app.job} />
          <ResumeForm applicationId={app.id} resumeSourceText={app.resumeSourceText} />
        </div>
        <div className="space-y-6">
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="draft">Tailored Resume</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-0">
              <AnalysisResult
                applicationId={app.id}
                resumeAnalysis={app.resumeAnalysis}
                answers={app.resumeAnalysisAnswers}
                disabled={analyzing}
              />
            </TabsContent>

            <TabsContent value="draft" className="mt-0">
              <ResumeDraft applicationId={app.id} resumeDraft={app.resumeDraft} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
