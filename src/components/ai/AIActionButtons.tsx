import React, { useState } from 'react';
import { aiService } from '../../services/ai.service';
import AIBadge from './AIBadge';

interface AIActionButtonsProps {
  text: string;
  onTextChange: (newText: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * AI Action Buttons for Text Areas
 * 
 * Provides Summarize, Translate, and Improve Text actions
 * for any text input/textarea
 */
export const AIActionButtons: React.FC<AIActionButtonsProps> = ({
  text,
  onTextChange,
  className = '',
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim() || isLoading) return;
    
    setIsLoading(true);
    setLoadingAction('summarize');
    try {
      const summary = await aiService.summarizeDocument(text);
      onTextChange(summary);
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleTranslate = async (targetLang: string) => {
    if (!text.trim() || isLoading) return;
    
    setIsLoading(true);
    setLoadingAction('translate');
    setShowLangMenu(false);
    try {
      const translated = await aiService.translateDocument(text, targetLang);
      onTextChange(translated);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleImprove = async () => {
    if (!text.trim() || isLoading) return;
    
    setIsLoading(true);
    setLoadingAction('improve');
    try {
      // Use AI to improve the text
      const improved = await aiService.chatWithAI(
        `Improve and polish the following text to make it more professional and clear. Return ONLY the improved text:\n\n${text}`
      );
      onTextChange(improved);
    } catch (error) {
      console.error('Text improvement failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'ar', label: 'Arabic' },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-400">AI Actions:</span>
      
      {/* Summarize Button */}
      <button
        onClick={handleSummarize}
        disabled={disabled || isLoading || !text.trim()}
        className="
          inline-flex items-center gap-1.5 px-3 py-1.5
          text-xs font-medium rounded-lg
          bg-purple-50 text-purple-700 
          hover:bg-purple-100 
          dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          group
        "
        title="Summarize this text using AI"
      >
        {loadingAction === 'summarize' ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        )}
        <span>Summarize</span>
        <AIBadge size="sm" variant="subtle" showIcon={false} text="" className="ml-0.5 !px-1" />
      </button>

      {/* Translate Button with Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          disabled={disabled || isLoading || !text.trim()}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            text-xs font-medium rounded-lg
            bg-blue-50 text-blue-700 
            hover:bg-blue-100 
            dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
          title="Translate this text using AI"
        >
          {loadingAction === 'translate' ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          )}
          <span>Translate</span>
          <AIBadge size="sm" variant="subtle" showIcon={false} text="" className="ml-0.5 !px-1" />
        </button>

        {/* Language Dropdown */}
        {showLangMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowLangMenu(false)}
            />
            <div className="absolute left-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslate(lang.code)}
                  className="
                    w-full px-4 py-2 text-left text-sm
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    text-gray-700 dark:text-gray-300
                    first:rounded-t-lg last:rounded-b-lg
                  "
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Improve Button */}
      <button
        onClick={handleImprove}
        disabled={disabled || isLoading || !text.trim()}
        className="
          inline-flex items-center gap-1.5 px-3 py-1.5
          text-xs font-medium rounded-lg
          bg-green-50 text-green-700 
          hover:bg-green-100 
          dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
        title="Improve and polish this text using AI"
      >
        {loadingAction === 'improve' ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        <span>Improve</span>
        <AIBadge size="sm" variant="subtle" showIcon={false} text="" className="ml-0.5 !px-1" />
      </button>
    </div>
  );
};

export default AIActionButtons;
