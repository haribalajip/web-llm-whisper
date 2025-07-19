import { Message } from '@/hooks/useWebLLM';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-3 p-4',
      isUser ? 'flex-row-reverse bg-chat-surface' : 'bg-background'
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser 
          ? 'bg-chat-message-user text-chat-message-user-foreground' 
          : 'bg-chat-message-ai text-chat-message-ai-foreground'
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className={cn(
        'flex-1 space-y-1',
        isUser ? 'text-right' : 'text-left'
      )}>
        <div className={cn(
          'inline-block p-3 rounded-lg max-w-xs lg:max-w-md xl:max-w-lg',
          isUser 
            ? 'bg-chat-message-user text-chat-message-user-foreground rounded-br-none' 
            : 'bg-chat-message-ai text-chat-message-ai-foreground rounded-bl-none'
        )}>
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}