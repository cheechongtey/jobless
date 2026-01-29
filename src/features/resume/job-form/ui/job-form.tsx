import { Briefcase } from 'lucide-react';

import {
  updateApplicationTitle,
  updateJobFields,
  updateRequirements,
} from '@/entities/application/model/repo';
import type { JobPosting } from '@/entities/application/model/types';
import { RequirementChips } from '@/features/requirements-chips';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

export interface JobFormProps {
  applicationId: string;
  applicationTitle: string;
  job: JobPosting;
}

export function JobForm(props: JobFormProps) {
  const { applicationId, applicationTitle, job } = props;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-5 w-5" />
          Job Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="applicationTitle">Title</Label>
          <Input
            id="applicationTitle"
            value={applicationTitle}
            onChange={(e) => updateApplicationTitle(applicationId, e.target.value)}
            placeholder="e.g., Acme - Senior PM"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g., Acme Corp"
              value={job.company || ''}
              onChange={(e) => updateJobFields(applicationId, { company: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleTitle">Role Title</Label>
            <Input
              id="roleTitle"
              placeholder="e.g., Senior Product Manager"
              value={job.roleTitle || ''}
              onChange={(e) => updateJobFields(applicationId, { roleTitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Remote, San Francisco, CA"
              value={job.location || ''}
              onChange={(e) => updateJobFields(applicationId, { location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seniority">Seniority</Label>
            <Input
              id="seniority"
              placeholder="e.g., Senior, Staff, Manager"
              value={job.seniority || ''}
              onChange={(e) => updateJobFields(applicationId, { seniority: e.target.value })}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="descriptionText">Job Description</Label>
              <div className="text-xs text-muted-foreground">
                We’ll use this as the target for tailoring.
              </div>
            </div>
            <Textarea
              id="descriptionText"
              placeholder="Responsibilities, requirements, etc."
              value={job.descriptionText}
              onChange={(e) => updateJobFields(applicationId, { descriptionText: e.target.value })}
              className="min-h-56 resize-y"
            />
          </div>
          <div className="space-y-4 pt-2 col-span-2">
            <div className="text-sm font-medium">Requirements</div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm font-medium">Must-have</div>
                <div className="text-xs text-muted-foreground">
                  Hard requirements you want prioritized
                </div>
              </div>
              <RequirementChips
                requirements={job.requirements}
                bucket="mustHave"
                onChange={(next) => updateRequirements(applicationId, next)}
              />
            </div>

            <div className="space-y-1 col-span-2">
              <div className="text-sm font-medium">Nice-to-have</div>
              <RequirementChips
                requirements={job.requirements}
                bucket="niceToHave"
                onChange={(next) => updateRequirements(applicationId, next)}
              />
            </div>

            <div className="space-y-1 col-span-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm font-medium">Keywords</div>
                <div className="text-xs text-muted-foreground">ATS keywords, tools, acronyms</div>
              </div>
              <RequirementChips
                requirements={job.requirements}
                bucket="keywords"
                onChange={(next) => updateRequirements(applicationId, next)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
