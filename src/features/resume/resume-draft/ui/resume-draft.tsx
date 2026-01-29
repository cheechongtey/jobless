'use client';

import { Copy, Download, FileEdit } from 'lucide-react';
import { toast } from 'sonner';

import type { Application } from '@/entities/application/model/types';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export interface ResumeDraftProps {
  applicationId: string;
  resumeDraft: Application['resumeDraft'];
}

export function ResumeDraft(props: ResumeDraftProps) {
  const { applicationId, resumeDraft } = props;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileEdit className="h-5 w-5" />
            Resume Draft
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                try {
                  const blob = new Blob([JSON.stringify(resumeDraft, null, 2)], {
                    type: 'application/json;charset=utf-8',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `resumeDraft-${applicationId}.json`;
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
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(JSON.stringify(resumeDraft, null, 2));
                  toast.success('Copied resumeDraft JSON');
                } catch {
                  toast.error('Failed to copy');
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy JSON
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Headline</div>
            <div className="whitespace-pre-wrap text-sm">{resumeDraft.headline || '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Summary</div>
            <div className="whitespace-pre-wrap text-sm">{resumeDraft.summary || '—'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Experience</div>
          {resumeDraft.experience?.length ? (
            <div className="space-y-3">
              {resumeDraft.experience.map((item, idx) => (
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
            <div className="whitespace-pre-wrap text-sm">{resumeDraft.projects || '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Skills</div>
            <div className="whitespace-pre-wrap text-sm">{resumeDraft.skills || '—'}</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground">Education</div>
          <div className="whitespace-pre-wrap text-sm">{resumeDraft.education || '—'}</div>
        </div>
      </CardContent>
    </Card>
  );
}
