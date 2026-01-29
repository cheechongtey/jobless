'use client';

import { Briefcase, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { createApplication, updateApplicationTitle } from '@/entities/application/model/repo';
import { Button } from '@/shared/ui/button';

export default function Page() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h3 className="text-xl font-semibold mb-2">No Job Selected</h3>
        <p className="text-muted-foreground mb-6">
          Create a new job analysis to get started, or select an existing one from the sidebar.
        </p>
        <Button
          size="lg"
          disabled={busy}
          onClick={async () => {
            if (busy) return;
            const name = prompt('Enter a name for your job analysis:');
            if (!name?.trim()) return;

            try {
              setBusy(true);
              const app = await createApplication();
              await updateApplicationTitle(app.id, name.trim());
              router.push(`/resume/${app.id}`);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Your First Job
        </Button>
      </div>
    </div>
  );
}
