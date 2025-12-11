import { ChatMessagesProps } from '../Interfaces';
import ConfirmDelete from '../components/ConfirmDelete';
import MessageInput from '../components/MessageInput';
import MessageList from '../components/MessageList';

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  newMessage,
  setNewMessage,
  sendMessage,
  isDeleteModalOpen,
  confirmDelete,
  currentChatId,
  closeDeleteModal,
  isDeleteAll,
  isSending,
  isStreaming = false,
  suggestions,
  onSuggestionClick,
  isLoadingSuggestions,
}) => {
  const handleQuestionClick = (question: string) => {
    // Create a synthetic event and send the question directly
    const fakeEvent = {
      preventDefault: () => {},
    } as React.FormEvent;

    // Send the question directly without setting it in the input
    sendMessage(fakeEvent, question);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ConfirmDelete
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        message={
          isDeleteAll
            ? 'Are you sure you want to delete all chats?'
            : 'Are you sure you want to delete this chat?'
        }
      />

      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onResend={(prompt) => {
            const fakeEvent = {
              preventDefault: () => {},
            } as React.FormEvent;
            sendMessage(fakeEvent, prompt);
          }}
          currentChatId={currentChatId}
          onQuestionClick={handleQuestionClick}
          isStreaming={isStreaming}
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
          isLoadingSuggestions={isLoadingSuggestions}
        />
      </div>

      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        currentChatId={currentChatId}
        isSending={isSending}
        isStreaming={isStreaming}
      />
    </div>
  );
};

export default ChatMessages;