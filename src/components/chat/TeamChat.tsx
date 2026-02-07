import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile } from 'lucide-react';
import { ChatMessage } from '@/types/task';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface TeamChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessage) => void;
  /** Logged-in user for sender and "You" label */
  currentUser?: { id: string; name: string };
}

export function TeamChat({ messages, onSendMessage, currentUser }: TeamChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const senderId = currentUser?.id ?? '';
  const senderName = currentUser?.name ?? 'You';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId,
      senderName,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    onSendMessage(message);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col min-h-[280px] h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] animate-fade-in w-full">
      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="p-3 sm:p-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-foreground text-base sm:text-lg">Team Chat</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">5 team members online</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
          {messages.map((msg) => {
            const isOwn = msg.senderId === senderId;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-slide-up',
                  isOwn && 'flex-row-reverse'
                )}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-[10px] sm:text-xs text-primary-foreground font-medium shrink-0">
                  {msg.senderName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium text-foreground',
                        isOwn && 'order-2'
                      )}
                    >
                      {isOwn ? 'You' : msg.senderName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.timestamp), 'h:mm a')}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'px-4 py-2 rounded-2xl text-sm',
                      isOwn
                        ? 'bg-accent text-accent-foreground rounded-br-md'
                        : 'bg-secondary text-secondary-foreground rounded-bl-md'
                    )}
                  >
                    {msg.message}
                  </div>
                  {msg.taskId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Linked to task
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 min-w-0 text-sm sm:text-base"
            />
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 hidden sm:flex">
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button type="submit" variant="accent" size="icon" className="h-9 w-9 shrink-0">
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
