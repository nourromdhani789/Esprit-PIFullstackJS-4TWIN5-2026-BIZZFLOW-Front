/**
 * AI UI Enhancement Integration Guide
 * 
 * This file shows how to integrate the new AI components into existing pages
 * 
 * Import the CSS file in your main App.tsx or index.css:
 * import './styles/ai-animations.css';
 */

// ============================================
// 1. MAIN APP - Add AI Chatbot and Import CSS
// ============================================

// App.tsx modifications
/*
import './styles/ai-animations.css';
import { AIChatbotButton, AIOnboarding } from './components/ai';
import { useState, useEffect } from 'react';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Show onboarding on first visit
  useEffect(() => {
    const hasSeen = localStorage.getItem('bizflow_ai_onboarding_seen');
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="App">
      {/* Your existing app content *\/}
      
      {/* AI Onboarding Modal *\/}
      <AIOnboarding 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
      
      {/* AI Chatbot Floating Button *\/}
      <AIChatbotButton 
        isOpen={chatbotOpen}
        onClick={() => setChatbotOpen(!chatbotOpen)}
      />
      
      {/* AI Chatbot Window (when open) *\/}
      {chatbotOpen && (
        <AIChatbotWidget onClose={() => setChatbotOpen(false)} />
      )}
    </div>
  );
}
*/

// ============================================
// 2. ENHANCED CREATE INVOICE PAGE
// ============================================

// CreateInvoice.tsx modifications
/*
import { 
  AIBadge, 
  AIActionButtons, 
  AIResultCard, 
  AILoadingState,
  FocusModeIndicator,
  TTSButton 
} from '../components/ai';
import { useFocusMode } from '../contexts/FocusModeContext';

function CreateInvoice() {
  const { isFocusMode, suggestedAction, toggleFocusMode } = useFocusMode();
  const [notes, setNotes] = useState('');
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="p-4">
      {/* Focus Mode Indicator *\/}
      <FocusModeIndicator 
        isActive={isFocusMode}
        suggestedAction={suggestedAction}
        onToggle={toggleFocusMode}
      />
      
      {/* Page Header with AI Badge *\/}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Create New Invoice</h1>
          <AIBadge text="AI-Powered" />
        </div>
        
        {/* Focus Mode Toggle *\/}
        <button
          onClick={toggleFocusMode}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            ${isFocusMode 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
            transition-colors
          `}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7" />
          </svg>
          {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
        </button>
      </div>

      {/* AI Anomaly Detection Card *\/}
      {anomalyResult?.isAnomaly && (
        <AIResultCard
          title="AI Anomaly Detected"
          type="analysis"
          confidence={anomalyResult.confidence}
          onDismiss={() => setAnomalyResult(null)}
          className="mb-6"
        >
          <ul className="space-y-2">
            {anomalyResult.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </AIResultCard>
      )}

      {/* AI Analyzing State *\/}
      {isAnalyzing && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <AILoadingState message="AI is analyzing invoice for anomalies..." />
        </div>
      )}

      {/* Notes Section with AI Actions *\/}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notes</h2>
            <AIBadge size="sm" />
          </div>
          {/* TTS Button to read AI suggestions *\/}
          {anomalyResult && (
            <TTSButton 
              text={anomalyResult.reasons.join('. ')} 
              size="sm" 
            />
          )}
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes or payment instructions..."
          className="w-full h-24 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-4 py-3 text-sm resize-none
                     focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
        />
        
        {/* AI Action Buttons for Text *\/}
        <div className="mt-3">
          <AIActionButtons 
            text={notes}
            onTextChange={setNotes}
          />
        </div>
      </div>
    </div>
  );
}
*/

// ============================================
// 3. ENHANCED AI SCANNER PAGE
// ============================================

