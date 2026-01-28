'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import * as React from 'react';

import { createApplication, listApplications } from '@/entities/application/model/repo';
import type { UUID } from '@/entities/application/model/types';

function formatTime(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

export function ApplicationsSidebar(props: { activeId?: UUID }) {
  const apps = useLiveQuery(() => listApplications(), []);
  const [busy, setBusy] = React.useState(false);

  return (
    <aside className="flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Applications</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Local only</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              await createApplication();
            } finally {
              setBusy(false);
            }
          }}
          className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {apps?.length ? (
          <ul className="space-y-1">
            {apps.map((a) => {
              const active = a.id === props.activeId;
              return (
                <li key={a.id}>
                  <Link
                    href={`/a/${a.id}`}
                    className={[
                      'block rounded-md px-3 py-2',
                      active
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50'
                        : 'hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900/60',
                    ].join(' ')}
                  >
                    <div className="truncate text-sm font-medium">{a.title || 'Untitled'}</div>
                    <div className="mt-0.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="truncate">{a.job.company || '—'}</span>
                      <span>{formatTime(a.updatedAt)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No applications yet.</div>
        )}
      </div>
    </aside>
  );
}
