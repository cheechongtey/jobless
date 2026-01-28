'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';

import {
  createApplication,
  deleteApplication,
  listApplications,
} from '@/entities/application/model/repo';
import type { UUID } from '@/entities/application/model/types';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/shared/ui/sidebar';

import { AddResumeDialog } from './add-resume-dialog/add-resume-dialog';

export function ResumeSidebar() {
  const apps = useLiveQuery(() => listApplications(), []);
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();
  const params = useParams<{ id: UUID }>();
  const activeId = params.id;

  const getScoreColor = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2 px-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Jobs</div>
                <div className="truncate text-xs text-muted-foreground">Local only</div>
              </div>
              <AddResumeDialog
                jobName=""
                setJobName={() => {}}
                trigger={
                  <Button size="sm" disabled={busy}>
                    New
                  </Button>
                }
                onCreateJob={async () => {
                  try {
                    setBusy(true);
                    const app = await createApplication();
                    router.push(`/resume/${app.id}`);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {apps === undefined ? (
              <>
                <SidebarMenuSkeleton />
                <SidebarMenuSkeleton />
                <SidebarMenuSkeleton />
              </>
            ) : apps.length ? (
              apps.map((job) => {
                const active = job.id === activeId;
                return (
                  <Link
                    href={`/resume/${job.id}`}
                    key={job.id}
                    className={cn(
                      'group relative rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent',
                      {
                        'bg-accent border-primary': active,
                      }
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">{job.title}</h3>
                          {active && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                        </div>
                        {job.job.company && (
                          <p className="text-xs text-muted-foreground truncate">
                            {job.job.company}
                          </p>
                        )}
                        {job.job.roleTitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {job.job.roleTitle}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {job.resumeAnalysis &&
                          job.resumeAnalysis.overall.matchScore !== undefined && (
                            <Badge
                              variant={getScoreColor(job.resumeAnalysis.overall.matchScore)}
                              className="text-xs"
                            >
                              {job.resumeAnalysis.overall.matchScore}%
                            </Badge>
                          )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteApplication(job.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-2 py-2 text-sm text-muted-foreground">No jobs yet.</div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
