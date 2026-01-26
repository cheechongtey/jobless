'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import * as React from 'react';
import { toast } from 'sonner';

import {
  deleteApplication,
  getApplication,
  updateApplicationTitle,
  updateJobFields,
  updateRequirements,
  updateResumeSourceText,
} from '@/entities/application/model/repo';
import type { Requirements } from '@/entities/application/model/types';
import { RequirementChips } from '@/features/requirements-chips';
import { ResumeUpload } from '@/features/resume-upload';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { ApplicationsSidebar } from '@/widgets/applications-sidebar';

function Content(props: { id: string }) {
  const app = useLiveQuery(() => getApplication(props.id), [props.id]);
  const [confirming, setConfirming] = React.useState(false);

  if (app === undefined) {
    return (
      <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <div className="hidden w-72 md:block">
          <ApplicationsSidebar activeId={props.id} />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <div className="space-y-2 text-center">
          <div className="text-sm font-medium">Application not found</div>
          <Link className="text-sm underline" href="/">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const requirements: Requirements = app.job.requirements;

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="hidden w-72 md:block">
        <ApplicationsSidebar activeId={props.id} />
      </div>

      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
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
                  <Button variant="secondary" onClick={() => setConfirming(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setConfirming(true)}>
                  Delete
                </Button>
              )}
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
                    <Input value={app.title} onChange={(e) => updateApplicationTitle(app.id, e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Company</div>
                    <Input value={app.job.company || ''} onChange={(e) => updateJobFields(app.id, { company: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Role title</div>
                    <Input value={app.job.roleTitle || ''} onChange={(e) => updateJobFields(app.id, { roleTitle: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Location</div>
                    <Input value={app.job.location || ''} onChange={(e) => updateJobFields(app.id, { location: e.target.value })} />
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
                    <div className="text-xs text-muted-foreground">We’ll use this as the target for tailoring.</div>
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
                    <div className="text-xs text-muted-foreground">Hard requirements you want prioritized</div>
                  </div>
                  <RequirementChips requirements={requirements} bucket="mustHave" onChange={(next) => updateRequirements(app.id, next)} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Nice-to-have</div>
                  <RequirementChips requirements={requirements} bucket="niceToHave" onChange={(next) => updateRequirements(app.id, next)} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-sm font-medium">Keywords</div>
                    <div className="text-xs text-muted-foreground">ATS keywords, tools, acronyms</div>
                  </div>
                  <RequirementChips requirements={requirements} bucket="keywords" onChange={(next) => updateRequirements(app.id, next)} />
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
                    <div className="text-xs text-muted-foreground">If parsing fails, just paste the text below.</div>
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

          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground shadow">
            Next: Resume editor + chat will appear here.
          </div>
        </div>
      </main>
    </div>
  );
}

export function ApplicationPage(props: { id: string }) {
  return <Content id={props.id} />;
}
