export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  content: string;
  size: number;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  citations?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface UsageStats {
  daily: number;
  monthly: number;
  yearly: number;
  budget: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  theme: 'light' | 'dark' | 'system';
}

export interface AppState {
  documents: DocumentFile[];
  conversations: Conversation[];
  activeConversationId: string | null;
  usage: UsageStats;
  user: UserProfile;
}

export type View = 'chat' | 'knowledge' | 'usage' | 'settings' | 'profile';