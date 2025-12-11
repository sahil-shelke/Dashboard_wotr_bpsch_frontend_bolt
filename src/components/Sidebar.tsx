import { LogOut, Trash2, User } from 'lucide-react';
import React from 'react';

import { Chat } from '../Interfaces';
import Logo from '../assets/WOTR_Logo_white.png';
import Loader from './Loader';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  isSidebarOpen: boolean;
  handleDeleteChat: (chatId: string) => void;
  handleDeleteAllChat: () => void;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  isLoading: boolean;
  username: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  currentChatId,
  isSidebarOpen,
  handleDeleteChat,
  handleDeleteAllChat,
  onChatSelect,
  onNewChat,
  onLogout,
  isLoading,
  username,
}) => {
  const sortedChats = [...chats].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div
      className={`fixed md:static w-70 h-full bg-[#0F4C44] transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } p-4 z-40`}
    >
      <div className="flex w-full justify-center items-center mb-1">
        <img src={Logo} alt="WOTR logo" width={'70%'} height="auto" />
      </div>

      <button
        onClick={onNewChat}
        className="w-[85%] md:w-full p-3 mx-[auto] bg-[#FFB800] text-[#0F4C44] font-semibold rounded-md mb-4 hover:bg-[#E5A600] flex items-center justify-center gap-2 text-sm lg:text-[16px]"
      >
        <span className="text-sm lg:text-xl">+</span> New Chat
      </button>

      <div
        className="custom-scrollbar space-y-2 overflow-y-auto"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Loader />
          </div>
        ) : sortedChats.length > 0 ? (
          sortedChats.map((chat) => (
            <ChatItem
              key={chat.chat_id}
              chat={chat}
              currentChatId={currentChatId}
              onSelect={onChatSelect}
              onDelete={handleDeleteChat}
            />
          ))
        ) : (
          <div className="text-white text-center">No chats available</div>
        )}
      </div>

      <div className="absolute bottom-2 left-2 right-4 flex items-center justify-between">
        <UserInfo username={username} />
        <DeleteAllButton onDelete={handleDeleteAllChat} />
        <LogoutButton onLogout={onLogout} />
      </div>
    </div>
  );
};

const ChatItem: React.FC<{
  chat: Chat;
  currentChatId: string | null;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}> = ({ chat, currentChatId, onSelect, onDelete }) => (
  <div className="flex items-center justify-between gap-1">
    <button
      onClick={() => onSelect(chat.chat_id)}
      className={`w-full p-3 text-left text-white overflow-hidden rounded-md flex items-center gap-2 ${
        currentChatId === chat.chat_id ? 'bg-[#0D3F39]' : 'hover:bg-[#0D3F39]'
      }`}
    >
      <span
        className="overflow-x-auto whitespace-nowrap scrl text-sm lg:text-[16px]"
        title={chat.title}
      >
        {chat.title ||
          (chat.messages?.length ? chat.messages[0].prompt : 'New Chat')}
      </span>
    </button>
    <button
      onClick={() => onDelete(chat.chat_id)}
      className="text-white hover:bg-[#0D3F39] hover:text-red-600 rounded-md p-2"
      aria-label="Delete chat"
      title="Delete chat"
    >
      <Trash2 className="h-5 w-5" />
    </button>
  </div>
);

const UserInfo: React.FC<{ username: string }> = ({ username }) => (
  <button className="w-full p-3 text-left text-white hover:bg-[#0D3F39] rounded-md flex items-center gap-2">
    <User className="h-5 w-5" />
    <span className="truncate text-sm lg:text-[16px]">{username}</span>
  </button>
);

const DeleteAllButton: React.FC<{ onDelete: () => void }> = ({ onDelete }) => (
  <button
    onClick={onDelete}
    className="text-white hover:bg-[#0D3F39] hover:text-red-600 rounded-md p-2"
    aria-label="Delete all chats"
    title="Delete all chat"
  >
    <Trash2 className="h-5 w-5" />
  </button>
);

const LogoutButton: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <button
    onClick={onLogout}
    className="text-white hover:bg-[#0D3F39] rounded-md p-2 hidden md:block"
    aria-label="Logout"
  >
    <LogOut className="h-5 w-5" />
  </button>
);

export default Sidebar;
