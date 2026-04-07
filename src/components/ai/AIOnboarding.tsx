import React, { useState, useEffect } from 'react';
import AIBadge from './AIBadge';

interface AIOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

/**
 * AI Onboarding Modal
 * 
 * Introduces users to AI features in the application
 * Perfect for first-time users or demo presentations
 */
export const AIOnboarding: React.FC<AIOnboardingProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('bizflow_ai_onboarding_seen');
    setHasSeenOnboarding(!!seen);
  }, []);

  const markAsSeen = () => {
    localStorage.setItem('bizflow_ai_onboarding_seen', 'true');
    setHasSeenOnboarding(true);
  };

  const handleClose = () => {
    markAsSeen();
    onClose();
  };

  const features: FeatureCard[] = [
    {
      id: 'ocr',
      title: 'AI Document Scanner',
      description: 'Upload invoices, quotes, or sales orders. Our AI extracts data automatically and creates documents for you.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'chatbot',
      title: 'AI Assistant',
      description: 'Ask questions about invoices, clients, or expenses. Get instant help with the floating AI chat button.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'search',
      title: 'Smart Search',
      description: 'Search using natural language like "Show me unpaid clients from last month" and let AI find it for you.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'reports',
      title: 'AI Report Generator',
      description: 'Generate comprehensive business reports with AI-powered insights and recommendations.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'anomaly',
      title: 'Anomaly Detection',
      description: 'AI automatically detects unusual invoices, suspicious amounts, and alerts you to potential issues.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'from-red-500 to-pink-500',
    },
    {
      id: 'focus',
      title: 'Focus Mode',
      description: 'Enable AI-powered Focus Mode to minimize distractions and highlight your most important tasks.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const totalSteps = features.length;

  if (!isOpen || hasSeenOnboarding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="relative flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Discover AI Features</h2>
              <p className="text-purple-100">Unlock the power of AI in your workflow</p>
            </div>
          </div>
          
          <AIBadge variant="glow" text="Powered by AI" className="absolute top-6 right-6" />
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-700/50">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300
                ${index === currentStep 
                  ? 'w-8 bg-purple-500' 
                  : index < currentStep 
                    ? 'bg-purple-300' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }
              `}
            />
          ))}
        </div>

        {/* Feature showcase */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Feature Icon (Large) */}
            <div className="flex justify-center">
              <div className={`
                relative w-48 h-48 rounded-2xl 
                bg-gradient-to-br ${features[currentStep].color}
                flex items-center justify-center
                shadow-xl shadow-purple-500/20
                animate-float
              `}>
                <div className="text-white">
                  {features[currentStep].icon}
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-pulse" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '500ms' }} />
              </div>
            </div>

            {/* Feature Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <AIBadge size="sm" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {features[currentStep].title}
              </h3>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {features[currentStep].description}
              </p>

              {/* Tips */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium mb-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pro Tip
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Look for the <AIBadge size="sm" showIcon={false} text="AI" /> badge throughout the app to discover AI-powered features!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
          >
            Skip Tour
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStep < totalSteps - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="
                  px-6 py-2 bg-purple-600 text-white font-medium rounded-lg
                  hover:bg-purple-700 transition-colors
                  flex items-center gap-2
                "
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="
                  px-6 py-2 bg-green-600 text-white font-medium rounded-lg
                  hover:bg-green-700 transition-colors
                  flex items-center gap-2
                "
              >
                Get Started
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIOnboarding;
