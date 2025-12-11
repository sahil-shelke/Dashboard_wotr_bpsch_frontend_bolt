import { Volume2 } from 'lucide-react';
import React, { useState } from 'react';

import audioManager from '../utils/audioManager';
import Loader from './Loader';

// Import the global AudioManager

interface AudioPlayerProps {
  answer: string;
  chatId: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ answer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    if (!answer) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/read_aloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: answer }),
      });

      if (!response.ok) throw new Error('Failed to fetch audio');

      const audioBlob = await response.blob();
      const audioSrc = URL.createObjectURL(audioBlob);

      audioManager.playAudio(audioSrc, () => setIsPlaying(false));
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    audioManager.stopAudio();
    setIsPlaying(false);
  };

  return (
    <button
      onClick={isPlaying ? handleStop : handlePlay}
      disabled={isLoading}
      className={`p-2 rounded-full transition-colors ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
      }`}
      title={isPlaying ? 'Stop' : 'Play'}
      aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
    >
      {isLoading ? (
        <Loader />
      ) : (
        <Volume2
          className={`h-4 w-4 ${isPlaying ? 'text-[#FFB800]' : 'text-gray-600'}`}
        />
      )}
    </button>
  );
};

export default AudioPlayer;
