import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Chat, Message, Suggestion } from '../Interfaces';
import { useAuth } from '../context/AuthContext';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);

  // New states for suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      createNewChat();
      getUsername();
    }
  }, [isLoggedIn, navigate]);

  const getUsername = async () => {
    try {
      const response = await axios.get('/api/get_username', {
        withCredentials: true,
      });
      setUsername(response.data.username);
    } catch (error) {
      handleAxiosError(error, 'Error fetching username');
    }
  };

  const fetchChats = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await axios.get('/api/get_chats', {
        withCredentials: true,
      });
      setChats(response.data.chats);
    } catch (error) {
      handleAxiosError(error, 'Error fetching chats');
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    setError(null);
    try {
      const response = await axios.post(
        '/api/new_chat',
        {},
        { withCredentials: true },
      );
      if (response.data.chatId) {
        const newChatId = response.data.chatId;
        setCurrentChatId(newChatId);
        setMessages([]);
        setSuggestions([]); // Clear suggestions for new chat
        setLastProcessedMessageId(null);
        await fetchChats();
      } else {
        throw new Error('Chat ID not returned');
      }
    } catch (error) {
      handleAxiosError(error, 'Error creating new chat');
    }
  };

  const fetchChatHistory = async (chatId: string) => {
    if (isLoading && chatId === currentChatId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/history/${chatId}`, {
        withCredentials: true,
      });

      setMessages(response.data.messages || []);
      setCurrentChatId(chatId);
      setSuggestions([]); // Clear suggestions when switching chats
      setLastProcessedMessageId(null);
    } catch (error) {
      handleAxiosError(error, 'Error fetching chat history');
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async (question: string, answer: string, messageId: string) => {
    if (!currentChatId || lastProcessedMessageId === messageId) return;

    setIsLoadingSuggestions(true);
    try {
      console.log('Fetching suggestions for message:', messageId);

      const response = await axios.post(
        '/api/get_suggestions',
        {
          query: question,
          response: answer,
          // chatId: currentChatId,
        },
        // { withCredentials: true },
      );

      console.log('Raw API Response:', response.data);

      // Handle the exact response format: { suggestions: { question1: "", question2: "", question3: "" } }
      if (response.data && response.data.suggestions) {
        const suggestionsObject = response.data.suggestions;

        console.log('Suggestions object:', suggestionsObject);

        // Convert object format to array format
        const suggestionsArray: Suggestion[] = Object.entries(suggestionsObject)
          .filter(([key, value]) => {
            // Filter out empty, null, or invalid values
            const isValid = value &&
              typeof value === 'string' &&
              value.trim() !== '' &&
              value.trim().toLowerCase() !== 'null' &&
              value.trim().toLowerCase() !== 'undefined';

            console.log(`Filtering suggestion ${key}:`, { value, isValid });
            return isValid;
          })
          .map(([key, value]) => ({
            id: key, // Use the original key (question1, question2, etc.)
            text: (value as string).trim(),
            category: 'related'
          }));

        console.log('Processed suggestions array:', suggestionsArray);

        // Only set suggestions if we have valid ones
        if (suggestionsArray.length > 0) {
          setSuggestions(suggestionsArray);
          setLastProcessedMessageId(messageId);
          console.log('Successfully set suggestions:', suggestionsArray.length);
        } else {
          console.log('No valid suggestions found after filtering');
          setSuggestions([]);
        }
      } else {
        console.log('No suggestions in response or invalid response format');
        console.log('Response structure:', Object.keys(response.data || {}));
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);

      // Enhanced error logging
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Request setup error:', error.message);
        }
      } else {
        console.error('Unknown error:', error);
      }

      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Improved streaming function with better error handling and cleanup
  const sendMessageWithStreaming = useCallback(
    async (e: React.FormEvent, resendPrompt?: string) => {
      e.preventDefault();

      const messageToSend = resendPrompt || newMessage.trim();
      if (!messageToSend || !currentChatId) return;

      const tempMessageId = Date.now().toString();
      const tempMessage: Message = {
        prompt: messageToSend,
        answer: '',
        createdAt: new Date().toISOString(),
        messageId: tempMessageId,
        error: false,
      };

      setMessages((prev) => [...prev, tempMessage]);
      if (!resendPrompt) setNewMessage('');
      setIsSending(true);
      setIsStreaming(true);
      setError(null);

      // Clear previous suggestions when sending new message
      setSuggestions([]);
      setLastProcessedMessageId(null);

      let controller: AbortController | null = new AbortController();

      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            prompt: messageToSend,
            chatId: currentChatId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');

        if (!reader) {
          throw new Error('No reader available');
        }

        let accumulatedAnswer = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim(); // Remove "data: " prefix
                if (jsonStr === '') continue; // Skip empty data lines

                const data = JSON.parse(jsonStr);

                if (data.type === 'start') {
                  // Stream started
                  // console.log('Stream started');
                } else if (data.type === 'chunk' && data.content) {
                  // Handle content chunk - content is already properly encoded
                  accumulatedAnswer += data.content;
                  // console.log('Received chunk: \n', data.content);

                  // Update the message with streaming content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.messageId === tempMessageId
                        ? { ...msg, answer: accumulatedAnswer }
                        : msg,
                    ),
                  );
                } else if (data.type === 'end') {
                  // Stream completed
                  // console.log('Stream completed');
                  break;
                } else if (data.type === 'error') {
                  throw new Error(data.message || 'Streaming error');
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line, parseError);
              }
            }
          }
        }

        // Add trailing buffer content if any remains
        if (buffer.trim()) {
          try {
            const jsonStr = buffer.trim().startsWith('data: ')
              ? buffer.slice(6).trim()
              : buffer.trim();

            const data = JSON.parse(jsonStr);
            if (data.type === 'chunk' && data.content) {
              accumulatedAnswer += data.content;
            }
          } catch (e) {
            console.warn('Failed to parse trailing buffer content', e);
          }
        }

        // Final update with complete message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === tempMessageId
              ? {
                ...msg,
                answer: accumulatedAnswer,
                createdAt: new Date().toISOString(),
                error: false,
              }
              : msg,
          ),
        );

        // Fetch suggestions after response is complete
        if (accumulatedAnswer && !controller?.signal.aborted) {
          setTimeout(() => {
            fetchSuggestions(messageToSend, accumulatedAnswer, tempMessageId);
          }, 500); // Small delay to ensure UI updates
        }

        // Update chat list after sending message
        await fetchChats();
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          console.log('Stream was cancelled');
        } else {
          console.error('Streaming error:', error);
          handleMessageError(error, tempMessage);
        }
      } finally {
        controller = null;
        setIsSending(false);
        setIsStreaming(false);
      }
    },
    [currentChatId, newMessage, fetchChats, lastProcessedMessageId],
  );

  const handleSuggestionClick = (suggestion: string) => {
    // Set the suggestion text in the input field and clear previous input
    setNewMessage(suggestion);

    // Clear suggestions to hide the slider
    setSuggestions([]);
    setLastProcessedMessageId(null);
  };

  const handleMessageError = (error: unknown, tempMessage: Message) => {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Error sending message. Please try again.';

    setMessages((prev) =>
      prev.map((msg) =>
        msg.messageId === tempMessage.messageId
          ? {
            ...msg,
            answer: 'Failed to get response. Please try again.',
            error: true,
          }
          : msg,
      ),
    );
    setError(errorMessage);
  };

  const handleAxiosError = (error: unknown, defaultMessage: string) => {
    if (axios.isAxiosError(error) && error.response) {
      setError(
        error.response.data.detail || `${defaultMessage}. Please try again.`,
      );
    } else {
      setError(`${defaultMessage}. Please try again.`);
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
      document.cookie =
        'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      navigate('/login');
    } catch (error) {
      handleAxiosError(error, 'Error logging out');
    }
  };

  const handleDeleteChat = (chatId: string) => {
    setIsSidebarOpen(false);
    setDeleteChatId(chatId);
    setIsDeleteAll(false);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAllChats = () => {
    setIsSidebarOpen(false);
    setIsDeleteAll(true);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (isDeleteAll) {
      await deleteAllChats();
    } else if (deleteChatId) {
      await deleteChat(deleteChatId);
    }
    setIsDeleteModalOpen(false);
  };

  const deleteChat = async (chatId: string) => {
    try {
      await axios.delete(`/api/delete_chat/${chatId}`, {
        withCredentials: true,
      });

      setChats((prevChats) =>
        prevChats.filter((chat) => chat.chat_id !== chatId),
      );

      if (currentChatId === chatId) {
        setCurrentChatId('');
        setMessages([]);
        setSuggestions([]);
        setLastProcessedMessageId(null);
      }

      if (chats.length === 1) {
        await createNewChat();
      }
    } catch (error) {
      handleAxiosError(error, 'Error deleting chat');
    }
  };

  const deleteAllChats = async () => {
    try {
      await axios.delete('/api/delete_all_chats', { withCredentials: true });
      setChats([]);
      setCurrentChatId('');
      setMessages([]);
      setSuggestions([]);
      setLastProcessedMessageId(null);
      await createNewChat();
    } catch (error) {
      handleAxiosError(error, 'Error deleting all chats');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchChats();
    }
  }, [isLoggedIn]);

  return {
    messages,
    newMessage,
    setNewMessage,
    isSidebarOpen,
    setIsSidebarOpen,
    chats,
    currentChatId,
    isLoading,
    error,
    username,
    isDeleteModalOpen,
    isDeleteAll,
    sendMessage: sendMessageWithStreaming,
    handleDeleteChat,
    handleDeleteAllChats,
    confirmDelete,
    handleLogout,
    fetchChatHistory,
    createNewChat,
    closeDeleteModal: () => setIsDeleteModalOpen(false),
    isSending,
    isStreaming,
    suggestions,
    isLoadingSuggestions,
    handleSuggestionClick,
  };
};