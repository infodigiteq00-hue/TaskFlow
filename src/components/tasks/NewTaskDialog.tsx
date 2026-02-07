import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, TaskCategory, TaskStatus, CategoryOption, Company, TeamMember } from '@/types/task';
import { mockTeamMembers } from '@/data/mockData';
import { Upload, Mic, Video, Image, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AddCompanyDialog } from './AddCompanyDialog';

const emptyForm = {
  title: '',
  description: '',
  category: '' as TaskCategory | string,
  companyId: '',
  assignedTo: [] as string[],
  startDate: '',
  endDate: '',
  endTime: '' as string,
  priority: 'medium' as 'low' | 'medium' | 'high',
  isCoreTask: false,
};

const NEW_COMPANY_VALUE = '__new_company__';

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Task) => void;
  categoryOptions: CategoryOption[];
  companies: Company[];
  onAddCompany?: (company: Company) => void;
  editTask?: Task | null;
  onUpdateTask?: (task: Task) => void;
  initialCategory?: string;
  teamMembers?: TeamMember[];
}

export function NewTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  categoryOptions,
  companies,
  onAddCompany,
  editTask = null,
  onUpdateTask,
  initialCategory,
  teamMembers = mockTeamMembers,
}: NewTaskDialogProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);

  const isEditMode = !!editTask;

  useEffect(() => {
    if (!open) return;
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description,
        category: editTask.category,
        companyId: editTask.companyId,
        assignedTo: [...editTask.assignedTo],
        startDate: editTask.startDate,
        endDate: editTask.endDate,
        endTime: editTask.endTime ?? '',
        priority: editTask.priority,
        isCoreTask: editTask.isCoreTask ?? false,
      });
    } else if (initialCategory) {
      setFormData({ ...emptyForm, category: initialCategory });
    } else {
      setFormData(emptyForm);
    }
  }, [open, editTask, initialCategory]);

  const handleCompanyValueChange = (value: string) => {
    if (value === NEW_COMPANY_VALUE) {
      setAddCompanyOpen(true);
      return;
    }
    setFormData((prev) => ({ ...prev, companyId: value }));
  };

  const handleAddCompany = (company: Company) => {
    onAddCompany?.(company);
    setFormData((prev) => ({ ...prev, companyId: company.id }));
    setAddCompanyOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find((c) => c.id === formData.companyId);
    if (isEditMode && editTask && onUpdateTask) {
      onUpdateTask({
        ...editTask,
        ...formData,
        endTime: formData.endTime || undefined,
        isCoreTask: formData.isCoreTask,
        companyName: company?.name ?? editTask.companyName,
        updatedAt: new Date().toISOString(),
      });
      setFormData(emptyForm);
      onOpenChange(false);
      return;
    }
    onSubmit({
      ...formData,
      endTime: formData.endTime || undefined,
      isCoreTask: formData.isCoreTask,
      id: Date.now().toString(),
      companyName: company?.name || '',
      status: 'pending' as TaskStatus,
      assignedBy: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Task);
    setFormData(emptyForm);
    onOpenChange(false);
  };

  const toggleAssignee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(id)
        ? prev.assignedTo.filter(a => a !== id)
        : [...prev.assignedTo, id]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
          {/* Task Type / Category */}
          <div className="space-y-2">
            <Label>Task Type</Label>
            <Select
              value={formData.category}
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label>Company</Label>
            <Select
              value={formData.companyId}
              onValueChange={handleCompanyValueChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
                {onAddCompany && (
                  <SelectItem value={NEW_COMPANY_VALUE} className="text-primary font-medium">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New company
                    </span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {onAddCompany && (
            <AddCompanyDialog
              open={addCompanyOpen}
              onOpenChange={setAddCompanyOpen}
              onAddCompany={handleAddCompany}
            />
          )}

          {/* Description with media support */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the task in detail..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
            <div className="flex items-center gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <Mic className="w-4 h-4" />
                Audio
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <Video className="w-4 h-4" />
                Video
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <Image className="w-4 h-4" />
                Image
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <Upload className="w-4 h-4" />
                File
              </Button>
            </div>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-secondary/30">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={formData.assignedTo.includes(member.id)}
                    onCheckedChange={() => toggleAssignee(member.id)}
                  />
                  <label
                    htmlFor={`member-${member.id}`}
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {member.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Target Completion Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Finish time (optional)</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Team members will see &quot;in X hours&quot; countdown until this time. Leave empty for end of day.
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Core task */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="core-task"
              checked={formData.isCoreTask}
              onCheckedChange={(c) => setFormData((prev) => ({ ...prev, isCoreTask: !!c }))}
            />
            <label htmlFor="core-task" className="text-sm cursor-pointer">
              Is it a core task? (Shows in Core tasks section on dashboard)
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent">
              {isEditMode ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
