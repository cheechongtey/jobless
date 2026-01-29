'use client';

import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import * as React from 'react';

import { updateResumeAnalysisAnswers } from '@/entities/application/model/repo';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
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
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {p}
    </span>
  );
}

function getScoreTextClass(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBarClass(score: number) {
  if (score >= 80) return 'bg-green-600';
  if (score >= 60) return 'bg-amber-600';
  return 'bg-red-600';
}

export function AnalysisResult(props: {
  applicationId: string;
  resumeAnalysis: unknown;
  answers?: Record<string, string> | undefined;
  disabled?: boolean;
}) {
  const { applicationId, resumeAnalysis, disabled } = props;
  const overall = getOverall(resumeAnalysis);
  const strengths = getStringList(resumeAnalysis, 'strengths');
  const gaps = getStringList(resumeAnalysis, 'gaps');
  const questions = getQuestionItems(resumeAnalysis);

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    if (isRecord(props.answers)) {
      for (const [k, v] of Object.entries(props.answers)) {
        if (typeof v === 'string') next[k] = v;
      }
    }
    setAnswers(next);
  }, [props.answers]);

  const onSave = async () => {
    try {
      await updateResumeAnalysisAnswers(applicationId, answers);
      setSavedAt(Date.now());
    } catch {
      // ignore
    }
  };

  const score = overall.matchScore;
  const scorePct = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : null;

  const hasResults =
    typeof scorePct === 'number' ||
    Boolean(overall.summary) ||
    strengths.length > 0 ||
    gaps.length > 0 ||
    questions.length > 0;

  if (!hasResults) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p>Run an analysis to see results here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" />
            Match Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className={`text-4xl font-bold ${
                typeof scorePct === 'number' ? getScoreTextClass(scorePct) : ''
              }`}
            >
              {typeof scorePct === 'number' ? scorePct : '—'}
            </div>
            <div className="flex-1">
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div
                  className={`h-full ${typeof scorePct === 'number' ? getScoreBarClass(scorePct) : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  style={{ width: `${scorePct ?? 0}%` }}
                />
              </div>
              {typeof scorePct === 'number' ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  Match score: {scorePct}/100
                </div>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{overall.summary ?? '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strengths.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-green-600">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-2">
              {gaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-amber-600">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base">Questions to Improve Tailoring</CardTitle>
              <div className="mt-1 text-xs text-muted-foreground">
                Answering these helps the app tailor your resume more accurately.
              </div>
            </div>
            <div className="flex items-center gap-2">
              {savedAt ? <div className="text-xs text-muted-foreground">Saved</div> : null}
              <Button disabled={disabled} variant="outline" size="sm" onClick={onSave}>
                Save answers
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length ? (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2 max-md:flex-wrap">
                    <div className="order-2 flex flex-col md:order-1">
                      <div className="text-sm font-medium">{q.question}</div>
                      {q.detail ? (
                        <div className="mt-1 text-xs text-muted-foreground">{q.detail}</div>
                      ) : null}
                    </div>
                    <div className="order-1 md:order-2">{priorityLabel(q.priority)}</div>
                  </div>

                  {q.exampleAnswer ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        Suggested answer available
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: q.exampleAnswer ?? '' }))
                        }
                        disabled={disabled}
                      >
                        Use suggested
                      </Button>
                    </div>
                  ) : null}

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
            <div className="text-sm text-muted-foreground">No questions right now.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
