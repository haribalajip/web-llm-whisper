import { useEffect, useRef } from 'react';
import { useWebLLM } from '@/hooks/useWebLLM';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bot, Loader2 } from 'lucide-react';

export function WebLLMChat() {
  const {
    messages,
    isLoading,
    isInitializing,
    initProgress,
    sendMessage,
    initializeEngine,
    isEngineReady
  } = useWebLLM();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isEngineReady && !isInitializing) {
    return (
      <div className="min-h-screen bg-chat-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Bot className="w-16 h-16 mx-auto mb-4 text-chat-primary" />
          <h1 className="text-2xl font-bold mb-2">WebLLM Chat</h1>
          <p className="text-muted-foreground mb-6">
            A local AI chat assistant running in your browser
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            No data is sent to external servers. Everything runs locally.
          </p>
          <Button onClick={initializeEngine} className="w-full">
            Initialize Chat
          </Button>
        </Card>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-chat-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-chat-primary animate-spin" />
          <h2 className="text-xl font-semibold mb-4">Loading AI Model...</h2>
          <div className="space-y-3">
            <Progress value={50} className="w-full" />
            <p className="text-sm text-muted-foreground">{initProgress}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chat-surface flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-chat-border p-4">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-chat-primary" />
          <h1 className="text-lg font-semibold">WebLLM Chat</h1>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Local AI
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">
                Type a message below to get started with your local AI assistant.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-chat-message-ai text-chat-message-ai-foreground">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <div className="inline-block p-3 rounded-lg bg-chat-message-ai text-chat-message-ai-foreground rounded-bl-none">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput 
        onSendMessage={sendMessage} 
        disabled={isLoading || !isEngineReady}
      />
    </div>
  );
}