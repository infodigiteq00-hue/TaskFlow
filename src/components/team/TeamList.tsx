import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Plus, MoreHorizontal } from 'lucide-react';
import { TeamMember } from '@/types/task';
import { Task } from '@/types/task';

interface TeamListProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  onAddMember: (member: TeamMember) => void;
}

export function TeamList({ teamMembers, tasks, onAddMember }: TeamListProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');

  const handleOpenAddMember = () => {
    setNewName('');
    setNewEmail('');
    setNewRole('');
    setAddMemberOpen(true);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
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
    setAddMemberOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
          <p className="text-muted-foreground text-sm">Manage your team</p>
        </div>
        <Button variant="accent" className="gap-2" onClick={handleOpenAddMember}>
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => {
          const memberTasks = tasks.filter((t) => t.assignedTo.includes(member.id));
          const activeTasks = memberTasks.filter((t) => t.status !== 'completed').length;
          const completedTasks = memberTasks.filter((t) => t.status === 'completed').length;

          return (
            <Card key={member.id} className="p-5 hover-lift cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg text-primary-foreground font-semibold">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <Badge variant="secondary" className="mb-3">
                {member.department}
              </Badge>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Mail className="w-4 h-4" />
                {member.email}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-foreground">{activeTasks}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-success">{completedTasks}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMemberSubmit} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => setAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add member</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
