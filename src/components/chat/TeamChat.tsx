import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile } from 'lucide-react';
import { ChatMessage } from '@/types/task';
import { mockChatMessages } from '@/data/mockData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function TeamChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [newMessage, setNewMessage] = useState('');
  const currentUserId = '1'; // Simulating logged in user

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: 'Sarah Johnson',
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Team Chat</h2>
          <p className="text-sm text-muted-foreground">5 team members online</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-slide-up',
                  isOwn && 'flex-row-reverse'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-medium shrink-0">
                  {msg.senderName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={cn('max-w-[70%]', isOwn && 'text-right')}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-sm font-medium text-foreground',
                      isOwn && 'order-2'
                    )}>
                      {isOwn ? 'You' : msg.senderName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.timestamp), 'h:mm a')}
                    </span>
                  </div>
                  <div className={cn(
                    'px-4 py-2 rounded-2xl text-sm',
                    isOwn
                      ? 'bg-accent text-accent-foreground rounded-br-md'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  )}>
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

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon">
              <Smile className="w-5 h-5" />
            </Button>
            <Button type="submit" variant="accent" size="icon">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
