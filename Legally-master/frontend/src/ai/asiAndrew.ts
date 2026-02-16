import { asiService, ASIModel, ASIMessage } from '../services/asiService';
import { Lawyer } from '../data/lawyerData';
import { ASIDavidResult } from './asiDavid';

export interface ASIAndrewMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: number;
  lawyerCards?: LawyerCard[];
  queryContext?: {
    specializations: string[];
    confidence: number;
    reasoning: string;
  };
}

export interface LawyerCard {
  lawyer: Lawyer;
  matchScore: number;
  whyRecommended: string;
  isPrimary: boolean;
}

export interface ASIAndrewProgress {
  stage: 'processing' | 'formatting' | 'presenting' | 'complete';
  message: string;
  progress: number;
}

/**
 * ASI-based Andrew Agent for presentation and user interaction
 * Implements A2A protocol receiving context from David
 */
export class ASIAndrewAgent {
  private onProgress?: (progress: ASIAndrewProgress) => void;
  private modelSpec = {
    name: "ASI Andrew Presentation Engine",
    version: "3.0.0",
    provider: "ASI:One",
    model: "asi1-mini", // Default model, can be overridden
    capabilities: ["ui-formatting", "conversational-ai", "markdown-rendering", "context-processing"],
    maxTokens: 128000, // asi1-mini supports 128K tokens
    temperature: 0.7
  };

  constructor(onProgress?: (progress: ASIAndrewProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(stage: ASIAndrewProgress['stage'], message: string, progress: number) {
    if (this.onProgress) {
      this.onProgress({ stage, message, progress });
    }
  }

  /**
   * Process David's result and format it for user presentation using ASI with intelligent model selection
   */
  async processDavidResult(davidResult: ASIDavidResult, userQuery: string, model?: ASIModel): Promise<ASIAndrewMessage> {
    // Auto-select optimal model if not specified
    const selectedModel = model || this.selectOptimalModel(davidResult, userQuery);
    try {
      this.updateProgress('processing', 'ASI Andrew is receiving David\'s ASI analysis...', 20);

      // Create ASI prompt for presentation
      const asiPrompt = this.createASIPrompt(davidResult, userQuery);

      this.updateProgress('formatting', 'ASI Andrew is crafting your personalized response using ASI...', 60);

      const asiMessages: ASIMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: asiPrompt
        }
      ];

      const asiResponse = await asiService.generateCompletion(asiMessages, {
        model: selectedModel,
        temperature: 0.7,
        max_tokens: this.getModelMaxTokens(selectedModel),
        top_p: 0.8
      });

      this.updateProgress('presenting', 'ASI Andrew is finalizing your response...', 90);

      // Create lawyer cards
      const lawyerCards = this.createLawyerCards(davidResult);

      const message: ASIAndrewMessage = {
        id: this.generateId(),
        type: 'bot',
        content: asiResponse,
        timestamp: Date.now(),
        lawyerCards,
        queryContext: {
          specializations: davidResult.queryContext.detectedSpecializations,
          confidence: davidResult.queryContext.confidence,
          reasoning: davidResult.queryContext.reasoning
        }
      };

      this.updateProgress('complete', 'ASI Andrew has completed your response!', 100);

      return message;

    } catch (error) {
      console.error('ASI Andrew Agent Error:', error);
      return this.fallbackPresentation(davidResult, userQuery);
    }
  }

  /**
   * Stream processing for real-time presentation updates
   */
  async *streamProcessDavidResult(davidResult: ASIDavidResult, userQuery: string, model: ASIModel = 'asi1-mini'): AsyncGenerator<{
    content: string;
    progress: number;
    isComplete: boolean;
    andrewMessage?: ASIAndrewMessage;
  }, void, unknown> {
    try {
      this.updateProgress('processing', 'ASI Andrew is receiving David\'s ASI analysis...', 20);

      const asiPrompt = this.createASIPrompt(davidResult, userQuery);

      this.updateProgress('formatting', 'ASI Andrew is crafting your personalized response using ASI...', 60);

      const asiMessages: ASIMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: asiPrompt
        }
      ];

      let fullResponse = '';
      let progress = 60;

