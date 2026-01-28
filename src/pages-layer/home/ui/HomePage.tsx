'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';

import { createApplication, listApplications } from '@/entities/application/model/repo';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ApplicationsSidebar } from '@/widgets/applications-sidebar';

export function HomePage() {
  const apps = useLiveQuery(() => listApplications(), []);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="hidden w-72 md:block">
        <ApplicationsSidebar />
      </div>

      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <div className="text-xs text-muted-foreground">MVP</div>
            <CardTitle className="text-xl">Resume tailor</CardTitle>
            <CardDescription>
              Create an application per role, add the job description + requirements, then paste or upload your resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={async () => {
                  const app = await createApplication();
                  window.location.href = `/a/${app.id}`;
                }}
              >
                New application
              </Button>
              {apps?.[0] ? (
                <Button asChild variant="outline">
                  <Link href={`/a/${apps[0].id}`}>Open latest</Link>
                </Button>
              ) : null}
            </div>

            <div className="mt-6 text-xs text-muted-foreground">Data is stored locally in your browser.</div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
