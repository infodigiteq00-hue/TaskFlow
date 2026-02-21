import { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Send, Paperclip, Smile, X, Download, Pencil, Trash2, Reply, Info } from 'lucide-react';
import { ChatMessage, TeamMember } from '@/types/task';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { uploadTaskFile } from '@/lib/storage';
import { FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type PendingAttachment = { url: string; name: string; isImage: boolean };

const EMOJI_LIST = ['😀', '😊', '😂', '👍', '❤️', '🎉', '🔥', '👋', '✅', '🙏', '💯', '✨', '😅', '👏', '🤔', '😎'];

/** Professional emojis only for message reactions */
const REACTION_EMOJIS = ['👍', '👏', '✅', '❤️', '😊', '🙏', '💯', '✨'];

const SWIPE_THRESHOLD_PX = 60;

const URL_REGEX = /https?:\/\/[^\s]+/g;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|avif)(\?.*)?$/i;

type MessageSegment = { type: 'text'; value: string } | { type: 'url'; value: string; isImage: boolean };

/** Parses reply block at start of message: "> @Name: excerpt\n\nrest" -> { reply: { name, text }, mainMessage } or null */
function parseReplyBlock(message: string): { reply: { name: string; text: string }; mainMessage: string } | null {
  const double = message.indexOf('\n\n');
  if (double === -1) return null;
  const firstPart = message.slice(0, double).trim();
  const mainMessage = message.slice(double + 2).trimStart();
  const match = firstPart.match(/^> @([^:]+): (.+)$/);
  if (!match) return null;
  return { reply: { name: match[1].trim(), text: match[2].trim() }, mainMessage };
}

function parseMessageWithUrls(message: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(URL_REGEX.source, 'g');
  while ((m = re.exec(message)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: message.slice(lastIndex, m.index) });
    }
    const url = m[0];
    segments.push({ type: 'url', value: url, isImage: IMAGE_EXT.test(url) });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < message.length) {
    segments.push({ type: 'text', value: message.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: 'text', value: message }];
}

/** Convert message to edit-friendly text: URLs become [File: filename] */
function messageToEditText(message: string): string {
  return parseMessageWithUrls(message)
    .map((seg) =>
      seg.type === 'text' ? seg.value : `[File: ${getFilenameFromUrl(seg.value)}]`
    )
    .join('');
}

/** Restore [File: ...] placeholders in edit text with original URLs (same order as in originalMessage) */
function editTextToMessage(editText: string, originalMessage: string): string {
  const segments = parseMessageWithUrls(originalMessage);
  const urls = segments
    .filter((s): s is { type: 'url'; value: string; isImage: boolean } => s.type === 'url')
    .map((s) => s.value);
  let i = 0;
  return editText.replace(/\[File: [^\]]+\]/g, () => urls[i++] ?? '');
}

function getFilenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segment = path.split('/').filter(Boolean).pop();
    if (!segment) return 'Document';
    const decoded = decodeURIComponent(segment);
    // Strip storage prefix e.g. "chat_1771566976230_" to show real file name
    const realName = decoded.replace(/^chat_\d+_/, '');
    return realName || decoded;
  } catch {
    return 'Document';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentLink({ url }: { url: string }) {
  const [size, setSize] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const filename = getFilenameFromUrl(url);

  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        const len = res.headers.get('content-length');
        if (len) setSize(parseInt(len, 10));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative inline-flex w-full min-w-0 max-w-[240px] rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md'
      )}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <FileText className="w-8 h-8 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" title={filename}>
            {filename}
          </p>
          <p className="text-xs text-muted-foreground">
            {size != null ? formatFileSize(size) : '—'}
          </p>
        </div>
      </a>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label="Download"
        className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background hover:text-primary disabled:opacity-70"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

