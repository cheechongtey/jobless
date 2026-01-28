import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type ResumeDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateJob: () => void;
  jobName: string;
  setJobName: (name: string) => void;
};

export function ResumeDialog({
  isOpen,
  onOpenChange,
  onCreateJob,
  jobName,
  setJobName,
}: ResumeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Job Analysis</DialogTitle>
          <DialogDescription>
            Give this job analysis a name to help you organize multiple applications.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job-name">Job Name</Label>
            <Input
              id="job-name"
              placeholder="e.g., Senior PM at Acme Corp"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onCreateJob();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              // setOpen(false);
              // setJobName("");
            }}
          >
            Cancel
          </Button>
          <Button onClick={onCreateJob} disabled={!jobName.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
