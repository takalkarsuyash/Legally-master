import { ASIDavidAgent, ASIDavidResult } from './asiDavid';
import { ASIAndrewAgent, ASIAndrewMessage } from './asiAndrew';
import { ASIModel } from '../services/asiService';

export interface ASIStreamingChunk {
  content: string;
  progress: number;
  isComplete: boolean;
  davidResult?: ASIDavidResult;
  andrewMessage?: ASIAndrewMessage;
}

export interface ASIAgentProgress {
  stage: 'david' | 'andrew';
  message: string;
  progress: number;
  toolCalls: unknown[];
}

/**
 * ASI Streaming Service implementing A2A protocol
 * Handles context passing between David and Andrew ASI agents
 */
export class ASIStreamingService {
  private davidAgent: ASIDavidAgent;
  private andrewAgent: ASIAndrewAgent;

  constructor() {
    this.davidAgent = new ASIDavidAgent();
    this.andrewAgent = new ASIAndrewAgent();
  }

  /**
   * Stream David's analysis using ASI models
   */
  async *streamDavidAnalysis(
    userQuery: string,
    documentData: { content: string; type: 'text' | 'image' } | null = null,
    model: ASIModel = 'asi1-mini'
  ): AsyncGenerator<ASIStreamingChunk, void, unknown> {
    try {
      for await (const chunk of this.davidAgent.streamProcessQuery(userQuery, documentData, model)) {
        yield {
          content: chunk.content || '',
          progress: chunk.progress,
          isComplete: chunk.isComplete && !!chunk.davidResult,
          davidResult: chunk.davidResult
        };
      }
    } catch (error) {
      console.error('ASI Streaming Service: David analysis error:', error);
      // Return fallback result
      const fallbackResult = this.davidAgent['fallbackAnalysis'](userQuery);
      yield {
        content: 'I have analyzed your legal question and found relevant information.',
        progress: 100,
        isComplete: true,
        davidResult: fallbackResult
      };
    }
  }

  /**
   * Stream Andrew's presentation using ASI models
   */
  async *streamAndrewPresentation(
    davidResult: ASIDavidResult,
    userQuery: string,
    model: ASIModel = 'asi1-mini'
  ): AsyncGenerator<ASIStreamingChunk, void, unknown> {
    try {
      for await (const chunk of this.andrewAgent.streamProcessDavidResult(davidResult, userQuery, model)) {
        yield {
          content: chunk.content || '',
          progress: chunk.progress,
          isComplete: chunk.isComplete,
          andrewMessage: chunk.andrewMessage
        };
      }
    } catch (error) {
      console.error('ASI Streaming Service: Andrew presentation error:', error);
      // Return fallback result
      const fallbackMessage = this.andrewAgent['fallbackPresentation'](davidResult, userQuery);
      yield {
        content: fallbackMessage.content,
        progress: 100,
        isComplete: true,
        andrewMessage: fallbackMessage
      };
    }
  }

  /**
   * Complete A2A flow: David analysis + Andrew presentation
   */
  async *streamA2AFlow(
    userQuery: string,
    documentData: { content: string; type: 'text' | 'image' } | null = null,
    davidModel: ASIModel = 'asi1-mini',
    andrewModel: ASIModel = 'asi1-mini'
  ): AsyncGenerator<ASIStreamingChunk, void, unknown> {
    let davidResult: ASIDavidResult | null = null;
    let andrewMessage: ASIAndrewMessage | null = null;

    try {
      // Step 1: David's analysis
      for await (const davidChunk of this.streamDavidAnalysis(userQuery, documentData, davidModel)) {
        if (davidChunk.davidResult) {
          davidResult = davidChunk.davidResult;
        }
        yield davidChunk;
      }

      // Step 2: Andrew's presentation (only if David succeeded)
      if (davidResult) {
        for await (const andrewChunk of this.streamAndrewPresentation(davidResult, userQuery, andrewModel)) {
          if (andrewChunk.andrewMessage) {
            andrewMessage = andrewChunk.andrewMessage;
          }
          yield andrewChunk;
        }
      }

      // Final result
      // REMOVED: Redundant yield. Andrew agent already yields the final completion chunk.
      // if (andrewMessage) {
      //   yield {
      //     content: '',
      //     progress: 100,
      //     isComplete: true,
      //     andrewMessage
      //   };
      // }

    } catch (error) {
      console.error('ASI Streaming Service: A2A flow error:', error);
      // Return error result
      yield {
        content: 'I apologize, but I encountered technical difficulties processing your request. Please try again in a moment.',
        progress: 100,
        isComplete: true
      };
    }
  }

