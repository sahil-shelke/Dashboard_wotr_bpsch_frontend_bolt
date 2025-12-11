import { Mic, MicOff, SendHorizontal, Square } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import Loader from './Loader';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  currentChatId: string | null;
  isSending: boolean;
  isStreaming?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  sendMessage,
  currentChatId,
  isSending,
  isStreaming = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Focus input when streaming ends
  useEffect(() => {
    if (!isStreaming && !isSending && inputRef.current) {
       inputRef.current.blur();
    }
  }, [isStreaming, isSending]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/ogg' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.ogg');

        setIsLoadingAudio(true);

        try {
          const response = await fetch(`/api/get_text_from_audio`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.text) {
            setNewMessage(data.text);
         
          } else {
            console.error('No text received from API');
          }
        } catch (error) {
          console.error('Error converting audio to text:', error);
        } finally {
          setIsLoadingAudio(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Determine if the form should be disabled
  const isDisabled = !currentChatId || isStreaming || isSending;
  const canSendMessage =
    currentChatId && newMessage.trim() && !isStreaming && !isSending;

  const handleSubmit = (e: React.FormEvent) => {
    if (canSendMessage) {
      sendMessage(e);
    } else {
      e.preventDefault();
    }
  };

  return (
    <div className="p-2 sm:p-4">
      {/* Streaming status indicator */}
      {/* {isStreaming && (
        <div className="mb-2 flex items-center justify-center text-sm text-[#0F4C44] bg-yellow-50 py-2 px-4 rounded-lg border border-yellow-200">
          <div className="flex space-x-1 mr-2">
            <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>Generating response...</span>
        </div>
      )} */}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 sm:space-x-4"
      >
        <div className="flex-1 flex gap-2">
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2 rounded-md transition-colors ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isDisabled || isLoadingAudio}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isLoadingAudio ? (
              <Loader />
            ) : isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            autoFocus={false}
            id="message"
            name="message"
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className={`flex-1 text-sm md:text-[16px] p-2 sm:p-3 bg-white border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:border-[#0F4C44] transition-colors ${
              isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
            }`}
            disabled={isDisabled}
          />

          {isMobile ? (
            <button
              type="submit"
              className={`p-2 flex justify-center items-center rounded-full transition-colors ${
                canSendMessage
                  ? 'bg-[#FFB800] text-[#0F4C44] hover:bg-[#E5A600]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canSendMessage}
              aria-label="Send message"
            >
              {isSending || isStreaming ? (
                <Square className="h-6 w-6" />
              ) : (
                <SendHorizontal className="h-6 w-6" />
              )}
            </button>
          ) : (
            <button
              type="submit"
              className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded md:rounded-md transition-colors ${
                canSendMessage
                  ? 'bg-[#FFB800] text-[#0F4C44] hover:bg-[#E5A600]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canSendMessage}
            >
              {isSending
                ? 'Sending...'
                : isStreaming
                  ? 'Generating...'
                  : 'Send'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
