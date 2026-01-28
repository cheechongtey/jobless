'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { createApplication, listApplications } from '@/entities/application/model/repo';
import type { UUID } from '@/entities/application/model/types';
import { Button } from '@/shared/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/shared/ui/sidebar';

function formatTime(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

export function ResumeSidebar(props: { activeId?: UUID }) {
  const apps = useLiveQuery(() => listApplications(), []);
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

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
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    const app = await createApplication();
                    router.push(`/a/${app.id}`);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                New
              </Button>
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
              apps.map((a) => {
                const active = a.id === props.activeId;
                return (
                  <SidebarMenuItem key={a.id}>
                    <SidebarMenuButton asChild isActive={active} className="h-auto py-2">
                      <Link href={`/a/${a.id}`}>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {a.title || 'Untitled'}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {a.job.company || '—'}
                          </span>
                        </div>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {formatTime(a.updatedAt)}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