      for await (const chunk of asiService.streamCompletion(asiMessages, {
        model,
        temperature: 0.7,
        max_tokens: this.getModelMaxTokens(model),
        top_p: 0.8
      })) {
        fullResponse += chunk;
        progress = Math.min(60 + (fullResponse.length / 50), 90);

        yield {
          content: chunk,
          progress,
          isComplete: false
        };
      }

      this.updateProgress('presenting', 'ASI Andrew is finalizing your response...', 90);

      // Create final message with lawyer cards
      const lawyerCards = this.createLawyerCards(davidResult);
      const message: ASIAndrewMessage = {
        id: this.generateId(),
        type: 'bot',
        content: fullResponse,
        timestamp: Date.now(),
        lawyerCards,
        queryContext: {
          specializations: davidResult.queryContext.detectedSpecializations,
          confidence: davidResult.queryContext.confidence,
          reasoning: davidResult.queryContext.reasoning
        }
      };

      yield {
        content: '',
        progress: 100,
        isComplete: true,
        andrewMessage: message
      };

    } catch (error) {
      console.error('ASI Andrew Agent Streaming Error:', error);
      const fallbackMessage = this.fallbackPresentation(davidResult, userQuery);
      yield {
        content: '',
        progress: 100,
        isComplete: true,
        andrewMessage: fallbackMessage
      };
    }
  }

  /**
  * Get system prompt for ASI Andrew
  */
  private getSystemPrompt(): string {
    return `You are Andrew, a Legal Communication AI. Your goal is to explain legal answers to users clearly, concisely, and empathetically.
    
CORE RESPONSIBILITY:
- Take the raw legal analysis from David and explain it conversationally.
- **Strictly Based on David's Analysis**: Do not invent new facts.
- **Documents**: If David analyzed a document, refer to it explicitly.
- **No Lawyer Cards**: You do not recommend lawyers.

PRESENTATION STRUCTURE:
1.  **Direct Answer**: Start with a clear, direct, and empathetic answer to the user's question.
2.  **Next Steps**: Provide a bulleted list of actionable advice or immediate steps the user can take.

**IMPORTANT**: Do NOT include a separate "Analysis" or "Reasoning" section. Integrate necessary context into the Direct Answer naturally but keep it focused on the "What" and "How", not the "Why" (unless essential).

Use markdown. Be helpful and professional.`;
  }

  /**
   * Create ASI prompt for presentation
   */
  private createASIPrompt(davidResult: ASIDavidResult, userQuery: string): string {
    return `Present this legal answer to the user:

DAVID'S ANALYSIS (Contains Answer, Consequences, Next Steps):
${davidResult.asiContext.analysis}

QUERY CONTEXT:
Legal Areas: ${davidResult.asiContext.legalAreas.join(', ')}
Complexity: ${davidResult.asiContext.complexity}
Urgency: ${davidResult.asiContext.urgency}
Reasoning: ${davidResult.queryContext.reasoning}

Original User Query: "${userQuery}"

Your response must be a helpful legal consultation answer.`;
  }

  /**
   * Create lawyer cards with match scores and recommendations
   */
  private createLawyerCards(davidResult: ASIDavidResult): LawyerCard[] {
    // Pure Chatbot Mode: Never return lawyer cards
    return [];
  }

  /**
   * Calculate match score for a lawyer
   */
  private calculateMatchScore(lawyer: Lawyer, queryContext: { detectedSpecializations: string[] }): number {
    let score = 0;

    // Specialization match
    if (queryContext.detectedSpecializations.includes(lawyer.specialization)) {
      score += 40;
    }

    // Experience bonus
    const experienceYears = parseInt(lawyer.experience.replace(/\D/g, ''));
    score += Math.min(experienceYears * 2, 30);

    // Rating bonus
    score += lawyer.rating * 5;

    // Cases won bonus
    if (lawyer.casesWon) {
      score += Math.min(lawyer.casesWon / 20, 20);
    }

    return Math.min(score, 100);
  }

  /**
   * Generate why this lawyer is recommended
   */
  private generateWhyRecommended(lawyer: Lawyer, queryContext: { detectedSpecializations: string[] }): string {
    const reasons = [];

    if (queryContext.detectedSpecializations.includes(lawyer.specialization)) {
      reasons.push(`Expert in ${lawyer.specialization}`);
    }

    if (lawyer.rating >= 4.7) {
      reasons.push(`Highly rated (${lawyer.rating}/5)`);
    }

    if (lawyer.experience.includes('15+')) {
      reasons.push(`Extensive experience (${lawyer.experience})`);
    }

    if (lawyer.casesWon && lawyer.casesWon > 150) {
      reasons.push(`Strong track record (${lawyer.casesWon} cases won)`);
    }

    if (lawyer.achievements && lawyer.achievements.length > 0) {
      reasons.push(`Recognized expert (${lawyer.achievements[0]})`);
    }

    return reasons.join(' • ');
  }

  /**
   * Fallback presentation when ASI fails
   */
  private fallbackPresentation(davidResult: ASIDavidResult, userQuery: string): ASIAndrewMessage {
    try {
      const lawyerCards = this.createLawyerCards(davidResult);
      const response = this.generateFallbackResponse(davidResult, userQuery, lawyerCards);

      return {
        id: this.generateId(),
        type: 'bot',
        content: response,
        timestamp: Date.now(),
        lawyerCards: lawyerCards || [],
        queryContext: {
          specializations: davidResult?.queryContext?.detectedSpecializations || ['General Legal'],
          confidence: davidResult?.queryContext?.confidence || 50,
          reasoning: davidResult?.queryContext?.reasoning || 'ASI-powered analysis'
        }
      };
    } catch (error) {
      console.error('ASI Andrew Agent: Error in fallback presentation:', error);
      return {
        id: this.generateId(),
        type: 'bot',
        content: `I understand you're looking for legal assistance regarding "${userQuery}". I recommend consulting with a qualified lawyer who can provide personalized guidance for your specific situation.`,
        timestamp: Date.now(),
        lawyerCards: [],
        queryContext: {
          specializations: ['General Legal'],
          confidence: 30,
          reasoning: 'Fallback response due to system limitations'
        }
      };
    }
  }


  /**
   * Generate fallback response when ASI fails
   */
  private generateFallbackResponse(davidResult: ASIDavidResult, userQuery: string, lawyerCards: LawyerCard[]): string {
    const { queryContext, recommendations } = davidResult;

    let response = `## Hello! I've analyzed your legal query\n\n`;

    // Add context about what was detected
    if (queryContext.detectedSpecializations && queryContext.detectedSpecializations.length > 0) {
      response += `**Legal Areas Identified:** ${queryContext.detectedSpecializations.join(', ')}\n\n`;
    }

    // Add confidence level
    if (queryContext.confidence >= 80) {
      response += `I'm highly confident these recommendations match your needs.\n\n`;
    } else if (queryContext.confidence >= 60) {
      response += `These recommendations should be a good fit for your situation.\n\n`;
    } else {
      response += `I've found some general legal experts who may be able to help.\n\n`;
    }

    // Add next steps
    response += `## Next Steps\n\n`;
    response += `• Review your legal documents carefully\n`;
    response += `• Gather all relevant evidence\n`;
    response += `• Consider consulting a legal professional for specific advice\n\n`;

    response += `*I am an AI assistant and this is for informational purposes only.*`;

    return response;
  }

  /**
   * Create system message for processing status
   */
  createSystemMessage(message: string): ASIAndrewMessage {
    return {
      id: this.generateId(),
      type: 'system',
      content: message,
      timestamp: Date.now()
    };
  }

  /**
   * Create error message
   */
  createErrorMessage(error: string): ASIAndrewMessage {
    return {
      id: this.generateId(),
      type: 'bot',
      content: `I apologize, but I encountered an issue: ${error}\n\nPlease try rephrasing your legal question or contact support if the problem persists.`,
      timestamp: Date.now()
    };
  }

  /**
   * Create off-topic message
   */
  createOffTopicMessage(): ASIAndrewMessage {
    return {
      id: this.generateId(),
      type: 'bot',
      content: `I'm a legal assistant focused on helping you find the right lawyer for your legal needs. I can help you with questions about:\n\n• Legal consultations\n• Finding specialized lawyers\n• Understanding legal processes\n• Legal document analysis\n\nPlease ask me about your legal situation, and I'll connect you with the right legal expert.`,
      timestamp: Date.now()
    };
  }

  /**
   * Validate if query is legal-focused
   */
  validateQuery(query: string): { isValid: boolean; reason?: string } {
    const lowerQuery = query.toLowerCase();

    // Check for legal keywords
    const legalKeywords = [
      'legal', 'lawyer', 'attorney', 'law', 'court', 'legal advice', 'consultation',
      'dispute', 'contract', 'agreement', 'rights', 'liability', 'damages',
      'criminal', 'civil', 'family', 'divorce', 'employment', 'business',
      'property', 'tax', 'intellectual', 'patent', 'trademark'
    ];

    const hasLegalKeywords = legalKeywords.some(keyword => lowerQuery.includes(keyword));

    // Check for off-topic content
    const offTopicKeywords = [
      'weather', 'cooking', 'sports', 'entertainment', 'gaming', 'shopping',
      'travel', 'food', 'music', 'movie', 'book', 'fashion', 'beauty'
    ];

    const hasOffTopicKeywords = offTopicKeywords.some(keyword => lowerQuery.includes(keyword));

    if (hasOffTopicKeywords && !hasLegalKeywords) {
      return { isValid: false, reason: 'off-topic' };
    }

    if (!hasLegalKeywords && query.length < 10) {
      return { isValid: false, reason: 'too-short' };
    }

    return { isValid: true };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Select optimal ASI model for presentation based on David's analysis
   */
  private selectOptimalModel(davidResult: ASIDavidResult, userQuery: string): ASIModel {
    const { asiContext } = davidResult;
    const lowerQuery = userQuery.toLowerCase();

    // Complex analysis results - use asi1-extended for detailed presentation
    if (asiContext.complexity === 'complex' ||
      lowerQuery.includes('detailed') || lowerQuery.includes('comprehensive')) {
      return 'asi1-extended';
    }

    // Quick responses needed - use asi1-fast for rapid presentation
    if (asiContext.urgency === 'high' ||
      lowerQuery.includes('quick') || lowerQuery.includes('fast')) {
      return 'asi1-fast';
    }

    // Agent orchestration needed - use asi1-agentic for guided presentation
    if (lowerQuery.includes('help me') || lowerQuery.includes('guide me') ||
      lowerQuery.includes('what should i do') || lowerQuery.includes('next steps')) {
      return 'asi1-agentic';
    }

    // Default to asi1-mini for general presentation
    return 'asi1-mini';
  }

  /**
   * Get model-specific max tokens based on ASI documentation
   */
  private getModelMaxTokens(model: ASIModel): number {
    switch (model) {
      case 'asi1-mini':
        return 128000; // 128K tokens
      case 'asi1-fast':
        return 64000;  // 64K tokens
      case 'asi1-extended':
        return 64000;  // 64K tokens
      case 'asi1-agentic':
        return 64000;  // 64K tokens
      case 'asi1-graph':
        return 64000;  // 64K tokens
      default:
        return 128000; // Default to mini's capacity
    }
  }

  /**
   * Get model capabilities for UI display
   */
  getModelCapabilities(model: ASIModel): {
    maxTokens: number;
    accuracy: number;
    bestFor: string;
    speed: 'fast' | 'medium' | 'slow';
  } {
    switch (model) {
      case 'asi1-mini':
        return {
          maxTokens: 128000,
          accuracy: 85,
          bestFor: 'Everyday agent workflows, chatbots, scheduling agents',
          speed: 'medium'
        };
      case 'asi1-fast':
        return {
          maxTokens: 64000,
          accuracy: 87,
          bestFor: 'Ultra-low latency, real-time applications, instant agent discovery',
          speed: 'fast'
        };
      case 'asi1-extended':
        return {
          maxTokens: 64000,
          accuracy: 89,
          bestFor: 'Deep reasoning, complex analysis, multi-hop retrieval',
          speed: 'slow'
        };
      case 'asi1-agentic':
        return {
          maxTokens: 64000,
          accuracy: 85,
          bestFor: 'Agent discovery & orchestration, delegation planning',
          speed: 'medium'
        };
      case 'asi1-graph':
        return {
          maxTokens: 64000,
          accuracy: 85,
          bestFor: 'Data visualization, chart generation, visual explanations',
          speed: 'medium'
        };
      default:
        return {
          maxTokens: 128000,
          accuracy: 85,
          bestFor: 'General purpose',
          speed: 'medium'
        };
    }
  }
}
