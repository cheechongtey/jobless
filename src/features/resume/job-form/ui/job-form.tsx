import { Briefcase } from 'lucide-react';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  updateApplicationTitle,
  updateJobFields,
  updateRequirements,
} from '@/entities/application/model/repo';
import type { JobPosting } from '@/entities/application/model/types';
import { RequirementChips } from '@/features/requirements-chips';
import { useFormAutosave } from '@/shared/hooks/use-form-autosave';
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

  const form = useForm<{
    applicationTitle: string;
    company: string;
    roleTitle: string;
    location: string;
    seniority: string;
    descriptionText: string;
  }>({
    defaultValues: {
      applicationTitle,
      company: job.company ?? '',
      roleTitle: job.roleTitle ?? '',
      location: job.location ?? '',
      seniority: job.seniority ?? '',
      descriptionText: job.descriptionText ?? '',
    },
  });

  React.useEffect(() => {
    if (form.formState.isDirty) return;
    form.reset({
      applicationTitle,
      company: job.company ?? '',
      roleTitle: job.roleTitle ?? '',
      location: job.location ?? '',
      seniority: job.seniority ?? '',
      descriptionText: job.descriptionText ?? '',
    });
  }, [applicationTitle, form, job]);

  const autosaveTitle = useFormAutosave<string>({
    delayMs: 300,
    enabled: true,
    scopeKey: applicationId,
    initialValue: applicationTitle,
    onSave: async (value) => {
      await updateApplicationTitle(applicationId, value);
    },
  });

  const autosaveJobFields = useFormAutosave<{
    company: string;
    roleTitle: string;
    location: string;
    seniority: string;
    descriptionText: string;
  }>({
    delayMs: 300,
    enabled: true,
    scopeKey: applicationId,
    initialValue: {
      company: job.company ?? '',
      roleTitle: job.roleTitle ?? '',
      location: job.location ?? '',
      seniority: job.seniority ?? '',
      descriptionText: job.descriptionText ?? '',
    },
    onSave: async (value) => {
      await updateJobFields(applicationId, value);
    },
  });

  const watchedTitle = useWatch({ control: form.control, name: 'applicationTitle' });
  const watchedCompany = useWatch({ control: form.control, name: 'company' });
  const watchedRoleTitle = useWatch({ control: form.control, name: 'roleTitle' });
  const watchedLocation = useWatch({ control: form.control, name: 'location' });
  const watchedSeniority = useWatch({ control: form.control, name: 'seniority' });
  const watchedDescriptionText = useWatch({ control: form.control, name: 'descriptionText' });

  React.useEffect(() => {
    autosaveTitle.schedule(watchedTitle ?? '');
  }, [autosaveTitle, watchedTitle]);

  React.useEffect(() => {
    autosaveJobFields.schedule({
      company: watchedCompany ?? '',
      roleTitle: watchedRoleTitle ?? '',
      location: watchedLocation ?? '',
      seniority: watchedSeniority ?? '',
      descriptionText: watchedDescriptionText ?? '',
    });
  }, [
    autosaveJobFields,
    watchedCompany,
    watchedDescriptionText,
    watchedLocation,
    watchedRoleTitle,
    watchedSeniority,
  ]);

  React.useEffect(() => {
    return () => {
      void autosaveTitle.flush();
      void autosaveJobFields.flush();
    };
  }, [autosaveJobFields, autosaveTitle]);

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
            {...form.register('applicationTitle')}
            placeholder="e.g., Acme - Senior PM"
            onBlur={() => {
              void autosaveTitle.flush();
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g., Acme Corp"
              {...form.register('company')}
              onBlur={() => {
                void autosaveJobFields.flush();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleTitle">Role Title</Label>
            <Input
              id="roleTitle"
              placeholder="e.g., Senior Product Manager"
              {...form.register('roleTitle')}
              onBlur={() => {
                void autosaveJobFields.flush();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Remote, San Francisco, CA"
              {...form.register('location')}
              onBlur={() => {
                void autosaveJobFields.flush();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seniority">Seniority</Label>
            <Input
              id="seniority"
              placeholder="e.g., Senior, Staff, Manager"
              {...form.register('seniority')}
              onBlur={() => {
                void autosaveJobFields.flush();
              }}
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
              {...form.register('descriptionText')}
              className="min-h-56 resize-y"
              onBlur={() => {
                void autosaveJobFields.flush();
              }}
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