// AIScanner.tsx modifications
/*
import { 
  AIBadge, 
  AIResultCard, 
  AIGeneratingState,
  TTSButton 
} from '../components/ai';

function AIScanner() {
  return (
    <div className="p-4">
      {/* Header with AI Badge *\/}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">AI Document Scanner</h1>
        <AIBadge text="OCR + AI" size="md" />
      </div>

      {/* Processing State *\/}
      {isProcessing && (
        <AIGeneratingState 
          action="AI is scanning your document"
          className="my-8"
        />
      )}

      {/* Processing Results *\/}
      {processedDocument && (
        <AIResultCard
          title={`AI Detected: ${processedDocument.documentType}`}
          type="insight"
          confidence={processedDocument.classificationConfidence}
          className="mb-6"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Document Type:</span>
                <span className="ml-2 font-medium capitalize">
                  {processedDocument.documentType}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Confidence:</span>
                <span className="ml-2 font-medium">
                  {Math.round(processedDocument.classificationConfidence * 100)}%
                </span>
              </div>
            </div>
            
            {/* Listen to extracted text *\/}
            {processedDocument.extractedText && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Listen to extracted text:</span>
                <TTSButton 
                  text={processedDocument.extractedText}
                  size="sm"
                />
              </div>
            )}
          </div>
        </AIResultCard>
      )}
    </div>
  );
}
*/

// ============================================
// 4. ENHANCED INVOICE LIST WITH SMART SEARCH
// ============================================

// InvoiceList.tsx modifications
/*
import { AISmartSearch, AIBadge, AIResultCard } from '../components/ai';

function InvoiceList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [interpretedQuery, setInterpretedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  const handleSearch = async () => {
    setIsSearching(true);
    
    // AI interprets natural language query
    const interpreted = await aiService.interpretSearchQuery(searchQuery);
    setInterpretedQuery(interpreted);
    
    // Perform search
    await performSearch(interpreted);
    
    setIsSearching(false);
  };

  return (
    <div className="p-4">
      {/* Header *\/}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <AIBadge />
        </div>
      </div>

      {/* AI Smart Search *\/}
      <div className="mb-6">
        <AISmartSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSearch={handleSearch}
          interpretedQuery={interpretedQuery}
          isLoading={isSearching}
        />
      </div>

      {/* AI Insights Card *\/}
      {aiInsights && (
        <AIResultCard
          title="AI Insights"
          type="insight"
          className="mb-6"
          onDismiss={() => setAiInsights(null)}
        >
          <p>{aiInsights.summary}</p>
          <div className="mt-3 flex items-center gap-2">
            <TTSButton text={aiInsights.summary} size="sm" />
          </div>
        </AIResultCard>
      )}
    </div>
  );
}
*/

// ============================================
// 5. ENHANCED REPORTS PAGE
// ============================================

// Reports.tsx modifications
/*
import { 
  AIReportGenerator, 
  AIBadge, 
  AIGeneratingState,
  TTSButton 
} from '../components/ai';

function Reports() {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="p-4">
      {/* Header *\/}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Business Reports</h1>
        <AIBadge text="AI-Powered" />
      </div>

      {/* AI Report Generator *\/}
      {!report && !isGenerating && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                        rounded-xl p-8 text-center border-2 border-purple-200 dark:border-purple-800">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Generate AI Report
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Let AI analyze your business data and generate comprehensive insights, 
            recommendations, and trend analysis.
          </p>
          <button
            onClick={() => setIsGenerating(true)}
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-700 hover:to-blue-700
              text-white font-medium rounded-lg
              shadow-lg shadow-purple-500/30
              hover:shadow-xl hover:shadow-purple-500/40
              transition-all duration-200
              ai-button-glow
            "
          >
            <AIBadge size="sm" variant="glow" text="" showIcon />
            <span>Generate AI Report</span>
          </button>
        </div>
      )}

      {/* Generating State *\/}
      {isGenerating && !report && (
        <AIGeneratingState 
          action="AI is generating your business report"
          className="my-8"
        />
      )}

      {/* Report Results with TTS *\/}
      {report && (
        <div className="space-y-6">
          <AIResultCard
            title={report.title}
            type="analysis"
            className="mb-6"
          >
            <div className="space-y-4">
              <p className="text-lg">{report.summary}</p>
              
              {/* TTS Button *\/}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Listen to report:</span>
                <TTSButton text={`${report.title}. ${report.summary}`} />
              </div>
            </div>
          </AIResultCard>
        </div>
      )}
    </div>
  );
}
*/

