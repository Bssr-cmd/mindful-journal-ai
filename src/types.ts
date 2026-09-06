export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string; // ISO string
}

export interface ReflectionIntelligence {
  keyThoughts: string[];
  moodTone: string;
  moodScore: number; // 1 to 5
  actionItems: string[];
  reflectionQuestion: string;
  summary: string;
  generatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  intelligence?: ReflectionIntelligence;
  tags: string[];
  wordCount: number;
}

export type ReflectionMode = 'reflect' | 'brainstorm' | 'summarize';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
