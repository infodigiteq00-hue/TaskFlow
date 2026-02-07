import { useState } from 'react';
import { Task, Company } from '@/types/task';
import { Linkedin, Plus, Building2, Mail, ImagePlus, Upload, Calendar as CalendarIcon, FileText, ExternalLink, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfWeek, subMonths } from 'date-fns';

/** Current user for "recorded by" – can be replaced with auth later */
const CURRENT_USER_ID = '1';
const CURRENT_USER_NAME = 'Sarah Johnson';

function formatIST(date: Date): string {
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) + ' IST';
}

interface LinkedInManagerProps {
  tasks: Task[];
  companies: Company[];
  onTaskClick?: (task: Task) => void;
  onAddLinkedInPost?: (task: Task) => void;
  onAddCompany?: (company: Company) => void;
  onUpdateCompany?: (company: Company) => void;
  onDeleteCompany?: (companyId: string) => void;
  onUpdateTask?: (task: Task) => void;
}

export function LinkedInManager({
  tasks,
  companies,
  onTaskClick,
  onAddLinkedInPost,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  onUpdateTask,
}: LinkedInManagerProps) {
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyLogo, setNewCompanyLogo] = useState('');
  const [newCompanyLinkedIn, setNewCompanyLinkedIn] = useState(true);
  const [editLogoCompany, setEditLogoCompany] = useState<Company | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [calendarCompany, setCalendarCompany] = useState<Company | null>(null);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyEmail, setEditCompanyEmail] = useState('');
  const [editCompanyLogo, setEditCompanyLogo] = useState('');
  const [editCompanyLinkedIn, setEditCompanyLinkedIn] = useState(true);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const monthOptions = (() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = subMonths(now, i);
      options.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') });
    }
    return options;
  })();

  const getWeekAndMonthLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    const weekOfMonth = Math.ceil(d.getDate() / 7);
    return `Week ${weekOfMonth} ${format(d, 'MMM')}`;
  };
  const [editingPostUrlTaskId, setEditingPostUrlTaskId] = useState<string | null>(null);
  const [editingPostUrlValue, setEditingPostUrlValue] = useState('');
  const [postedOnPopoverTaskId, setPostedOnPopoverTaskId] = useState<string | null>(null);
  const [postedOnEditDate, setPostedOnEditDate] = useState('');
  const [postedOnEditBy, setPostedOnEditBy] = useState('');
  const [addPostDialogOpen, setAddPostDialogOpen] = useState(false);
  const [addPostClientId, setAddPostClientId] = useState('');
  const [addPostDueOn, setAddPostDueOn] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [addPostDate, setAddPostDate] = useState('');
  const [addPostUrl, setAddPostUrl] = useState('');
  const [addPostDocUrl, setAddPostDocUrl] = useState('');
  const [addPostDocFileName, setAddPostDocFileName] = useState('');
  const [addPostDescription, setAddPostDescription] = useState('');
  const [addPostSpecialNotes, setAddPostSpecialNotes] = useState('');

  const handleSaveLinkedInUrl = (task: Task) => {
    if (!onUpdateTask) return;
    const value = editingPostUrlValue.trim();
    onUpdateTask({
      ...task,
      linkedInPostUrl: value || undefined,
      updatedAt: new Date().toISOString(),
    });
    setEditingPostUrlTaskId(null);
    setEditingPostUrlValue('');
  };

  const openPostedOnPopover = (task: Task) => {
    setPostedOnPopoverTaskId(task.id);
    setPostedOnEditDate(
      task.linkedInPostedOn ? format(parseISO(task.linkedInPostedOn), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    );
    setPostedOnEditBy(task.linkedInPostedBy ?? '');
  };

  const handleSavePostedOn = (task: Task) => {
    if (!onUpdateTask) return;
    onUpdateTask({
      ...task,
      linkedInPostedOn: postedOnEditDate ? `${postedOnEditDate}T12:00:00.000Z` : undefined,
      linkedInPostedBy: postedOnEditBy.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setPostedOnPopoverTaskId(null);
  };

  const openAddPostDialog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setAddPostClientId(linkedInCompanies[0]?.id ?? '');
    setAddPostDueOn(today);
    setAddPostDate('');
    setAddPostUrl('');
    setAddPostDocUrl('');
    setAddPostDocFileName('');
    setAddPostDescription('');
    setAddPostSpecialNotes('');
    setAddPostDialogOpen(true);
  };

  const handleAddPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddLinkedInPost || !addPostClientId || !addPostDueOn) return;
    const company = companies.find((c) => c.id === addPostClientId);
    if (!company) return;
    const hasLinkedInUrl = !!addPostUrl.trim();
    const postedDate = addPostDate || addPostDueOn;
    const endDate = addPostDate || addPostDueOn;
    const postedOnISO = `${postedDate}T12:00:00.000Z`;
    const now = new Date().toISOString();
    const docUrl = addPostDocUrl.trim() || undefined;
    const docUploadDate = docUrl ? new Date().toISOString() : undefined;
    const task: Task = {
      id: Date.now().toString(),
      title: 'LinkedIn post',
      description: addPostDescription.trim() || '',
      specialNotes: addPostSpecialNotes.trim() || undefined,
      category: 'linkedin-management',
      status: hasLinkedInUrl ? 'completed' : 'pending',
      companyId: addPostClientId,
      companyName: company.name,
      assignedTo: [],
      assignedBy: CURRENT_USER_ID,
      startDate: addPostDueOn,
      endDate,
      finalFileUrl: docUrl,
      docUploadedAt: docUploadDate,
      linkedInPostUrl: hasLinkedInUrl ? addPostUrl.trim() : undefined,
      linkedInPostedOn: hasLinkedInUrl ? postedOnISO : undefined,
      linkedInPostedBy: hasLinkedInUrl ? CURRENT_USER_NAME : undefined,
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
    };
    onAddLinkedInPost(task);
    setAddPostDialogOpen(false);
  };

  const handleOpenEditCompany = (company: Company) => {
    setEditCompany(company);
    setEditCompanyName(company.name);
    setEditCompanyEmail(company.contactEmail ?? '');
    setEditCompanyLogo(company.logo ?? '');
    setEditCompanyLinkedIn(company.linkedInSubscription);
  };

  const handleSaveEditCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompany || !onUpdateCompany) return;
    const name = editCompanyName.trim();
    if (!name) return;
    onUpdateCompany({
      ...editCompany,
      name,
      contactEmail: editCompanyEmail.trim() || undefined,
      logo: editCompanyLogo.trim() || undefined,
      linkedInSubscription: editCompanyLinkedIn,
    });
    setEditCompany(null);
  };

  const handleEditCompanyLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditCompanyLogo(dataUrl);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleConfirmDeleteCompany = () => {
    if (deleteCompany && onDeleteCompany) {
      onDeleteCompany(deleteCompany.id);
      setDeleteCompany(null);
    }
  };

  const handleOpenCompanies = () => {
    setCompaniesOpen(true);
  };

  const handleOpenNewCompany = () => {
    setNewCompanyName('');
    setNewCompanyEmail('');
    setNewCompanyLogo('');
    setNewCompanyLinkedIn(true);
    setNewCompanyOpen(true);
  };

  const handleOpenEditLogo = (company: Company) => {
    setEditLogoCompany(company);
    setEditLogoUrl(company.logo ?? '');
  };

  const handleSaveLogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLogoCompany || !onUpdateCompany) return;
    onUpdateCompany({ ...editLogoCompany, logo: editLogoUrl.trim() || undefined });
    setEditLogoCompany(null);
    setEditLogoUrl('');
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleLogoFileNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setNewCompanyLogo(dataUrl);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleLogoFileEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditLogoUrl(dataUrl);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleAddPostDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAddPostDocUrl(dataUrl);
      setAddPostDocFileName(file.name);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const linkedInCompanies = companies.filter((c) => c.linkedInSubscription);
  const linkedInTasks = tasks.filter((t) => t.category === 'linkedin-management');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const postsDueToday = linkedInTasks.filter(
    (t) => t.endDate.startsWith(todayStr) && t.status === 'pending' && !t.linkedInPostUrl
  );

  const handleAddCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCompanyName.trim();
    if (!name || !onAddCompany) return;
    const newCompany: Company = {
      id: Date.now().toString(),
      name,
      contactEmail: newCompanyEmail.trim() || undefined,
      logo: newCompanyLogo.trim() || undefined,
      linkedInSubscription: newCompanyLinkedIn,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAddCompany(newCompany);
    setNewCompanyName('');
    setNewCompanyEmail('');
    setNewCompanyLogo('');
    setNewCompanyLinkedIn(true);
    setNewCompanyOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Linkedin className="w-6 h-6 text-[#0A66C2]" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">LinkedIn Management</h2>
            <p className="text-muted-foreground text-sm">
              Manage weekly posts for clients – start fresh from here.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleOpenCompanies}>
            <Plus className="w-4 h-4" />
            Add company
          </Button>
        </div>
      </div>

      {/* Companies with active LinkedIn subscription – company cards */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Companies with active LinkedIn subscription
        </h3>
        {linkedInCompanies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No companies with LinkedIn subscription yet. Use &quot;Add company&quot; and enable LinkedIn when creating one, or add companies from the Companies tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedInCompanies.map((company) => {
              const companyTasks = linkedInTasks.filter((t) => t.companyId === company.id);
              const activeCount = companyTasks.filter((t) => t.status !== 'completed').length;
              const completedCount = companyTasks.filter((t) => t.status === 'completed').length;
              return (
                <Card
                  key={company.id}
                  className="p-4 rounded-xl border border-border/70 bg-card shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {(onUpdateCompany || onDeleteCompany) && (
                    <div className="absolute top-3 right-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                            <span className="sr-only">Options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setCalendarCompany(company)} className="gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            View calendar
                          </DropdownMenuItem>
                          {onUpdateCompany && (
                            <DropdownMenuItem onClick={() => handleOpenEditCompany(company)} className="gap-2">
                              <Pencil className="w-4 h-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDeleteCompany && (
                            <DropdownMenuItem
                              onClick={() => setDeleteCompany(company)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-10 h-10 rounded-lg object-cover border border-border/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
                          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                        </div>
                      )}
                      {onUpdateCompany && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditLogo(company)}
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted border border-border shadow flex items-center justify-center hover:bg-muted/80 transition-colors"
                          title="Add or change logo"
                          aria-label="Add or change logo"
                        >
                          <ImagePlus className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{company.name}</p>
                      {company.contactEmail && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          {company.contactEmail}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2 gap-1 text-xs">
                        <Linkedin className="w-3 h-3" />
                        LinkedIn Active
                      </Badge>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/70 text-xs text-muted-foreground">
                        <span>{companyTasks.length} post{companyTasks.length !== 1 ? 's' : ''}</span>
                        {activeCount > 0 && (
                          <span>{activeCount} ongoing</span>
                        )}
                        {completedCount > 0 && (
                          <span>{completedCount} done</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Posts due today */}
      {postsDueToday.length > 0 && (
        <Card className="p-4 border-[#0A66C2]/30 bg-[#0A66C2]/5">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#0A66C2]" />
            Posts due today
          </h3>
          <p className="text-muted-foreground text-xs mb-3">
            Add the LinkedIn URL when you&apos;ve posted to move these out of the list.
          </p>
          <ul className="space-y-2">
            {postsDueToday.map((task) => {
              const company = companies.find((c) => c.id === task.companyId);
              return (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-background/80 border border-border/50"
                >
                  <div>
                    <span className="font-medium text-foreground">{company?.name ?? task.companyName}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      Due {format(parseISO(task.endDate), 'd MMM')}
                    </span>
                  </div>
                  {onTaskClick && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => onTaskClick(task)}
                    >
                      <Pencil className="w-3 h-3" />
                      Add URL / Edit
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Weekly post tracker – posts per week, doc & LinkedIn URL */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Posting regularity tracker
            </h3>
            <p className="text-muted-foreground text-sm">
              Track posts by week for each client – doc link, upload date, and published LinkedIn URL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="tracker-month" className="text-sm text-muted-foreground whitespace-nowrap">
              Month
            </Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="tracker-month" className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {onAddLinkedInPost && (
              <Button variant="default" className="gap-2" onClick={openAddPostDialog}>
                <Plus className="w-4 h-4" />
                Add new post
              </Button>
            )}
          </div>
        </div>
        {linkedInCompanies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No LinkedIn clients yet. Add companies above to track posts.
          </div>
        ) : (
          <div className="space-y-6">
            {linkedInCompanies.map((company) => {
              const companyTasks = linkedInTasks
                .filter((t) => t.companyId === company.id && t.endDate.startsWith(selectedMonth))
                .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
              const byWeek = new Map<string, Task[]>();
              companyTasks.forEach((task) => {
                const weekStart = startOfWeek(parseISO(task.endDate), { weekStartsOn: 1 });
                const key = weekStart.toISOString().slice(0, 10);
                if (!byWeek.has(key)) byWeek.set(key, []);
                byWeek.get(key)!.push(task);
              });
              const weeks = Array.from(byWeek.entries()).sort(([a], [b]) => b.localeCompare(a));

              return (
                <Card key={company.id} className="p-4 rounded-xl border border-border/70 overflow-hidden">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    {company.logo ? (
                      <img src={company.logo} alt="" className="w-6 h-6 rounded object-cover" />
                    ) : (
                      <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                    )}
                    {company.name}
                  </h4>
                  {weeks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No posts for {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border/70">
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Week</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Post</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Doc</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Date of doc upload</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">LinkedIn URL</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Posted on</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeks.flatMap(([weekKey, tasksInWeek]) => {
                            const weekLabel = getWeekAndMonthLabel(weekKey);
                            return tasksInWeek.map((task) => (
                              <tr key={task.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-2 pr-4 text-muted-foreground align-top whitespace-nowrap">
                                  {weekLabel}
                                </td>
                                <td className="py-2 pr-4 align-top">
                                  <span className="font-medium text-foreground">{task.title}</span>
                                </td>
                                <td className="py-2 pr-4 align-top">
                                  {task.finalFileUrl ? (
                                    <a
                                      href={task.finalFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[200px]"
                                      title={task.finalFileUrl}
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      <span className="truncate">{task.finalFileUrl.replace(/^https?:\/\//, '').slice(0, 30)}…</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="py-2 pr-4 align-top whitespace-nowrap text-muted-foreground">
                                  {task.docUploadedAt
                                    ? format(parseISO(task.docUploadedAt), 'd MMM yyyy')
                                    : '—'}
                                </td>
                                <td className="py-2 pr-4 align-top min-w-[200px]">
                                  {editingPostUrlTaskId === task.id ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="url"
                                        value={editingPostUrlValue}
                                        onChange={(e) => setEditingPostUrlValue(e.target.value)}
                                        placeholder="https://linkedin.com/..."
                                        className="h-8 text-sm"
                                        onBlur={() => handleSaveLinkedInUrl(task)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveLinkedInUrl(task);
                                          }
                                          if (e.key === 'Escape') {
                                            setEditingPostUrlTaskId(null);
                                            setEditingPostUrlValue('');
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 shrink-0"
                                        onClick={() => handleSaveLinkedInUrl(task)}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPostUrlTaskId(task.id);
                                        setEditingPostUrlValue(task.linkedInPostUrl ?? '');
                                      }}
                                      className="text-left w-full min-h-[32px] px-2 py-1 rounded border border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {task.linkedInPostUrl ? (
                                        <a
                                          href={task.linkedInPostUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[220px]"
                                        >
                                          <ExternalLink className="w-3 h-3 shrink-0" />
                                          {task.linkedInPostUrl.replace(/^https?:\/\//, '').slice(0, 35)}…
                                        </a>
                                      ) : (
                                        <span className="text-xs">Add LinkedIn URL</span>
                                      )}
                                    </button>
                                  )}
                                </td>
                                <td className="py-2 pr-4 align-top whitespace-nowrap text-muted-foreground">
                                  <Popover
                                    open={postedOnPopoverTaskId === task.id}
                                    onOpenChange={(open) => {
                                      if (!open) setPostedOnPopoverTaskId(null);
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        className="text-left w-full min-h-[32px] px-2 py-1 rounded border border-transparent hover:border-border hover:bg-muted/50 transition-colors"
                                      >
                                        {task.linkedInPostedOn ? (
                                          <>
                                            {format(parseISO(task.linkedInPostedOn), 'd MMM yyyy')}
                                            {task.linkedInPostedBy ? ` by ${task.linkedInPostedBy}` : ''}
                                          </>
                                        ) : (
                                          <span className="text-muted-foreground">Set posted on</span>
                                        )}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72" align="end">
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <Label>Date</Label>
                                          <Input
                                            type="date"
                                            value={postedOnEditDate}
                                            onChange={(e) => setPostedOnEditDate(e.target.value)}
                                            className="h-9"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label>Posted by</Label>
                                          <Input
                                            value={postedOnEditBy}
                                            onChange={(e) => setPostedOnEditBy(e.target.value)}
                                            placeholder="Name"
                                            className="h-9"
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="w-full"
                                          onClick={() => handleSavePostedOn(task)}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new post questionnaire */}
      <Dialog open={addPostDialogOpen} onOpenChange={setAddPostDialogOpen}>
        <DialogContent className="sm:max-w-md h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
            <DialogTitle>Add new post</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <form onSubmit={handleAddPostSubmit} className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="add-post-client">Select client</Label>
              <Select value={addPostClientId} onValueChange={setAddPostClientId} required>
                <SelectTrigger id="add-post-client">
                  <SelectValue placeholder="Choose client" />
                </SelectTrigger>
                <SelectContent>
                  {linkedInCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-post-due">Due on</Label>
              <Input
                id="add-post-due"
                type="date"
                value={addPostDueOn}
                onChange={(e) => setAddPostDueOn(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                When this date is today, the post will appear in &quot;Posts due today&quot;.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-post-date">Posted on date (optional)</Label>
              <Input
                id="add-post-date"
                type="date"
                value={addPostDate}
                onChange={(e) => setAddPostDate(e.target.value)}
                placeholder="When you already posted"
              />
              {(addPostDate || addPostDueOn) && (
                <p className="text-xs text-muted-foreground">
                  Appears in: {getWeekAndMonthLabel(addPostDate || addPostDueOn)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-post-description">Post description</Label>
              <Textarea
                id="add-post-description"
                value={addPostDescription}
                onChange={(e) => setAddPostDescription(e.target.value)}
                placeholder="Describe the post content..."
                className="min-h-[80px] resize-y text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-post-special-notes">Special notes</Label>
              <Textarea
                id="add-post-special-notes"
                value={addPostSpecialNotes}
                onChange={(e) => setAddPostSpecialNotes(e.target.value)}
                placeholder="Any special notes..."
                className="min-h-[80px] resize-y text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Doc (URL or upload)</Label>
              {addPostDocFileName ? (
                <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{addPostDocFileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8"
                    onClick={() => {
                      setAddPostDocUrl('');
                      setAddPostDocFileName('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <Input
                  id="add-post-doc"
                  type="url"
                  value={addPostDocUrl.startsWith('data:') ? '' : addPostDocUrl}
                  onChange={(e) => setAddPostDocUrl(e.target.value)}
                  placeholder="https://... (doc link)"
                />
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,application/pdf,video/*"
                  className="sr-only"
                  id="add-post-doc-file"
                  onChange={handleAddPostDocFile}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => document.getElementById('add-post-doc-file')?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {addPostDocFileName ? 'Replace file' : 'Upload file (image, PDF, video)'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-post-url">LinkedIn URL of post (optional)</Label>
              <Input
                id="add-post-url"
                type="url"
                value={addPostUrl}
                onChange={(e) => setAddPostUrl(e.target.value)}
                placeholder="Add when posted – then it moves out of &quot;Due today&quot;"
              />
            </div>
            <p className="text-xs text-muted-foreground border-t pt-3">
              Recorded by: {CURRENT_USER_NAME} (ID: {CURRENT_USER_ID}) at {formatIST(new Date())}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddPostDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add post</Button>
            </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Company posting calendar sheet */}
      {calendarCompany && (
        <Sheet open={!!calendarCompany} onOpenChange={(open) => !open && setCalendarCompany(null)}>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="p-6 pb-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#0A66C2]" />
                {calendarCompany.name} – Posting calendar
              </SheetTitle>
              <SheetDescription>
                Dates with scheduled LinkedIn posts are highlighted.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const companyTasks = linkedInTasks.filter((t) => t.companyId === calendarCompany.id);
                const datesWithPosts = companyTasks.map((t) => parseISO(t.endDate));
                return (
                  <>
                    <Calendar
                      mode="single"
                      className="rounded-md border"
                      modifiers={{
                        hasPost: datesWithPosts,
                      }}
                      modifiersClassNames={{
                        hasPost: 'bg-[#0A66C2]/20 text-[#0A66C2] font-medium ring-1 ring-[#0A66C2]/40',
                      }}
                    />
                    {companyTasks.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Scheduled posts</h4>
                        <ul className="space-y-2">
                          {companyTasks
                            .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
                            .map((task) => (
                              <li
                                key={task.id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/70 bg-muted/30 text-sm"
                              >
                                <span className="font-medium text-foreground truncate">{task.title}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {format(parseISO(task.endDate), 'MMM d')}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Companies sheet: list + option to create new */}
      <Sheet open={companiesOpen} onOpenChange={setCompaniesOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>Companies</SheetTitle>
            <SheetDescription>
              View existing companies or add a new one for LinkedIn management.
            </SheetDescription>
            {onAddCompany && (
              <Button
                type="button"
                size="sm"
                className="gap-2 mt-2 w-fit"
                onClick={handleOpenNewCompany}
              >
                <Plus className="w-4 h-4" />
                New company
              </Button>
            )}
          </SheetHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No companies yet. Add one using the button above.
              </p>
            ) : (
              <ul className="space-y-2">
                {companies.map((company) => (
                  <li
                    key={company.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-border bg-card',
                      'hover:bg-muted/50 transition-colors'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{company.name}</p>
                      {company.contactEmail && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" />
                          {company.contactEmail}
                        </p>
                      )}
                      {company.linkedInSubscription && (
                        <Badge variant="secondary" className="mt-1 gap-1 text-xs">
                          <Linkedin className="w-3 h-3" />
                          LinkedIn
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* New company dialog */}
      {onAddCompany && (
        <Dialog open={newCompanyOpen} onOpenChange={setNewCompanyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCompanySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin-company-name">Company name</Label>
                <Input
                  id="linkedin-company-name"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin-company-email">Contact email (optional)</Label>
                <Input
                  id="linkedin-company-email"
                  type="email"
                  value={newCompanyEmail}
                  onChange={(e) => setNewCompanyEmail(e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Company logo (optional)</Label>
                <Input
                  id="linkedin-company-logo"
                  type="url"
                  value={newCompanyLogo.startsWith('data:') ? '' : newCompanyLogo}
                  onChange={(e) => setNewCompanyLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">or</span>
                  <Label htmlFor="linkedin-company-logo-file" className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-muted/50">
                      <Upload className="w-4 h-4" />
                      Upload image
                    </span>
                    <input
                      id="linkedin-company-logo-file"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleLogoFileNew}
                    />
                  </Label>
                </div>
                {newCompanyLogo && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <img
                      src={newCompanyLogo}
                      alt="Logo preview"
                      className="w-10 h-10 rounded-lg object-cover border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setNewCompanyLogo('')}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="linkedin-company-sub"
                  checked={newCompanyLinkedIn}
                  onCheckedChange={(c) => setNewCompanyLinkedIn(!!c)}
                />
                <Label htmlFor="linkedin-company-sub" className="cursor-pointer text-sm font-normal">
                  LinkedIn subscription (for this dashboard)
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setNewCompanyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!newCompanyName.trim()}>
                  Add company
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit company logo dialog */}
      {onUpdateCompany && editLogoCompany && (
        <Dialog open={!!editLogoCompany} onOpenChange={(open) => !open && setEditLogoCompany(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Company logo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveLogo} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set a logo for {editLogoCompany.name}. Enter a URL or upload an image.
              </p>
              <div className="space-y-2">
                <Label htmlFor="edit-logo-url">Logo URL</Label>
                <Input
                  id="edit-logo-url"
                  type="url"
                  value={editLogoUrl.startsWith('data:') ? '' : editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">or</span>
                  <Label htmlFor="edit-logo-file" className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-muted/50">
                      <Upload className="w-4 h-4" />
                      Upload image
                    </span>
                    <input
                      id="edit-logo-file"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleLogoFileEdit}
                    />
                  </Label>
                </div>
              </div>
              {editLogoUrl.trim() && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <img
                    src={editLogoUrl.trim()}
                    alt="Logo preview"
                    className="w-10 h-10 rounded-lg object-cover border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setEditLogoUrl('')}
                  >
                    Clear
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditLogoCompany(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save logo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit company dialog */}
      {onUpdateCompany && editCompany && (
        <Dialog open={!!editCompany} onOpenChange={(open) => !open && setEditCompany(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit company</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveEditCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company-name">Company name</Label>
                <Input
                  id="edit-company-name"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company-email">Contact email (optional)</Label>
                <Input
                  id="edit-company-email"
                  type="email"
                  value={editCompanyEmail}
                  onChange={(e) => setEditCompanyEmail(e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Company logo (optional)</Label>
                <Input
                  type="url"
                  value={editCompanyLogo.startsWith('data:') ? '' : editCompanyLogo}
                  onChange={(e) => setEditCompanyLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">or</span>
                  <Label htmlFor="edit-company-logo-file" className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-muted/50">
                      <Upload className="w-4 h-4" />
                      Upload image
                    </span>
                    <input
                      id="edit-company-logo-file"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleEditCompanyLogoFile}
                    />
                  </Label>
                </div>
                {editCompanyLogo && (
                  <div className="flex items-center gap-2 pt-1">
                    <img
                      src={editCompanyLogo}
                      alt="Logo preview"
                      className="w-10 h-10 rounded-lg object-cover border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setEditCompanyLogo('')}>
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-company-linkedin"
                  checked={editCompanyLinkedIn}
                  onCheckedChange={(c) => setEditCompanyLinkedIn(!!c)}
                />
                <Label htmlFor="edit-company-linkedin" className="cursor-pointer text-sm font-normal">
                  LinkedIn subscription
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditCompany(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!editCompanyName.trim()}>
                  Save
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete company confirmation */}
      {onDeleteCompany && deleteCompany && (
        <AlertDialog open={!!deleteCompany} onOpenChange={(open) => !open && setDeleteCompany(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete company?</AlertDialogTitle>
              <AlertDialogDescription>
                {(() => {
                  const taskCount = linkedInTasks.filter((t) => t.companyId === deleteCompany.id).length;
                  return taskCount > 0
                    ? `${deleteCompany.name} has ${taskCount} LinkedIn task(s). Tasks will keep the company name but the company will be removed from the list. Delete anyway?`
                    : `Remove ${deleteCompany.name} from the list? This cannot be undone.`;
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteCompany}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
