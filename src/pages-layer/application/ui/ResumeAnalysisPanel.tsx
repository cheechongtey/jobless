'use client';

import * as React from 'react';

import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';

type Priority = 'high' | 'medium' | 'low' | string;

type QuestionItem = {
  id: string;
  question: string;
  detail: string | undefined;
  priority: Priority | undefined;
  exampleAnswer: string | undefined;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function getQuestionItems(resumeAnalysis: unknown): QuestionItem[] {
  if (!isRecord(resumeAnalysis)) return [];

  const missingInfo = getArray(resumeAnalysis.missingInfo);
  if (missingInfo) {
    return missingInfo
      .map((item, idx): QuestionItem | null => {
        if (!isRecord(item)) return null;
        const question = getString(item.question);
        const field = getString(item.field);
        const why = getString(item.why);
        const exampleAnswer = getString(item.exampleAnswer);
        const priority = getString(item.priority);
        const q = question ?? (field ? `Please provide: ${field}` : undefined);
        if (!q) return null;
        return {
          id: `${field ?? 'missing'}:${idx}`,
          question: q,
          detail: why,
          priority,
          exampleAnswer,
        };
      })
      .filter((x): x is QuestionItem => x !== null);
  }

  const clarifyingQuestions = getArray(resumeAnalysis.clarifyingQuestions);
  if (clarifyingQuestions) {
    return clarifyingQuestions
      .map((item, idx): QuestionItem | null => {
        if (!isRecord(item)) return null;
        const question = getString(item.question);
        const reason = getString(item.reason);
        const priority = getString(item.priority);
        if (!question) return null;
        return {
          id: `clarifying:${idx}`,
          question,
          detail: reason,
          priority,
          exampleAnswer: undefined,
        };
      })
      .filter((x): x is QuestionItem => x !== null);
  }

  return [];
}

function getOverall(resumeAnalysis: unknown): { matchScore?: number; summary?: string } {
  if (!isRecord(resumeAnalysis) || !isRecord(resumeAnalysis.overall)) return {};
  return {
    matchScore: getNumber(resumeAnalysis.overall.matchScore),
    summary: getString(resumeAnalysis.overall.summary),
  };
}

function getStringList(resumeAnalysis: unknown, key: string): string[] {
  if (!isRecord(resumeAnalysis)) return [];
  const arr = getArray(resumeAnalysis[key]);
  if (!arr) return [];
  return arr.map(getString).filter((x): x is string => Boolean(x));
}

function priorityLabel(priority?: Priority) {
  if (!priority) return null;
  const p = String(priority);
  const cls =
    p === 'high'
      ? 'border-red-200 bg-red-50 text-red-700'
      : p === 'medium'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-zinc-200 bg-zinc-50 text-zinc-700';
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{p}</span>;
}

export function ResumeAnalysisPanel(props: {
  applicationId: string;
  resumeAnalysis: unknown;
  disabled?: boolean;
}) {
  const { applicationId, resumeAnalysis, disabled } = props;
  const overall = getOverall(resumeAnalysis);
  const strengths = getStringList(resumeAnalysis, 'strengths');
  const gaps = getStringList(resumeAnalysis, 'gaps');
  const questions = getQuestionItems(resumeAnalysis);

  const storageKey = `resumeAnalysisAnswers:${applicationId}`;
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) return;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') next[k] = v;
      }
      setAnswers(next);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const onSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
      setSavedAt(Date.now());
    } catch {
      // ignore
    }
  };

  const score = overall.matchScore;
  const scorePct = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted-foreground">Resume Score</div>
        {typeof scorePct === 'number' ? (
          <div className="text-xs text-muted-foreground">Match score: {scorePct}/100</div>
        ) : null}
      </div>

      {typeof scorePct === 'number' ? (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
          <div className="h-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${scorePct}%` }} />
        </div>
      ) : null}

      <div className="mt-3 text-sm">
        <div className="text-xs font-semibold text-muted-foreground">Summary</div>
        <div className="mt-1 whitespace-pre-wrap">{overall.summary ?? '—'}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-background p-3">
          <div className="text-xs font-semibold text-muted-foreground">Strengths</div>
          {strengths.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {strengths.map((s, i) => (
                <li key={`${i}:${s}`}>{s}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">—</div>
          )}
        </div>

        <div className="rounded-lg border bg-background p-3">
          <div className="text-xs font-semibold text-muted-foreground">Gaps</div>
          {gaps.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {gaps.map((g, i) => (
                <li key={`${i}:${g}`}>{g}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">—</div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-muted-foreground">Questions to improve tailoring</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Answering these helps the app tailor your resume more accurately.
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedAt ? <div className="text-xs text-muted-foreground">Saved</div> : null}
            <Button disabled={disabled} variant="outline" onClick={onSave}>
              Save answers
            </Button>
          </div>
        </div>

        {questions.length ? (
          <div className="mt-3 space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col order-2 md:order-1">
                    <div className="text-sm font-medium">{q.question}</div>
                    {q.detail ? <div className="mt-1 text-xs text-muted-foreground">{q.detail}</div> : null}
                  </div>
                  <div className="order-1 md:order-2">{priorityLabel(q.priority)}</div>
                </div>
                <div className="mt-3">
                  <Textarea
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={q.exampleAnswer ?? 'Type your answer…'}
                    className="min-h-24"
                    disabled={disabled}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-muted-foreground">No questions right now.</div>
        )}
      </div>
    </div>
  );
}
