import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, DocumentFile, Message, UsageStats, UserProfile } from '../types';
import { estimateTokens } from '../services/geminiService';

interface AppContextType extends AppState {
  addDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => void;
  addMessage: (text: string, role: 'user' | 'model') => void;
  updateLastMessage: (text: string) => void;
  clearChat: () => void;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your RAG assistant. Upload documents to the Knowledge Base or ask me anything.",
      timestamp: Date.now()
    }
  ]);
  const [usage, setUsage] = useState<UsageStats>(INITIAL_USAGE);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  // Load from local storage on mount (simulated persistence)
  useEffect(() => {
    const savedDocs = localStorage.getItem('lumina_docs');
    if (savedDocs) setDocuments(JSON.parse(savedDocs));
    
    const savedUsage = localStorage.getItem('lumina_usage');
    if (savedUsage) setUsage(JSON.parse(savedUsage));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('lumina_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('lumina_usage', JSON.stringify(usage));
  }, [usage]);

  const addDocument = async (file: File) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Create optimistic entry
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

  const addMessage = (text: string, role: 'user' | 'model') => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      text,
      timestamp: Date.now(),
      isStreaming: role === 'model'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const updateLastMessage = (text: string) => {
    setMessages(prev => {
      const newHistory = [...prev];
      const lastMsg = newHistory[newHistory.length - 1];
      if (lastMsg && lastMsg.role === 'model') {
        lastMsg.text = text;
        lastMsg.isStreaming = true; // Still streaming
      }
      return newHistory;
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  const updateUsage = useCallback((tokens: number) => {
    setUsage(prev => ({
      daily: prev.daily + tokens,
      monthly: prev.monthly + tokens,
      yearly: prev.yearly + tokens,
      budget: prev.budget
    }));
  }, []);

  const setBudget = (limit: number) => {
    setUsage(prev => ({ ...prev, budget: limit }));
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...profile }));
  };

  return (
    <AppContext.Provider value={{
      documents,
      messages,
      usage,
      user,
      addDocument,
      deleteDocument,
      addMessage,
      updateLastMessage,
      clearChat,
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