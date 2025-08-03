import { Message } from '@/hooks/useWebLLM';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { theme } = useTheme();

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
          'inline-block p-3 rounded-lg w-full max-w-full',
          isUser 
            ? 'bg-chat-message-user text-chat-message-user-foreground rounded-br-none' 
            : 'bg-chat-message-ai text-chat-message-ai-foreground rounded-bl-none'
        )}>
          <div className="text-sm prose prose-sm max-w-none dark:prose-invert overflow-x-auto">
            <ReactMarkdown
              components={{
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  return !inline && language ? (
                    <SyntaxHighlighter
                      style={theme === 'dark' ? oneDark : oneLight}
                      language={language}
                      PreTag="div"
                      customStyle={{
                        backgroundColor: 'transparent',
                        padding: '0.75rem',
                        margin: 0,
                        fontSize: '0.875rem',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={cn("px-1.5 py-0.5 rounded text-sm font-mono bg-muted", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}