export interface TeamChatProps {
  messages: ChatMessage[];
  teamMembers?: TeamMember[];
  /** When set, shows real-time presence count (who is in the app). Otherwise falls back to teamMembers.length */
  onlineCount?: number;
  onSendMessage: (message: ChatMessage) => void;
  onEditMessage?: (messageId: string, newMessage: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  /** Logged-in user for sender and "You" label */
  currentUser?: { id: string; name: string };
}

export function TeamChat({ messages, teamMembers = [], onlineCount, onSendMessage, onEditMessage, onDeleteMessage, onToggleReaction, currentUser }: TeamChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingOriginalMessage, setEditingOriginalMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartMsg = useRef<ChatMessage | null>(null);
  const senderId = currentUser?.id ?? '';
  const senderName = currentUser?.name ?? 'You';

  /** Map of user id -> display name from everyone who has sent a message (fallback when seen_by has no name) */
  const senderNameById = useMemo(() => {
    const map: Record<string, string> = {};
    messages.forEach((m) => {
      if (m.senderId && m.senderName) map[m.senderId] = m.senderName;
    });
    return map;
  }, [messages]);

  /** Resolve display names for seen-by user ids that we don't have (from profiles via RPC) */
  const [resolvedDisplayNames, setResolvedDisplayNames] = useState<Record<string, string>>({});
  const idsToResolve = useMemo(() => {
    const ids = new Set<string>();
    const hasName = (id: string) =>
      teamMembers.some((m) => m.id === id) || senderNameById[id];
    messages.forEach((msg) => {
      const raw = msg.seenBy ?? [];
      (Array.isArray(raw) ? raw : []).forEach((x: unknown) => {
        const id = typeof x === 'string' ? x : (x as { userId?: string }).userId ?? (x as { id?: string }).id;
        const name = typeof x === 'string' ? undefined : (x as { userName?: string }).userName ?? (x as { name?: string }).name;
        if (id && id !== senderId && !name && !hasName(id)) ids.add(id);
      });
    });
    return Array.from(ids);
  }, [messages, senderId, teamMembers, senderNameById]);
  useEffect(() => {
    if (idsToResolve.length === 0) return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuids = idsToResolve.filter((id) => uuidRegex.test(id));
    if (uuids.length === 0) return;
    supabase
      .rpc('get_display_names', { user_ids: uuids })
      .then(({ data, error }) => {
        if (error) return;
        const map: Record<string, string> = {};
        (data ?? []).forEach((row: { id: string; full_name: string | null }) => {
          if (row?.id && row.full_name) map[row.id] = row.full_name;
        });
        setResolvedDisplayNames((prev) => ({ ...prev, ...map }));
      });
  }, [idsToResolve.join(',')]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    let textPart = newMessage.trim();
    if (replyingTo) {
      const excerpt = replyingTo.message.slice(0, 80).replace(/\n/g, ' ');
      textPart = `> @${replyingTo.senderName}: ${excerpt}${replyingTo.message.length > 80 ? '…' : ''}\n\n${textPart}`;
      setReplyingTo(null);
    }
    const attachmentPart = pendingAttachments.length
      ? pendingAttachments.map((a) => a.url).join('\n')
      : '';
    const fullMessage = [textPart, attachmentPart].filter(Boolean).join('\n');
    if (!fullMessage) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId,
      senderName,
      message: fullMessage,
      timestamp: new Date().toISOString(),
    };

    onSendMessage(message);
    setNewMessage('');
    setPendingAttachments([]);
  };

