export interface Message {
  prompt: string;
  answer: string;
  createdAt: string;
  messageId: string;
  error?: boolean;
  audioUrl?: string;
}

export interface Chat {
  chat_id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  user_id: string;
}

export interface ChatSidebarProps {
  chats: Chat[];
  isSidebarOpen: boolean;
  currentChatId: string | null;
  handleDeleteChat: (chatId: string) => void;
  handleDeleteAllChat: () => void;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  isLoading: boolean;
  username: string;
}

export interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (e: React.FormEvent, resendPrompt?: string) => void;
  isDeleteModalOpen: boolean;
  confirmDelete: () => void;
  currentChatId: string;
  closeDeleteModal: () => void;
  isDeleteAll: boolean;
  isSending: boolean;
  isStreaming?: boolean;
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: string) => void;
  isLoadingSuggestions: boolean;
}

export interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onResend: (prompt: string) => void;
  currentChatId: string;
  onQuestionClick: (question: string) => void;
  isStreaming?: boolean;
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: string) => void;
  isLoadingSuggestions: boolean;
}

export interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  currentChatId: string | null;
  isSending: boolean;
  isStreaming?: boolean;
}

// Stream response types for better type safety
export interface Stream {
  data: string;
  isFinal?: boolean;
}

export interface StreamChunk {
  chunk: string;
  done: boolean;
}

export interface StreamResponse {
  messageId: string;
  chunks: StreamChunk[];
  isComplete: boolean;
}

export interface StreamError {
  error: true;
  message: string;
}

// Updated interfaces for suggestions to match API response
export interface Suggestion {
  id: string;
  text: string;
  category?: string;
}

export interface SuggestionsSliderProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export interface SuggestionsRequest {
  question: string;
  answer: string;
  chatId: string;
}

// Updated to match the exact API response format
export interface SuggestionsResponse {
  suggestions: {
    question1: string;
    question2: string;
    question3: string;
    [key: string]: string; // Allow for additional questions
  };
  success?: boolean;
  message?: string;
}

// Alternative interface for more flexible response handling
export interface SuggestionsApiResponse {
  suggestions: Record<string, string>;
  success?: boolean;
  message?: string;
}