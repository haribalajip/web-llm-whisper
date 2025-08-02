import { useEffect, useRef } from 'react';
import { useWebLLM } from '@/hooks/useWebLLM';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Bot, Loader2 } from 'lucide-react';

const models = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama-3.2-1B-Instruct', size: '1B' },
  { id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen2.5-Coder-1.5B-Instruct', size: '1.5B' },
  { id: 'Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC', name: 'Qwen2.5-Coder-7B-Instruct', size: '7B' }
];

export function WebLLMChat() {
  const {
    messages,
    isLoading,
    isInitializing,
    initProgress,
    sendMessage,
    initializeEngine,
    isEngineReady,
    modelName,
    selectedModel,
    setSelectedModel
  } = useWebLLM();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Model selection screen
  if (!selectedModel) {
    return (
      <div className="min-h-screen bg-chat-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6">
          <Bot className="w-16 h-16 mx-auto mb-4 text-chat-primary" />
          <h1 className="text-2xl font-bold mb-2 text-center">Choose AI Model</h1>
          <p className="text-muted-foreground mb-6 text-center">
            Select a model to start chatting. All models run locally in your browser.
          </p>
          
          <RadioGroup value={selectedModel || ''} onValueChange={setSelectedModel} className="space-y-4">
            {models.map((model) => (
              <div key={model.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value={model.id} id={model.id} />
                <Label htmlFor={model.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-muted-foreground">Size: {model.size}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <Button 
            onClick={() => selectedModel && initializeEngine(selectedModel)} 
            disabled={!selectedModel}
            className="w-full mt-6"
          >
            Initialize Selected Model
          </Button>
        </Card>
      </div>
    );
  }

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
          <Button onClick={() => selectedModel && initializeEngine(selectedModel)} className="w-full">
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
        <div className="flex items-center gap-2 flex-wrap">
          <Bot className="w-6 h-6 text-chat-primary" />
          <h1 className="text-lg font-semibold">WebLLM Chat</h1>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Local AI
          </span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {modelName}
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