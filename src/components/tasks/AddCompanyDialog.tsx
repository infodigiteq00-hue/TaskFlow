import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Company } from '@/types/task';

export interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCompany: (company: Company) => void;
  /** Called before closing (so parent can ignore the next outer close). Call before onOpenChange(false). */
  onBeforeClose?: () => void;
}

export function AddCompanyDialog({
  open,
  onOpenChange,
  onAddCompany,
  onBeforeClose,
}: AddCompanyDialogProps) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');

  useEffect(() => {
    if (!open) {
      setNewCompanyName('');
      setNewCompanyEmail('');
    }
  }, [open]);

  const closeDialog = (open: boolean) => {
    if (!open) onBeforeClose?.();
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCompanyName.trim();
    if (!name) return;
    const newCompany: Company = {
      id: Date.now().toString(),
      name,
      contactEmail: newCompanyEmail.trim() || undefined,
      linkedInSubscription: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onBeforeClose?.();
    onAddCompany(newCompany);
    setNewCompanyName('');
    setNewCompanyEmail('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-company-name">Company name</Label>
            <Input
              id="add-company-name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="e.g. Acme Inc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-company-email">Contact email (optional)</Label>
            <Input
              id="add-company-email"
              type="email"
              value={newCompanyEmail}
              onChange={(e) => setNewCompanyEmail(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newCompanyName.trim()}>
              Add company
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
