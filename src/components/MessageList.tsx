import { RefreshCw } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { markdownLookBack } from '@llm-ui/markdown';
import { throttleBasic, useLLMOutput } from '@llm-ui/react';
import { LLMOutputComponent } from '@llm-ui/react';

import { Message } from '../Interfaces';
import AudioPlayer from './AudioPlayer';
import DefaultQuestions from './DefaultQuestions';
import SuggestionsSlider from './SuggestionsSlider';
import { useAuth } from '../context/AuthContext';

const throttle = throttleBasic({
  readAheadChars: 40,
  targetBufferChars: 15,
  adjustPercentage: 0.1,
  frameLookBackMs: 10000,
  windowLookBackMs: 2000,
});

const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onResend: (prompt: string) => void;
  currentChatId: string;
  onQuestionClick: (question: string) => void;
  isStreaming?: boolean;
  suggestions: any[];
  onSuggestionClick: (suggestion: string) => void;
  isLoadingSuggestions: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onResend,
  currentChatId,
  onQuestionClick,
  isStreaming = false,
  suggestions,
  onSuggestionClick,
  isLoadingSuggestions,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, []);
  const { language } = useAuth();

  const lastMessage = messages[messages.length - 1];
  const isLastStreaming = isStreaming && lastMessage?.answer;

  const { blockMatches } = useLLMOutput({
    llmOutput: lastMessage?.answer || '',
    blocks: [],
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    throttle,
    isStreamFinished: !isStreaming,
  });

  if (!messages || messages.length === 0) {
    return isLoading ? (
      <div className="h-full flex flex-col items-center justify-center text-gray-600 px-4 text-center">
        <div className="flex space-x-1 mb-4">
          <div className="loading-dots"></div>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-[#0F4C44] mb-4">
          Loading...
        </h1>
      </div>
    ) : (
      <DefaultQuestions onQuestionClick={onQuestionClick} language={language as "en" | "mr"} />
    );
  }

  return (
    <div className="min-h-0 px-4 pt-4 custom-scrollbar">
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;

        return (
          <div key={`${message.messageId || index}`} className="space-y-4">
            {/* User message */}
            <div className="flex justify-end fade-in">
              <div className="max-w-[85%] sm:max-w-[80%] p-3 rounded-lg bg-[#0F4C44] text-white shadow-message">
                <div className="whitespace-pre-wrap break-words text-[14px]">
                  {message.prompt}
                </div>
              </div>
            </div>

            {/* AI response */}
            <div className="flex justify-start items-start space-x-2 fade-in">
              <div
                className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-lg text-gray-800 shadow-message transition-all duration-300 ${
                  isLast && isStreaming ? 'streaming-glow' : 'bg-gray-100'
                }`}
              >
                {/* Typing indicator */}
                {message.answer === '' && isLast && isStreaming ? (
                  <div className="typing-indicator">
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </div>
                ) : message.answer === '...' ? (
                  <div className="typing-indicator">
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                  </div>
                ) : message.answer ? (
                  <div className="space-y-2">
                    <div className="prose prose-sm text-sm sm:prose-base max-w-none [&_ul]:pl-2 [&_ol]:pl-2 [&_blockquote]:pl-4 text-justify">
                      {isLast && isLastStreaming ? (
                        <div>
                          {blockMatches.map((blockMatch, idx) => {
                            const Component = blockMatch.block.component;
                            return (
                              <Component key={idx} blockMatch={blockMatch} />
                            );
                          })}
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.answer}
                        </ReactMarkdown>
                      )}
                    </div>

                    {/* Streaming cursor */}
                    {isLast && isStreaming && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="streaming-cursor">|</span>
                        <div className="typing-indicator">
                          <span>●</span>
                          <span>●</span>
                          <span>●</span>
                        </div>
                      </div>
                    )}

                    {/* Audio player */}
                    {!isStreaming &&
                      !message.error &&
                      message.answer !== '...' && (
                        <div className="mt-3">
                          <AudioPlayer
                            answer={message.answer}
                            chatId={currentChatId}
                          />
                        </div>
                      )}

                    {/* Timestamp */}
                    {message.createdAt && !isStreaming && (
                      <div className="text-xs text-gray-500 mt-2 flex justify-end items-center">
                        {new Date(message.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No response received
                  </div>
                )}
              </div>

              {/* Resend button */}
              {(message.error || (!message.answer && !isStreaming)) && (
                <button
                  onClick={() => onResend(message.prompt)}
                  className="p-2 text-[#FFB800] hover:text-[#E5A600] transition-colors hover:scale-110 transform duration-200"
                  title="Resend message"
                  disabled={isStreaming}
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isStreaming ? 'opacity-50' : ''}`}
                  />
                </button>
              )}
            </div>

            {/* Show suggestions after the last message if response is complete */}
            {isLast && 
             !isStreaming && 
             message.answer && 
             !message.error && 
             message.answer !== '...' && (
              <SuggestionsSlider
                suggestions={suggestions}
                onSuggestionClick={onSuggestionClick}
                isLoading={isLoadingSuggestions}
              />
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;