import { useState, useRef } from 'react';
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UseWebLLMReturn {
  messages: Message[];
  isLoading: boolean;
  isInitializing: boolean;
  initProgress: string;
  sendMessage: (content: string) => Promise<void>;
  initializeEngine: () => Promise<void>;
  isEngineReady: boolean;
}

export function useWebLLM(): UseWebLLMReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState('');
  const [isEngineReady, setIsEngineReady] = useState(false);
  const engineRef = useRef<MLCEngine | null>(null);

  const initializeEngine = async () => {
    if (engineRef.current) return;
    
    setIsInitializing(true);
    setInitProgress('Initializing WebLLM engine...');
    
    try {
      const engine = await CreateMLCEngine('Llama-3.2-1B-Instruct-q4f16_1-MLC', {
        initProgressCallback: (report) => {
          setInitProgress(report.text);
        }
      });
      
      engineRef.current = engine;
      setIsEngineReady(true);
      setInitProgress('Ready to chat!');
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      setInitProgress('Failed to initialize. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!engineRef.current || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      // Add empty assistant message that we'll update with streaming content
      setMessages(prev => [...prev, assistantMessage]);

      const stream = await engineRef.current.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          ...messages.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content }
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: true,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          // Update the assistant message with accumulated content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    isInitializing,
    initProgress,
    sendMessage,
    initializeEngine,
    isEngineReady
  };
}