  /**
   * Get agent progress for UI updates
   */
  getAgentProgress(stage: 'david' | 'andrew', message: string, progress: number): ASIAgentProgress {
    return {
      stage,
      message,
      progress,
      toolCalls: []
    };
  }

  /**
   * Validate query before processing
   */
  validateQuery(query: string): { isValid: boolean; reason?: string } {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return { isValid: false, reason: 'empty-query' };
    }

    if (query.length < 3) {
      return { isValid: false, reason: 'too-short' };
    }

    // Check for legal keywords
    const legalKeywords = [
      'legal', 'lawyer', 'attorney', 'law', 'court', 'legal advice', 'consultation',
      'dispute', 'contract', 'agreement', 'rights', 'liability', 'damages',
      'criminal', 'civil', 'family', 'divorce', 'employment', 'business',
      'property', 'tax', 'intellectual', 'patent', 'trademark', 'help'
    ];

    const lowerQuery = query.toLowerCase();
    const hasLegalKeywords = legalKeywords.some(keyword => lowerQuery.includes(keyword));

    if (!hasLegalKeywords && query.length < 10) {
      return { isValid: false, reason: 'not-legal-related' };
    }

    return { isValid: true };
  }

  /**
   * Get recommended models for different query types based on ASI model capabilities
   */
  getRecommendedModels(query: string): { davidModel: ASIModel; andrewModel: ASIModel } {
    const lowerQuery = query.toLowerCase();

    // Complex legal analysis - use asi1-extended (89% accuracy, deep reasoning)
    if (lowerQuery.includes('analyze') || lowerQuery.includes('legal implications') ||
      lowerQuery.includes('precedent') || lowerQuery.includes('jurisdiction') ||
      lowerQuery.includes('complex') || lowerQuery.includes('detailed')) {
      return {
        davidModel: 'asi1-extended',
        andrewModel: 'asi1-extended' // Use extended for detailed presentation too
      };
    }

    // Quick factual questions - use asi1-fast (87% accuracy, ultra-low latency)
    if (lowerQuery.includes('what is') || lowerQuery.includes('when') ||
      lowerQuery.includes('where') || lowerQuery.includes('who') ||
      lowerQuery.includes('how much') || lowerQuery.includes('cost')) {
      return {
        davidModel: 'asi1-fast',
        andrewModel: 'asi1-fast'
      };
    }

    // Agent orchestration needed - use asi1-agentic (85% accuracy, built-in orchestration)
    if (lowerQuery.includes('help me') || lowerQuery.includes('guide me') ||
      lowerQuery.includes('what should i do') || lowerQuery.includes('next steps')) {
      return {
        davidModel: 'asi1-agentic',
        andrewModel: 'asi1-agentic'
      };
    }

    // General questions - use asi1-mini (85% accuracy, 128K tokens, general purpose)
    return {
      davidModel: 'asi1-mini',
      andrewModel: 'asi1-mini'
    };
  }

  /**
   * Process query with automatic model selection
   */
  async *streamAutoA2AFlow(
    userQuery: string,
    documentData: { content: string; type: 'text' | 'image' } | null = null
  ): AsyncGenerator<ASIStreamingChunk, void, unknown> {
    const { davidModel, andrewModel } = this.getRecommendedModels(userQuery);

    for await (const chunk of this.streamA2AFlow(userQuery, documentData, davidModel, andrewModel)) {
      yield chunk;
    }
  }
}
