import { useState, useEffect, useRef } from 'react';
import { 
  AssistantRuntimeProvider, 
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage 
} from '@assistant-ui/react';
import { createWebLLMStore } from '@/lib/webllm-runtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings, Send } from 'lucide-react';

const models = [
  { id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC', name: 'Llama 3.2 3B', size: '2.0GB' },
  { id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', name: 'Llama 3.2 1B', size: '0.6GB' },
  { id: 'Qwen2.5-3B-Instruct-q4f32_1-MLC', name: 'Qwen2.5 3B', size: '2.0GB' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', name: 'Qwen2.5 1.5B', size: '1.0GB' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', name: 'Qwen2.5 0.5B', size: '0.4GB' },
];

function WebLLMRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ThreadMessageLike[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const webllmStore = useRef(createWebLLMStore()).current;

  const onNew = async (message: AppendMessage) => {
    if (message.content[0]?.type !== "text") {
      throw new Error("Only text messages are supported");
    }

    const input = message.content[0].text;
    
    // Add user message
    const userMessage: ThreadMessageLike = {
      role: "user",
      content: [{ type: "text", text: input }],
      id: `user-${Date.now()}`,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    if (!webllmStore.engine) {
      throw new Error("WebLLM engine not initialized");
    }

    setIsRunning(true);

    try {
      // Start with empty assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      let assistantContent = '';
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: [{ type: "text", text: "" }],
        id: assistantMessageId,
        createdAt: new Date(),
      }]);

      // Create completion stream
      const messageHistory: Array<{role: 'user' | 'assistant', content: string}> = [
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: Array.isArray(m.content) 
            ? m.content.map(c => c.type === 'text' ? c.text : '').join('')
            : String(m.content)
        })),
        { role: 'user' as const, content: input }
      ];

      const completion = await webllmStore.engine.chat.completions.create({
        messages: messageHistory,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });

      // Stream the response
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          assistantContent += delta;
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: [{ type: "text", text: assistantContent }] }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    convertMessage: (message: ThreadMessageLike) => message,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

// Simple message display
function MessageDisplay({ messages }: { messages: ThreadMessageLike[] }) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          How can I help you today?
        </div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              {Array.isArray(message.content) 
                ? message.content.map(c => c.type === 'text' ? c.text : '').join('')
                : String(message.content)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ChatInput({ onSendMessage }: { onSendMessage: (message: string) => void }) {
  const [input, setInput] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 min-h-[40px] max-h-[120px] resize-none"
          rows={1}
        />
        <Button type="submit" disabled={!input.trim()}>
          <Send size={16} />
        </Button>
      </div>
    </form>
  );
}

export function SimpleWebLLMChat() {
  const webllmStore = useRef(createWebLLMStore()).current;
  const [initState, setInitState] = useState(() => webllmStore.getInitializationState());
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [showModelSelector, setShowModelSelector] = useState(false);

  useEffect(() => {
    const checkState = () => {
      setInitState(webllmStore.getInitializationState());
    };

    const interval = setInterval(checkState, 100);

    // Initialize with saved model if available
    const state = webllmStore.getInitializationState();
    if (state.selectedModel && !state.isInitialized && !state.isInitializing) {
      webllmStore.initializeEngine(state.selectedModel);
    } else if (!state.selectedModel) {
      setShowModelSelector(true);
    }

    return () => clearInterval(interval);
  }, [webllmStore]);

  const handleModelSelect = async (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleInitializeModel = async () => {
    if (!selectedModelId) return;
    
    try {
      await webllmStore.initializeEngine(selectedModelId);
      setShowModelSelector(false);
    } catch (error) {
      console.error('Failed to initialize model:', error);
    }
  };

  const handleChangeModel = () => {
    webllmStore.resetEngine();
    setShowModelSelector(true);
    setSelectedModelId('');
  };

  // Show model selector
  if (showModelSelector || (!initState.isInitialized && !initState.isInitializing)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Select AI Model</CardTitle>
            <CardDescription>
              Choose a model to run locally in your browser. Larger models are more capable but take longer to download.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedModelId} onValueChange={handleModelSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a model..." />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{model.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">{model.size}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleInitializeModel} 
              disabled={!selectedModelId}
              className="w-full"
            >
              Initialize Model
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading screen during initialization
  if (initState.isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Initializing Model
            </CardTitle>
            <CardDescription>
              Downloading and loading {models.find(m => m.id === initState.selectedModel)?.name}...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={initState.initProgress * 100} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(initState.initProgress * 100)}% complete
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show chat interface
  return (
    <WebLLMRuntimeProvider>
      <div className="flex flex-col h-screen">
        <header className="border-b p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">WebLLM Chat</h1>
            <p className="text-sm text-muted-foreground">
              Running {models.find(m => m.id === initState.selectedModel)?.name} locally
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleChangeModel}>
            <Settings className="h-4 w-4 mr-2" />
            Change Model
          </Button>
        </header>
        
        <MessageDisplay messages={[]} />
        <ChatInput onSendMessage={() => {}} />
      </div>
    </WebLLMRuntimeProvider>
  );
}