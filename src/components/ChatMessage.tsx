import { Message } from '@/hooks/useWebLLM';
import { Bot, User, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={cn(
      'flex gap-3 p-4',
      isUser ? 'flex-row-reverse border-r-2 border-primary/20' : 'border-l-2 border-muted-foreground/20'
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
        'flex-1 space-y-1 min-w-0',
        isUser ? 'text-right' : 'text-left'
      )}>
        <div className="relative group">
          <div className={cn(
            'inline-block p-3 rounded-lg max-w-full break-words',
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
          {!isUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className={cn(
                "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0",
                copied && "opacity-100"
              )}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}