import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, DocumentFile, Message, UsageStats, UserProfile, Conversation } from '../types';
import { estimateTokens } from '../services/geminiService';

interface AppContextType extends AppState {
  documents: DocumentFile[]; // Explicitly redeclare for clarity
  messages: Message[]; // Helper: returns messages of active conversation
  activeConversation: Conversation | undefined;
  
  // Document Actions
  addDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => void;
  
  // Chat Actions
  addMessage: (text: string, role: 'user' | 'model') => void;
  updateLastMessage: (text: string) => void;
  createChat: () => void;
  selectChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  deleteChat: (id: string) => void;
  
  // Usage & Settings Actions
  updateUsage: (tokens: number) => void;
  setBudget: (limit: number) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_USAGE: UsageStats = {
  daily: 1250,
  monthly: 45000,
  yearly: 540000,
  budget: 1000000 // Monthly budget
};

const INITIAL_USER: UserProfile = {
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  avatarUrl: 'https://picsum.photos/200',
  theme: 'light'
};

const DEFAULT_WELCOME_MSG: Message = {
  id: 'welcome',
  role: 'model',
  text: "Hello! I'm your RAG assistant. Upload documents to the Knowledge Base or ask me anything.",
  timestamp: Date.now()
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const [usage, setUsage] = useState<UsageStats>(INITIAL_USAGE);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  // Load from local storage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('lumina_docs');
    if (savedDocs) setDocuments(JSON.parse(savedDocs));
    
    const savedUsage = localStorage.getItem('lumina_usage');
    if (savedUsage) setUsage(JSON.parse(savedUsage));
    
    // Conversation Migration & Loading
    const savedConversations = localStorage.getItem('lumina_conversations');
    if (savedConversations) {
      const parsed: Conversation[] = JSON.parse(savedConversations);
      setConversations(parsed);
      if (parsed.length > 0) {
        // Validate active ID
        // We can't easily sync with 'activeConversationId' state here due to closure, 
        // but useEffect runs after render.
        // We'll set it to the first one if not set or if invalid (though localstorage only stores conversations)
        // Ideally we should persist activeConversationId too, but defaulting to first is fine.
        setActiveConversationId(parsed[0].id);
      } else {
        createChat();
      }
    } else {
      // Create initial chat
      createChat();
    }
  }, []);

  // Persist State
  useEffect(() => {
    localStorage.setItem('lumina_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('lumina_usage', JSON.stringify(usage));
  }, [usage]);

  useEffect(() => {
    localStorage.setItem('lumina_conversations', JSON.stringify(conversations));
  }, [conversations]);


  // --- Helper to create a new chat ---
  const createChat = useCallback(() => {
    const newChat: Conversation = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Conversation',
      messages: [{ ...DEFAULT_WELCOME_MSG, timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveConversationId(newChat.id);
  }, []);

  const selectChat = (id: string) => {
    setActiveConversationId(id);
  };

  const renameChat = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const deleteChat = (id: string) => {
    const remaining = conversations.filter(c => c.id !== id);
    
    if (remaining.length === 0) {
        // If deleting the last chat, reset to a fresh state with one new chat
        const newChat: Conversation = {
          id: Math.random().toString(36).substr(2, 9),
          title: 'New Conversation',
          messages: [{ ...DEFAULT_WELCOME_MSG, timestamp: Date.now() }],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        setConversations([newChat]);
        setActiveConversationId(newChat.id);
    } else {
        setConversations(remaining);
        // If the deleted chat was active, switch to the first available
        if (id === activeConversationId) {
            setActiveConversationId(remaining[0].id);
        }
    }
  };

  // --- Document Logic ---
  const addDocument = async (file: File) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newDoc: DocumentFile = {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date().toISOString(),
      status: 'processing',
      content: ''
    };
    setDocuments(prev => [...prev, newDoc]);

    try {
      const text = await readFileContent(file);
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'ready', content: text } : d));
    } catch (e) {
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'error' } : d));
      console.error("File read error", e);
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // --- Message Logic ---
  const addMessage = (text: string, role: 'user' | 'model') => {
    if (!activeConversationId) return;

    setConversations(prev => prev.map(chat => {
      if (chat.id === activeConversationId) {
        const newMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          role,
          text,
          timestamp: Date.now(),
          isStreaming: role === 'model'
        };
        
        // Auto-generate title from first user message if it's "New Conversation"
        let newTitle = chat.title;
        if (role === 'user' && chat.messages.length <= 1 && chat.title === 'New Conversation') {
          newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        }

        return {
          ...chat,
          title: newTitle,
          messages: [...chat.messages, newMessage],
          updatedAt: Date.now()
        };
      }
      return chat;
    }));
  };

  const updateLastMessage = (text: string) => {
    if (!activeConversationId) return;

    setConversations(prev => prev.map(chat => {
      if (chat.id === activeConversationId) {
        const newMessages = [...chat.messages];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'model') {
          lastMsg.text = text;
          // Note: We don't toggle isStreaming to false here, the UI handles "generating" state 
          // or we could add an explicit 'finish' action.
        }
        return { ...chat, messages: newMessages };
      }
      return chat;
    }));
  };

  const updateUsage = useCallback((tokens: number) => {
    setUsage(prev => ({
      ...prev,
      daily: prev.daily + tokens,
      monthly: prev.monthly + tokens,
      yearly: prev.yearly + tokens
    }));
  }, []);

  const setBudget = (limit: number) => {
    setUsage(prev => ({ ...prev, budget: limit }));
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...profile }));
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  return (
    <AppContext.Provider value={{
      documents,
      conversations,
      activeConversationId,
      activeConversation,
      messages,
      usage,
      user,
      addDocument,
      deleteDocument,
      addMessage,
      updateLastMessage,
      createChat,
      selectChat,
      renameChat,
      deleteChat,
      updateUsage,
      setBudget,
      updateUserProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// Helper for file reading
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};