// ============================================
// 6. SIDEBAR NAVIGATION - AI BADGE HIGHLIGHTS
// ============================================

// Sidebar.tsx modifications
/*
import { AIBadge } from '../components/ai';

const menuItems = [
  { label: 'Dashboard', path: '/', icon: '...' },
  { 
    label: 'AI Scanner', 
    path: '/ai-scanner', 
    icon: '...',
    aiFeature: true,
    aiLabel: 'OCR'
  },
  { label: 'Invoices', path: '/invoices', icon: '...' },
  { label: 'Quotes', path: '/quotes', icon: '...' },
  { 
    label: 'Reports', 
    path: '/reports', 
    icon: '...',
    aiFeature: true,
    aiLabel: 'AI'
  },
  { label: 'Settings', path: '/settings', icon: '...' },
];

function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="
              flex items-center justify-between px-4 py-3 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
            "
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <span className="text-gray-500">{item.icon}</span>
              {/* Label */}
              <span className="font-medium">{item.label}</span>
            </div>
            
            {/* AI Badge for AI features *\/}
            {item.aiFeature && (
              <AIBadge size="sm" text={item.aiLabel} />
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
}
*/

// ============================================
// 7. QUICK AI ACTIONS BAR (Global Component)
// ============================================

// QuickAIActions.tsx - Add to layout for quick access
/*
import { useState } from 'react';
import { AIBadge, AIChatbotButton } from './ai';

export function QuickAIActions() {
  const [expanded, setExpanded] = useState(false);

  const quickActions = [
    { 
      id: 'scan', 
      label: 'Scan Document', 
      icon: '📄',
      path: '/ai-scanner'
    },
    { 
      id: 'report', 
      label: 'Generate Report', 
      icon: '📊',
      path: '/reports'
    },
    { 
      id: 'search', 
      label: 'Smart Search', 
      icon: '🔍',
      path: '/search'
    },
    { 
      id: 'chat', 
      label: 'Ask AI', 
      icon: '✨',
      action: () => setChatbotOpen(true)
    },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      {/* Expandable Action Buttons *\/}
      {expanded && (
        <div className="flex flex-col gap-2 mb-2 animate-fade-in-up">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                if (action.action) action.action();
                else window.location.href = action.path;
                setExpanded(false);
              }}
              className="
                flex items-center gap-2 px-4 py-2
                bg-white dark:bg-gray-800 
                text-gray-700 dark:text-gray-300
                rounded-lg shadow-lg
                hover:bg-purple-50 dark:hover:bg-purple-900/20
                transition-all duration-200
                group
              "
            >
              <span>{action.icon}</span>
              <span className="font-medium">{action.label}</span>
              <AIBadge size="sm" showIcon={false} className="opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
      
      {/* Toggle Button *\/}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`
          w-12 h-12 rounded-full
          bg-white dark:bg-gray-800
          shadow-lg
          flex items-center justify-center
          transition-all duration-300
          ${expanded ? 'rotate-45' : ''}
        `}
      >
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
}
*/

// ============================================
// 8. AI FEATURE BADGE COMPONENT (Reusable)
// ============================================

// Use this to mark any feature as AI-powered
/*
import { AIBadge } from './ai';

// Example: AI Smart Search Badge
<div className="flex items-center gap-2">
  <h3>Smart Search</h3>
  <AIBadge 
    text="AI" 
    size="sm" 
    tooltip="Powered by natural language processing"
  />
</div>

// Example: AI Feature Card
<div className="ai-card hover-lift">
  <div className="flex items-center gap-3 mb-3">
    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
      <svg className="w-5 h-5 text-purple-600">...</svg>
    </div>
    <div>
      <h4 className="font-semibold">Auto-Fill</h4>
      <AIBadge size="sm" />
    </div>
  </div>
  <p className="text-sm text-gray-600">
    AI extracts client information and fills forms automatically.
  </p>
</div>
*/

export {}; // Make this a module
