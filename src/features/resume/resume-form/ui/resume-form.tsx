import { FileText } from 'lucide-react';
import { toast } from 'sonner';

import { updateResumeSourceText } from '@/entities/application/model/repo';
import { ResumeUpload } from '@/features/resume-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

export interface ResumeFormProps {
  applicationId: string;
  resumeSourceText: string;
}

export function ResumeForm(props: ResumeFormProps) {
  const { applicationId, resumeSourceText } = props;

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
            onParsedText={(text) => updateResumeSourceText(applicationId, text)}
            onError={(msg) => toast.error(msg)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resume-text">Resume Text</Label>
          <Textarea
            id="resume-text"
            value={resumeSourceText}
            onChange={(e) => updateResumeSourceText(applicationId, e.target.value)}
            placeholder="Paste your current resume here…"
            className="min-h-56 resize-y font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
