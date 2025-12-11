import { gsap } from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

import Header from '../components/Header';
import { useChat } from '../hooks/useChat';
import ChatMessages from './ChatMessages';
import ChatSidebar from './ChatSidebar';

function ChatInterface() {
  const {
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
    sendMessage,
    handleDeleteChat,
    handleDeleteAllChats,
    confirmDelete,
    handleLogout,
    fetchChatHistory,
    createNewChat,
    closeDeleteModal,
    isSending,
    isStreaming,
    suggestions,
    isLoadingSuggestions,
    handleSuggestionClick,
  } = useChat();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    if (!ScrollSmoother.get()) {
      const smoother = ScrollSmoother.create({
        wrapper: '#wrapper',
        content: '#content',
      });

      return () => {
        smoother.kill(); // cleanup on unmount
      };
    }
  }, []);

  return (
    <div
      className="flex h-[100dvh] flex-col md:flex-row relative bg-white overflow-hidden"
      id="wrapper"
    >
      <Header
        error={error}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <ChatSidebar
        chats={chats}
        isSidebarOpen={isSidebarOpen}
        currentChatId={currentChatId}
        handleDeleteChat={handleDeleteChat}
        handleDeleteAllChat={handleDeleteAllChats}
        onChatSelect={fetchChatHistory}
        onNewChat={createNewChat}
        onLogout={handleLogout}
        isLoading={isLoading}
        username={username}
      />

      <div id="content">
        <div
          className="flex-1 relative mt-12 md:mt-0 overflow-hidden flex flex-col md:ml-0 h-[calc(100dvh-48px)] md:h-[100dvh]"
          onClick={() => setIsSidebarOpen(false)}
        >
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            newMessage={newMessage}
            currentChatId={currentChatId}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            isDeleteModalOpen={isDeleteModalOpen}
            confirmDelete={confirmDelete}
            closeDeleteModal={closeDeleteModal}
            isDeleteAll={isDeleteAll}
            isSending={isSending}
            isStreaming={isStreaming}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            isLoadingSuggestions={isLoadingSuggestions}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;