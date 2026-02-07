import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeamMember } from '@/types/task';

export interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMember: (member: TeamMember) => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  onAddMember,
}: AddMemberDialogProps) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (!open) {
      setNewName('');
      setNewEmail('');
      setNewRole('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    const email = newEmail.trim();
    const role = newRole.trim();
    if (!name || !email) return;
    const member: TeamMember = {
      id: Date.now().toString(),
      name,
      email,
      role: role || 'Team Member',
      department: 'General',
    };
    onAddMember(member);
    setNewName('');
    setNewEmail('');
    setNewRole('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-member-name">Team member name</Label>
            <Input
              id="add-member-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Jane Smith"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-member-email">Assigned email / login id</Label>
            <Input
              id="add-member-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. jane@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-member-role">Posting title</Label>
            <Input
              id="add-member-role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="e.g. Project Manager"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
