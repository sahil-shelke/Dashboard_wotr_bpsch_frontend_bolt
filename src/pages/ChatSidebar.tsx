import React from 'react';

import { ChatSidebarProps } from '../Interfaces';
import Sidebar from '../components/Sidebar';

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  isSidebarOpen,
  currentChatId,
  handleDeleteChat,
  handleDeleteAllChat,
  onChatSelect,
  onNewChat,
  onLogout,
  isLoading,
  username,
}) => {
  return (
    <Sidebar
      chats={chats}
      isSidebarOpen={isSidebarOpen}
      currentChatId={currentChatId}
      handleDeleteChat={handleDeleteChat}
      handleDeleteAllChat={handleDeleteAllChat}
      onChatSelect={onChatSelect}
      onNewChat={onNewChat}
      onLogout={onLogout}
      isLoading={isLoading}
      username={username}
    />
  );
};

export default ChatSidebar;
