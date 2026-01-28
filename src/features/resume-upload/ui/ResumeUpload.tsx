'use client';

import * as React from 'react';

import { parsePdfAction } from '@/actions/parse-pdf';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateResumeFile(file: File) {
  const lower = file.name.toLowerCase();
  const okType = lower.endsWith('.pdf') || lower.endsWith('.docx');
  if (!okType) return 'Unsupported file type. Please upload a PDF or DOCX.';
  if (file.size > MAX_RESUME_BYTES) return 'File too large. Max 5MB.';
  return null;
}

export function ResumeUpload(props: {
  onParsedText: (text: string) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={busy}
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = '';
          if (!file) return;

          const err = validateResumeFile(file);
          if (err) {
            props.onError(err);
            return;
          }

          const form = new FormData();
          form.set('file', file);

          try {
            setBusy(true);
            const data = await parsePdfAction(form);
            
            if (isRecord(data) && typeof data.text === 'string') {
              props.onParsedText(data.text);
              return;
            }
            props.onError('Failed to parse file');
          } catch (err2) {
            props.onError(err2 instanceof Error ? err2.message : 'Failed to parse file');
          } finally {
            setBusy(false);
          }
        }}
        className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50 dark:text-zinc-300 dark:file:bg-zinc-50 dark:file:text-zinc-900 dark:hover:file:bg-zinc-200"
      />
      {busy ? <div className="text-xs text-zinc-500 dark:text-zinc-400">Parsing…</div> : null}
    </div>
  );
}
