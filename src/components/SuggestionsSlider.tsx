import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { SuggestionsSliderProps } from '../Interfaces';

const SuggestionsSlider: React.FC<SuggestionsSliderProps> = ({
  suggestions,
  onSuggestionClick,
  isLoading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);


  const updateScrollButtons = () => {
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < suggestions.length - 1);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [suggestions, currentIndex]);

  useEffect(() => {
    if (suggestions.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          return (prevIndex + 1) % suggestions.length;
        });
      }, 3000);

      return () => clearInterval(intervalId);
    }
  }, [suggestions.length]);

  const scrollLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  };

  const scrollRight = () => {
    if (currentIndex < suggestions.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="w-[80%] px-2 sm:px-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-[#FFB800] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="text-xs sm:text-sm text-gray-600 ml-2">Loading suggestions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
    return null;
  }

  const validSuggestions = suggestions.filter(suggestion => {
    const isValid = suggestion &&
      suggestion.text &&
      typeof suggestion.text === 'string' &&
      suggestion.text.trim() !== '' &&
      suggestion.text.trim().toLowerCase() !== 'null' &&
      suggestion.text.trim().toLowerCase() !== 'undefined';

    if (!isValid) {
      return null
    }

    return isValid;
  });

  if (validSuggestions.length === 0) {
    return null;
  }


  return (
    <div className="w-full lg:w-[80%] sm:px-4">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {validSuggestions.length > 1 && (
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={`flex-shrink-0 p-1 sm:p-2 rounded-full transition-all duration-200 scroll-arrow ${canScrollLeft
                ? 'bg-[#FFB800] text-[#0F4C44] hover:bg-[#E5A600] shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            aria-label="Previous suggestion"
            title="Previous suggestion"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        )}

        <div className="flex-1 max-w-full overflow-hidden">
          <button
            onClick={() => {
              onSuggestionClick(validSuggestions[currentIndex].text);
            }}
            className="w-full px-3 sm:px-6 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-[#FFB800] hover:text-[#0F4C44] hover:border-[#FFB800] transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 suggestion-item text-left"
            title={validSuggestions[currentIndex].text}
          >
            <span className="block whitespace-normal leading-relaxed break-words">
              {validSuggestions[currentIndex].text}
            </span>
          </button>
        </div>

        {validSuggestions.length > 1 && (
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            className={`flex-shrink-0 p-1 sm:p-2 rounded-full transition-all duration-200 scroll-arrow ${canScrollRight
                ? 'bg-[#FFB800] text-[#0F4C44] hover:bg-[#E5A600] shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            aria-label="Next suggestion"
            title="Next suggestion"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        )}
      </div>

    </div>
  );
};

export default SuggestionsSlider;