  const handleSwipeStart = (e: React.TouchEvent, msg: ChatMessage) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartMsg.current = msg;
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const msg = touchStartMsg.current;
    touchStartMsg.current = null;
    if (msg && touchStartX.current - endX > SWIPE_THRESHOLD_PX) {
      setReplyingTo(msg);
      inputRef.current?.focus();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentUser?.id) return;
    setAttaching(true);
    try {
      const url = await uploadTaskFile(currentUser.id, file, 'chat');
      const isImage = file.type.startsWith('image/');
      setPendingAttachments((prev) => [
        ...prev,
        { url, name: file.name, isImage },
      ]);
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    } finally {
      setAttaching(false);
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? newMessage.length;
    const end = input.selectionEnd ?? start;
    const before = newMessage.slice(0, start);
    const after = newMessage.slice(end);
    setNewMessage(before + emoji + after);
    setEmojiOpen(false);
    setTimeout(() => {
      input.focus();
      const pos = start + emoji.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <div className="flex flex-col min-h-[280px] h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] animate-fade-in w-full">
      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="p-3 sm:p-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-foreground text-base sm:text-lg">Team Chat</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {typeof onlineCount === 'number'
              ? onlineCount === 1
                ? '1 member online'
                : `${onlineCount} members online`
              : teamMembers.length === 1
                ? '1 team member online'
                : `${teamMembers.length} team members online`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0">
          {messages.map((msg) => {
            const isOwn = msg.senderId === senderId;
            const isEditing = editingId === msg.id;

            return (
              <div
                key={msg.id}
                className={cn(
                  'group/message flex gap-3 animate-slide-up',
                  isOwn && 'flex-row-reverse'
                )}
                onTouchStart={(e) => handleSwipeStart(e, msg)}
                onTouchEnd={handleSwipeEnd}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-[10px] sm:text-xs text-primary-foreground font-medium shrink-0">
                  {msg.senderName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className={cn('max-w-[70%] min-w-0 flex-1', isOwn && 'flex flex-col items-end')}>
                  <div className={cn('flex items-center gap-2 mb-1 w-full', isOwn && 'justify-end')}>
                    <span
                      className={cn(
                        'text-sm font-medium text-foreground',
                        isOwn && 'order-2'
                      )}
                    >
                      {isOwn ? 'You' : msg.senderName}
                    </span>
                    <div className={cn('flex items-center gap-0.5 opacity-0 transition-opacity duration-200 ease-out group-hover/message:opacity-100', isOwn && 'order-1')}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setReplyingTo(msg);
                          inputRef.current?.focus();
                        }}
                        aria-label="Reply"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </Button>
                      {!isEditing && onToggleReaction && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="React"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align={isOwn ? 'end' : 'start'}>
                            <div className="flex flex-wrap gap-1">
                              {REACTION_EMOJIS.map((emoji) => {
                                const userIds = msg.reactions?.[emoji] ?? [];
                                const hasReacted = userIds.includes(senderId);
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => onToggleReaction(msg.id, emoji)}
                                    className={cn(
                                      'flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-muted',
                                      hasReacted && 'bg-primary/15'
                                    )}
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label="Seen by"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3 min-w-[140px]" align={isOwn ? 'end' : 'start'}>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Seen by</p>
                          {(() => {
                            const raw = msg.seenBy ?? [];
                            const normalized: { id: string; name?: string }[] = (Array.isArray(raw) ? raw : []).map(
                              (x: unknown) =>
                                typeof x === 'string'
                                  ? { id: x }
                                  : {
                                      id: (x as { userId?: string }).userId ?? (x as { id?: string }).id ?? '',
                                      name: (x as { userName?: string }).userName ?? (x as { name?: string }).name,
                                    }
                            ).filter((e) => e.id);
                            const displayList =
                              isOwn ? [{ id: senderId, name: 'You' }, ...normalized.filter((e) => e.id !== senderId)] : normalized;
                            if (displayList.length === 0) {
                              return <p className="text-sm text-muted-foreground">No views yet</p>;
                            }
                            return (
                              <ul className="text-sm text-foreground space-y-0.5">
                                {displayList.map((entry) => {
                                  const name =
                                    entry.id === senderId
                                      ? 'You'
                                      : (entry.name ?? teamMembers.find((m) => m.id === entry.id)?.name ?? senderNameById[entry.id] ?? resolvedDisplayNames[entry.id] ?? entry.id);
                                  return <li key={entry.id}>{name}</li>;
                                })}
                              </ul>
                            );
                          })()}
                        </PopoverContent>
                      </Popover>
                      {isOwn && onEditMessage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingId(msg.id);
                            setEditingText(messageToEditText(msg.message));
                            setEditingOriginalMessage(msg.message);
                          }}
                          aria-label="Edit message"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isOwn && onDeleteMessage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(msg.id)}
                          aria-label="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="w-full rounded-2xl border border-border bg-muted/50 p-2 space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="min-h-[80px] resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText('');
                            setEditingOriginalMessage(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (editingText.trim() && onEditMessage && editingOriginalMessage !== null) {
                              const restored = editTextToMessage(editingText.trim(), editingOriginalMessage);
                              onEditMessage(msg.id, restored);
                              setEditingId(null);
                              setEditingText('');
                              setEditingOriginalMessage(null);
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative inline-block max-w-[85%]">
                        <div
                          className={cn(
                            'px-4 py-2.5 pb-5 rounded-2xl text-sm space-y-2 border border-border',
                            'bg-muted/40 text-foreground rounded-br-md shadow-sm'
                          )}
                        >
                          {(() => {
                            const parsed = parseReplyBlock(msg.message);
                            const mainMessage = parsed ? parsed.mainMessage : msg.message;
                            return (
                              <>
                                {parsed?.reply && (
                                  <div className="border-l-2 border-muted-foreground/30 pl-3 py-1 space-y-0.5">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                      {parsed.reply.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground/80 whitespace-pre-wrap break-words">
                                      {parsed.reply.text}
                                    </p>
                                  </div>
                                )}
                                {parseMessageWithUrls(mainMessage).map((seg, i) => {
                                  if (seg.type === 'text') {
                                    return seg.value ? (
                                      <span key={i} className="whitespace-pre-wrap break-words">
                                        {seg.value}
                                      </span>
                                    ) : null;
                                  }
                                  if (seg.isImage) {
                                    return (
                                      <a
                                        key={i}
                                        href={seg.value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-lg overflow-hidden max-w-full"
                                      >
                                        <img
                                          src={seg.value}
                                          alt=""
                                          className="max-w-[240px] max-h-[200px] object-contain rounded-lg"
                                          loading="lazy"
                                          referrerPolicy="no-referrer"
                                        />
                                      </a>
                                    );
                                  }
                                  return (
                                    <DocumentLink key={i} url={seg.value} />
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                        {!isEditing && msg.reactions && Object.entries(msg.reactions).some(([emoji, userIds]) => REACTION_EMOJIS.includes(emoji) && (userIds?.length ?? 0) > 0) && (
                          <div
                            className={cn(
                              'absolute flex flex-wrap items-center gap-1.5 top-full -mt-3',
                              isOwn ? 'right-2' : 'left-2'
                            )}
                          >
                            {Object.entries(msg.reactions)
                              .filter(([emoji, userIds]) => REACTION_EMOJIS.includes(emoji) && (userIds?.length ?? 0) > 0)
                              .map(([emoji, userIds]) => {
                                const count = userIds.length;
                                const hasReacted = userIds.includes(senderId);
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => onToggleReaction?.(msg.id, emoji)}
                                    className={cn(
                                      'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs shadow-sm border border-border transition-colors hover:bg-muted',
                                      hasReacted ? 'bg-primary/15 text-primary' : 'bg-background text-muted-foreground'
                                    )}
                                    title={emoji}
                                  >
                                    <span>{emoji}</span>
                                    <span className="tabular-nums">{count}</span>
                                  </button>
                                );
                              })}
                          </div>
                        )}
                      </div>
                      {(() => {
                        const hasReactions = !isEditing && msg.reactions && Object.entries(msg.reactions).some(([emoji, userIds]) => REACTION_EMOJIS.includes(emoji) && (userIds?.length ?? 0) > 0);
                        return (
                          <div className={cn('flex items-center gap-2', isOwn && 'justify-end', hasReactions ? 'mt-8' : 'mt-0.5')}>
                            {!isEditing && msg.taskId && (
                              <p className="text-xs text-muted-foreground">
                                Linked to task
                              </p>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(msg.timestamp), 'h:mm a')}
                            </span>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-border shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            aria-hidden
            onChange={handleFileChange}
          />
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                Replying to <strong className="text-foreground">{replyingTo.senderName}</strong>: {replyingTo.message.slice(0, 50).replace(/\n/g, ' ')}{replyingTo.message.length > 50 ? '…' : ''}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setReplyingTo(null)}
                aria-label="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-border">
              {pendingAttachments.map((att, index) => (
                <div
                  key={`${att.url}-${index}`}
                  className="relative inline-flex items-center rounded-lg border border-border bg-muted/50 overflow-hidden"
                >
                  {att.isImage ? (
                    <>
                      <img
                        src={att.url}
                        alt=""
                        className="h-14 w-14 object-cover shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                        aria-label="Remove attachment"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 pl-2 py-1.5 pr-8 min-w-0 max-w-[180px] text-xs text-primary hover:underline"
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="truncate">{att.name}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-muted hover:bg-destructive/20 text-foreground flex items-center justify-center"
                        aria-label="Remove attachment"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleAttachClick}
              disabled={attaching || !currentUser?.id}
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 min-w-0 text-sm sm:text-base"
            />
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Insert emoji">
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end" side="top">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="h-8 w-8 rounded hover:bg-secondary text-lg flex items-center justify-center"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              type="submit"
              variant="accent"
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="Send"
              disabled={!newMessage.trim() && pendingAttachments.length === 0}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </form>
      </Card>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId && onDeleteMessage) onDeleteMessage(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
