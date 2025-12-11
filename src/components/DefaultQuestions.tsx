import { TreePine } from 'lucide-react';
import React from 'react';

interface DefaultQuestionsProps {
  language: 'en' | 'mr' | 'hi'; // Add more languages as needed
  onQuestionClick: (question: string) => void;
}

const DefaultQuestions: React.FC<DefaultQuestionsProps> = ({
  language,
  onQuestionClick,
}) => {
  const defaultQuestions = {
    en: [
      // Pest and Disease Management Questions
      'Give information about the diseases that affect the maize crop.',
      'What are the symptoms of thrips infestation in onion crops and how can it be controlled?',
      // Farming Advisory Questions
      'How should land preparation be done for soybean cultivation?',
      'What are the post-sowing recommendations for cotton cultivation?',
    ],
    mr: [
      // Pest and Disease Management Questions (कीड आणि रोग व्यवस्थापन प्रश्न)
      "मका पिकावर येणाऱ्या रोगांची माहिती दया. ",
      "कांदा पिकावरील फूलकिडीची लक्षणे कोणती असतात आणि त्याच्या नियंत्रणासाठी काय करावे?",
      // Farming Advisory Questions (शेती सल्ला प्रश्न)
      "सोयाबीन पिकासाठी शेताची पूर्वमशागत कशी करावी?",
      "कापूस पिकासाठी पेरणीनंतरच्या सूचना काय आहेत?"
    ],
    hi: [
      // Pest and Disease Management Questions (कीट और रोग प्रबंधन प्रश्न)
      'मक्का फसल पर लगने वाले रोगों की जानकारी दें।',
      'प्याज फसल में थ्रिप्स के संक्रमण के लक्षण क्या हैं और इसे कैसे नियंत्रित किया जा सकता है?',
      // Farming Advisory Questions (कृषि सलाह प्रश्न)
      'सोयाबीन की खेती के लिए भूमि तैयारी कैसे करें?',
      'कपास की खेती के लिए बुवाई के बाद की सिफारिशें क्या हैं?',
    ],
  };

  const questions = defaultQuestions[language];

  const headerText = {
    en: 'Ask',
    mr: 'विचारा',
    hi: 'पूछें',
  };

  const promptText = {
    en: 'How can I help you with your farming needs today?',
    mr: 'आज तुमच्या शेतीच्या गरजांसाठी मी कसा मदत करू शकतो?',
    hi: 'आज आपकी कृषि संबंधी जरूरतों में मैं कैसे मदद कर सकता हूँ?',
  };
  const instructionText = {
    en: 'Click on any question above or type your own question below',
    mr: 'वरील कोणत्याही प्रश्नावर क्लिक करा किंवा तुमचा स्वतःचा प्रश्न टाइप करा.',
    hi: 'ऊपर दिए गए किसी भी प्रश्न पर क्लिक करें या नीचे अपना प्रश्न टाइप करें।',
  };

  return (
    <div className="h-full flex flex-col items-center justify-start sm:justify-center text-gray-600 px-3 sm:px-4 py-4 sm:py-0 text-center max-w-4xl mx-auto overflow-y-auto">
      <div className="mb-4 sm:mb-8 flex-shrink-0">
        <div className="flex items-center justify-center mb-2 sm:mb-4 pt-8">
          <TreePine className="h-8 w-8 md:h-12 md:w-12 text-[#0F4C44] mr-2 sm:mr-3 flex-shrink-0" />
          <h1 className="text-lg lg:text-3xl font-bold text-[#0F4C44]">
            {headerText[language]}
          </h1>
        </div>
        <p className="text-sm lg:text-base text-gray-600 px-2 sm:px-0">
          {promptText[language]}
        </p>
      </div>

      <div className="w-full flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto pb-2">
          <div className="space-y-2 sm:space-y-4 pr-1">
            {questions.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="w-full p-3 sm:p-4 text-left bg-white border-2 border-gray-200 rounded-lg hover:border-[#0F4C44] hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-[#FFB800] rounded-full flex items-center justify-center text-[#0F4C44] font-semibold text-xs sm:text-sm group-hover:bg-[#E5A600] transition-colors">
                    {index + 1}
                  </div>
                  <p className="text-sm lg:text-base text-gray-700 group-hover:text-[#0F4C44] transition-colors leading-relaxed text-left break-words">
                    {question}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 mt-3 sm:mt-6 pt-2">
          <div className="text-xs sm:text-sm text-gray-500 px-2 sm:px-0">
            {instructionText[language]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultQuestions;
