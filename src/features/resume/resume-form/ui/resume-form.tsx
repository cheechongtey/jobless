import { FileText } from 'lucide-react';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { updateResumeSourceText } from '@/entities/application/model/repo';
import { ResumeUpload } from '@/features/resume-upload';
import { useFormAutosave } from '@/shared/hooks/use-form-autosave';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

export interface ResumeFormProps {
  applicationId: string;
  resumeSourceText: string;
}

export function ResumeForm(props: ResumeFormProps) {
  const { applicationId, resumeSourceText } = props;

  const form = useForm<{ resumeSourceText: string }>({
    defaultValues: {
      resumeSourceText,
    },
  });

  React.useEffect(() => {
    if (form.formState.isDirty) return;
    form.reset({ resumeSourceText });
  }, [form, resumeSourceText]);

  const autosave = useFormAutosave<{ resumeSourceText: string }>({
    delayMs: 300,
    enabled: true,
    scopeKey: applicationId,
    initialValue: { resumeSourceText },
    onSave: async (value) => {
      await updateResumeSourceText(applicationId, value.resumeSourceText);
    },
  });

  const watchedResumeText = useWatch({
    control: form.control,
    name: 'resumeSourceText',
  });

  React.useEffect(() => {
    autosave.schedule({ resumeSourceText: watchedResumeText ?? '' });
  }, [autosave, watchedResumeText]);

  React.useEffect(() => {
    return () => {
      void autosave.flush();
    };
  }, [autosave]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Resume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-sm font-medium">Upload PDF/DOCX (optional)</div>
            <div className="text-xs text-muted-foreground">
              If parsing fails, just paste the text below.
            </div>
          </div>
          <ResumeUpload
            onParsedText={(text) => {
              form.setValue('resumeSourceText', text, { shouldDirty: true });
            }}
            onError={(msg) => toast.error(msg)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="resume-text">Resume Text</Label>
            <div className="text-xs text-muted-foreground">
              {autosave.saving
                ? 'Saving…'
                : autosave.error
                  ? 'Save failed'
                  : autosave.lastSavedAt
                    ? 'Saved'
                    : null}
            </div>
          </div>
          <Textarea
            id="resume-text"
            {...form.register('resumeSourceText')}
            placeholder="Paste your current resume here…"
            className="min-h-56 resize-y font-mono text-sm"
            onBlur={() => {
              void autosave.flush();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
