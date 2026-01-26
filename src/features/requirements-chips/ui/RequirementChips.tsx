'use client';

import * as React from 'react';

import type { Requirements } from '@/entities/application/model/types';

export function RequirementChips(props: {
  requirements: Requirements;
  bucket: keyof Requirements;
  onChange: (next: Requirements) => void;
}) {
  const items = props.requirements[props.bucket];
  const [value, setValue] = React.useState('');

  function addFromInput() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = {
      ...props.requirements,
      [props.bucket]: Array.from(new Set([...items, trimmed])),
    } satisfies Requirements;
    props.onChange(next);
    setValue('');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                const next = {
                  ...props.requirements,
                  [props.bucket]: items.filter((x) => x !== chip),
                } satisfies Requirements;
                props.onChange(next);
              }}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              title="Click to remove"
            >
              {chip}
            </button>
          ))
        ) : (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">No items yet.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFromInput();
            }
          }}
          className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-700"
          placeholder="Type and press Enter"
        />
        <button
          type="button"
          onClick={addFromInput}
          className="h-10 shrink-0 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add
        </button>
      </div>
    </div>
  );
}
