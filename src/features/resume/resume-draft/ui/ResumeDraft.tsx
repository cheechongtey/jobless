'use client';

import { Copy, Download, FileEdit, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';

interface ResumeDraftProps {
  draftContent: string;
  onDraftChange: (content: string) => void;
  onGenerateDraft: () => Promise<void>;
  isGenerating: boolean;
  hasAnalysis: boolean;
}

export function ResumeDraft({
  draftContent,
  onDraftChange,
  onGenerateDraft,
  isGenerating,
  hasAnalysis,
}: ResumeDraftProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(draftContent);
      toast.success('Resume copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      console.error(error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([draftContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored-resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Resume downloaded!');
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Tailored Resume Draft
          </CardTitle>
          {!draftContent && hasAnalysis && (
            <Button onClick={onGenerateDraft} disabled={isGenerating} size="sm">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Draft
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!draftContent ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileEdit className="h-12 w-12 mx-auto mb-3 opacity-20" />
            {!hasAnalysis ? (
              <p>Run an analysis first, then generate a tailored resume draft</p>
            ) : (
              <div>
                <p className="mb-4">Ready to generate a tailored resume based on your analysis</p>
                <Button onClick={onGenerateDraft} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Tailored Resume
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateDraft}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <TabsContent value="preview" className="mt-0">
                <div className="border rounded-lg p-6 bg-muted/30 min-h-[600px] max-h-[800px] overflow-y-auto">
                  <div className="whitespace-pre-wrap font-mono text-sm">{draftContent}</div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                <Textarea
                  value={draftContent}
                  onChange={(e) => onDraftChange(e.target.value)}
                  className="min-h-[600px] max-h-[800px] resize-y font-mono text-sm"
                  placeholder="Edit your tailored resume here..."
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
