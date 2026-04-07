import api from './api';
import { AxiosError } from 'axios';

export interface AnomalyResult {
  isAnomaly: boolean;
  confidence: number;
  reasons: string[];
}

// Abstract API for email validation
const ABSTRACT_API_KEY = import.meta.env.VITE_ABSTRACT_API_KEY || '';
const ABSTRACT_API_URL = 'https://emailvalidation.abstractapi.com/v1';

// Groq API for AI features
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1';

export const aiService = {
  // 1. Invoice Anomaly Detection
  async detectInvoiceAnomaly(invoiceData: {
    amount: number;
    clientName: string;
    items: { name: string; quantity: number; price: number }[];
    paymentTerms?: string;
  }): Promise<AnomalyResult> {
    try {
      const reasons: string[] = [];
      let anomalyScore = 0;

      // Rule 1: Unusually high amount (threshold: 5000 TND for testing)
      if (invoiceData.amount > 5000) {
        reasons.push('Amount unusually high (> 5,000 TND)');
        anomalyScore += 0.3;
      }

      // Rule 2: Very low amount (threshold: 1 TND)
      if (invoiceData.amount > 0 && invoiceData.amount < 1) {
        reasons.push('Amount unusually low (< 1 TND)');
        anomalyScore += 0.2;
      }

      // Rule 3: Suspicious payment terms
      const suspiciousTerms = ['cash only', 'wire transfer only', 'urgent', 'immediate', 'asap', 'rush'];
      if (invoiceData.paymentTerms) {
        const lowerTerms = invoiceData.paymentTerms.toLowerCase();
        for (const term of suspiciousTerms) {
          if (lowerTerms.includes(term)) {
            reasons.push(`Suspicious payment term detected: "${term}"`);
            anomalyScore += 0.25;
          }
        }
      }

      // Rule 4: Price variance in items
      const prices = invoiceData.items.map(item => item.price);
      if (prices.length > 1) {
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const maxPrice = Math.max(...prices);
        if (maxPrice > avgPrice * 10) {
          reasons.push('Large price variance between items');
          anomalyScore += 0.25;
        }
      }

      // Rule 5: Empty or suspicious client name
      if (!invoiceData.clientName || invoiceData.clientName.length < 2) {
        reasons.push('Client name appears incomplete');
        anomalyScore += 0.2;
      }

      return {
        isAnomaly: anomalyScore >= 0.25,
        confidence: Math.min(anomalyScore, 1),
        reasons
      };
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return { isAnomaly: false, confidence: 0, reasons: [] };
    }
  },

  // 2. Email Validation using Abstract API
  async validateEmail(email: string): Promise<{
    isValid: boolean;
    isDeliverable: boolean;
    qualityScore: number;
    suggestions?: string[];
  }> {
    try {
      if (!ABSTRACT_API_KEY) {
        // Fallback to regex validation if no API key
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: emailRegex.test(email),
          isDeliverable: emailRegex.test(email),
          qualityScore: emailRegex.test(email) ? 0.7 : 0
        };
      }

      const response = await fetch(
        `${ABSTRACT_API_URL}/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      return {
        isValid: data.is_valid_format?.value || false,
        isDeliverable: data.deliverability === 'DELIVERABLE',
        qualityScore: data.quality_score || 0,
        suggestions: data.did_you_mean ? [data.did_you_mean] : undefined
      };
    } catch (error) {
      console.error('Email validation error:', error);
      // Fallback
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(email),
        isDeliverable: false,
        qualityScore: emailRegex.test(email) ? 0.5 : 0
      };
    }
  },

  // 3. Smart Form Auto-Fill using Groq
  async extractClientInfo(text: string): Promise<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
  }> {
    try {
      if (!GROQ_API_KEY) {
        // Fallback to regex extraction
        return this.extractClientInfoRegex(text);
      }

      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Extract client information from the provided text. Return ONLY a JSON object with keys: name, email, phone, address, company. Use empty string if not found.'
            },
            {
              role: 'user',
              content: `Extract client info from: ${text}`
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.extractClientInfoRegex(text);
    } catch (error) {
      console.error('Auto-fill extraction error:', error);
      return this.extractClientInfoRegex(text);
    }
  },

  // Regex fallback for client info extraction
  extractClientInfoRegex(text: string): {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
  } {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/;
    const nameRegex = /(?:name|contact|from)[:\s]+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i;
    const companyRegex = /(?:company|business|organization)[:\s]+([A-Z][^\n,.]+)/i;

    return {
      name: text.match(nameRegex)?.[1],
      email: text.match(emailRegex)?.[0],
      phone: text.match(phoneRegex)?.[0],
      company: text.match(companyRegex)?.[1],
      address: undefined
    };
  },

  // 4. Document Translation using Groq API (more reliable than LibreTranslate)
  async translateDocument(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
    try {
      if (!GROQ_API_KEY) {
        console.warn('No GROQ_API_KEY found');
        return this.fallbackTranslation(text, targetLang);
      }

      const langNames: Record<string, string> = {
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German',
        'it': 'Italian',
        'ar': 'Arabic',
        'zh': 'Chinese',
        'en': 'English'
      };

      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following business document into ${langNames[targetLang] || targetLang}. Preserve the formatting and structure. Only return the translated text, nothing else.`
            },
            {
              role: 'user',
              content: text.substring(0, 2000)
            }
          ],
          temperature: 0.1,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Translation API error:', response.status, JSON.stringify(errorData, null, 2));
        
        // If rate limited or server error, use fallback
        if (response.status === 429 || response.status >= 500) {
          return this.fallbackTranslation(text, targetLang);
        }
        
        throw new Error(`Translation failed: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content?.trim();
      
      if (!translatedText) {
        throw new Error('Empty translation response');
      }
      
      return translatedText;
    } catch (error: any) {
      console.error('Translation error:', error);
      
      // Network errors or Groq downtime - use fallback
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('unreachable') || error.message?.includes('forcibly closed')) {
        return this.fallbackTranslation(text, targetLang);
      }
      
      throw new Error('Failed to translate document. Translation service temporarily unavailable.');
    }
  },

  // Fallback: Show original with message when AI translation is unavailable
  fallbackTranslation(text: string, targetLang: string): string {
    const langNames: Record<string, string> = {
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German',
      'it': 'Italian',
      'ar': 'Arabic',
      'zh': 'Chinese',
      'en': 'English'
    };
    
    return `[AI Translation to ${langNames[targetLang] || targetLang} temporarily unavailable - Groq API is unreachable]\n\nOriginal Document:\n${text}`;
  },

  // 5. Document Summarization using Hugging Face or Groq
  async summarizeDocument(text: string): Promise<string> {
    try {
      if (!GROQ_API_KEY) {
        // Simple extractive summarization fallback
        return this.simpleSummarize(text);
      }

      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Summarize the following document into 3-5 bullet points. Be concise and capture key information.'
            },
            {
              role: 'user',
              content: text.substring(0, 4000) // Limit input size
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || this.simpleSummarize(text);
    } catch (error) {
      console.error('Summarization error:', error);
      return this.simpleSummarize(text);
    }
  },

  // Simple extractive summarization fallback
  simpleSummarize(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const importantSentences = sentences
      .filter(s => 
        s.toLowerCase().includes('total') ||
        s.toLowerCase().includes('amount') ||
        s.toLowerCase().includes('payment') ||
        s.toLowerCase().includes('due') ||
        s.toLowerCase().includes('terms')
      )
      .slice(0, 3);
    
    if (importantSentences.length === 0) {
      return sentences.slice(0, 2).join('. ') + '.';
    }
    
    return importantSentences.join('. ') + '.';
  },

  // 6. AI Chatbot using Groq
  async chatWithAI(message: string, context?: string): Promise<string> {
    try {
      if (!GROQ_API_KEY) {
        return this.getFallbackResponse(message);
      }

      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are BizFlow AI, a helpful assistant for a business management system. You help users with invoices, quotes, sales orders, clients, and expenses. Be concise and professional. ${context || ''}`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || this.getFallbackResponse(message);
    } catch (error) {
      console.error('Chatbot error:', error);
      return this.getFallbackResponse(message);
    }
  },

  getFallbackResponse(message: string): string {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('invoice')) {
      return 'I can help you create and manage invoices. Navigate to the Invoices section to get started.';
    }
    if (lowerMsg.includes('quote') || lowerMsg.includes('estimation')) {
      return 'You can create quotes from the Quotes section. Would you like me to guide you there?';
    }
    if (lowerMsg.includes('client') || lowerMsg.includes('customer')) {
      return 'Manage your clients in the Clients section. You can add new clients or view existing ones.';
    }
    if (lowerMsg.includes('expense')) {
      return 'Track your expenses in the Expenses section to keep your finances organized.';
    }
    return "I'm here to help! You can ask me about invoices, quotes, clients, or expenses. What would you like to know?";
  }
};
