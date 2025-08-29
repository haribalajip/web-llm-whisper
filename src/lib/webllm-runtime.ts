import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';

export interface WebLLMState {
  engine: MLCEngine | null;
  isInitializing: boolean;
  isInitialized: boolean;
  initProgress: number;
  selectedModel: string | null;
}

export interface WebLLMActions {
  initializeEngine: (modelId: string) => Promise<void>;
  resetEngine: () => void;
  getInitializationState: () => WebLLMState;
}

export function createWebLLMStore(): WebLLMState & WebLLMActions {
  let state: WebLLMState = {
    engine: null,
    isInitializing: false,
    isInitialized: false,
    initProgress: 0,
    selectedModel: typeof window !== 'undefined' ? localStorage.getItem('webllm-model') : null,
  };

  const subscribers = new Set<() => void>();

  const notifySubscribers = () => {
    subscribers.forEach(callback => callback());
  };

  const initializeEngine = async (modelId: string): Promise<void> => {
    if (state.isInitializing || (state.isInitialized && state.selectedModel === modelId)) {
      return;
    }

    state.isInitializing = true;
    state.isInitialized = false;
    state.initProgress = 0;
    state.selectedModel = modelId;

    // Persist model selection
    localStorage.setItem('webllm-model', modelId);
    notifySubscribers();

    try {
      // Reset engine if it exists
      if (state.engine) {
        await state.engine.unload();
        state.engine = null;
      }

      // Create new engine with progress callback
      state.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress) => {
          state.initProgress = progress.progress;
          notifySubscribers();
        }
      });
      
      state.isInitialized = true;
      state.isInitializing = false;
      state.initProgress = 1;
      notifySubscribers();
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      state.isInitializing = false;
      state.isInitialized = false;
      notifySubscribers();
      throw error;
    }
  };

  const resetEngine = () => {
    if (state.engine) {
      state.engine.unload();
      state.engine = null;
    }
    state.isInitialized = false;
    state.isInitializing = false;
    state.selectedModel = null;
    state.initProgress = 0;
    localStorage.removeItem('webllm-model');
    notifySubscribers();
  };

  const getInitializationState = () => ({ ...state });

  return {
    ...state,
    initializeEngine,
    resetEngine,
    getInitializationState,
  };
}