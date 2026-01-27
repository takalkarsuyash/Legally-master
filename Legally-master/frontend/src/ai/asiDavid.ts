import { asiService, ASIModel, ASIMessage } from '../services/asiService';
import { allLawyers, Lawyer } from '../data/lawyerData';
import { LegalPatternMatcher } from './patternMatcher';

export interface ASIDavidResult {
  matchedLawyers: Lawyer[];
  queryContext: {
    originalQuery: string;
    detectedSpecializations: string[];
    confidence: number;
    reasoning: string;
  };
  recommendations: {
    primaryMatch: Lawyer | null;
    alternativeMatches: Lawyer[];
    whyThisMatch: string;
  };
  // ASI-specific context for Andrew
  asiContext: {
    analysis: string;
    legalAreas: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    urgency: 'low' | 'medium' | 'high';
  };
}

export interface ASIDavidProgress {
  stage: 'analyzing' | 'matching' | 'ranking' | 'complete';
  message: string;
  progress: number;
}

/**
 * ASI-based David Agent for legal analysis and lawyer matching
 * Implements A2A protocol with context passing to Andrew
 */
export class ASIDavidAgent {
  private onProgress?: (progress: ASIDavidProgress) => void;
  private patternMatcher: LegalPatternMatcher;
  private modelSpec = {
    name: "ASI David Legal Analysis Engine",
    version: "3.0.0",
    provider: "ASI:One",
    model: "asi1-mini", // Default model, can be overridden
    capabilities: ["legal-analysis", "lawyer-matching", "specialization-detection", "context-generation"],
    maxTokens: 128000, // asi1-mini supports 128K tokens
    temperature: 0.3
  };

  constructor(onProgress?: (progress: ASIDavidProgress) => void) {
    this.onProgress = onProgress;
    this.patternMatcher = new LegalPatternMatcher();
  }

  private updateProgress(stage: ASIDavidProgress['stage'], message: string, progress: number) {
    if (this.onProgress) {
      this.onProgress({ stage, message, progress });
    }
  }

  /**
   * Main method to process query using ASI models with intelligent model selection
   */
  async processQuery(query: string, model?: ASIModel): Promise<ASIDavidResult> {
    // Auto-select optimal model if not specified
    const selectedModel = model || this.selectOptimalModel(query);
    try {
      // Input validation
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        console.warn('ASI David Agent: Invalid query provided');
        this.updateProgress('complete', 'ASI David completed with fallback analysis', 100);
        return this.fallbackAnalysis('General legal consultation');
      }

      this.updateProgress('analyzing', 'ASI David is analyzing your legal needs using ASI models...', 20);

      // Get initial pattern insights for context
      const patternInsights = this.patternMatcher.getPatternInsights(query);

      // Create ASI prompt for legal analysis
      const asiPrompt = this.createASIPrompt(query, patternInsights);

      this.updateProgress('matching', 'ASI David is using ASI to analyze your legal query...', 40);

      // Use ASI service for analysis
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
        temperature: 0.3,
        max_tokens: this.getModelMaxTokens(selectedModel),
        top_p: 0.8
      });

      this.updateProgress('ranking', 'ASI David is ranking the best ASI matches...', 80);

      // Parse ASI response and create result
      const result = this.parseASIResponse(asiResponse, query);

      this.updateProgress('complete', 'ASI David has completed ASI-powered analysis!', 100);
      return result;

    } catch (error) {
      console.error('ASI David Agent Error:', error);
      this.updateProgress('complete', 'ASI David completed with fallback analysis', 100);
      return this.fallbackAnalysis(query);
    }
  }

  /**
   * Stream processing for real-time updates
   */
  async *streamProcessQuery(
    query: string,
    documentData: { content: string; type: 'text' | 'image' } | null = null,
    model: ASIModel = 'asi1-mini'
  ): AsyncGenerator<{
    content: string;
    progress: number;
    isComplete: boolean;
    davidResult?: ASIDavidResult;
  }, void, unknown> {
    try {
      this.updateProgress('analyzing', 'ASI David is analyzing your legal needs using ASI models...', 20);

      const patternInsights = this.patternMatcher.getPatternInsights(query);

      // Determine prompt based on document type
      const asiPrompt = this.createASIPrompt(query, patternInsights, documentData?.type === 'text' ? documentData.content : null);

      this.updateProgress('matching', 'ASI David is using ASI to analyze your legal query...', 40);

      let userMessageContent: any = asiPrompt;

      // Handle Image Document (Scanned Doc)
      if (documentData?.type === 'image') {
        userMessageContent = [
          { type: 'text', text: asiPrompt + '\n\n[Analyzing attached scanned document image...]' },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${documentData.content.includes(',') ? documentData.content.split(',')[1] : documentData.content}`
            }
          }
        ];
      }

      const asiMessages: ASIMessage[] = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: userMessageContent
        }
      ];

      let fullResponse = '';
      let progress = 40;

      for await (const chunk of asiService.streamCompletion(asiMessages, {
        model,
        temperature: 0.3,
        max_tokens: this.getModelMaxTokens(model),
        top_p: 0.8
      })) {
        fullResponse += chunk;
        progress = Math.min(40 + (fullResponse.length / 100), 80);

        yield {
          content: chunk,
          progress,
          isComplete: false
        };
      }

      this.updateProgress('ranking', 'ASI David is ranking the best ASI matches...', 80);

      // Parse final response
      const result = this.parseASIResponse(fullResponse, query);

      yield {
        content: '',
        progress: 100,
        isComplete: true,
        davidResult: result
      };

    } catch (error) {
      console.error('ASI David Agent Streaming Error:', error);
      const fallbackResult = this.fallbackAnalysis(query);
      yield {
        content: '',
        progress: 100,
        isComplete: true,
        davidResult: fallbackResult
      };
    }
  }

  /**
 * Get system prompt for ASI David
 */
  private getSystemPrompt(): string {
    return `You are David, an expert Legal AI specializing in Indian law. Your SOLE goal is to ANSWER legal queries, explain consequences, and suggest next steps.

CORE CAPABILITIES:
- Analyze provided legal documents and extracting key information
- Answer legal queries directly and comprehensively
- Explain potential legal consequences and risks
- Suggest concrete next steps for the user
- Assess legal complexity and urgency

RESPONSE FORMAT:
Provide your analysis in this exact JSON format:
{
  "analysis": "Comprehensive answer to the query, interpreting the document (if provided) and explaining consequences/next steps.",
  "legalAreas": ["Area1", "Area2"],
  "complexity": "simple|moderate|complex",
  "urgency": "low|medium|high",
  "confidence": 85,
  "reasoning": "Brief summary of the legal reasoning"
}

Focus ONLY on providing high-quality legal information and actionable advice. DO NOT recommend specific lawyers.`;
  }

  /**
   * Create ASI prompt for legal analysis
   */
  private createASIPrompt(query: string, patternInsights: any, documentContext: string | null = null): string {
    let prompt = `Analyze this legal query and provide a direct answer:\n\nUSER QUERY: "${query}"\n\n`;

    if (documentContext) {
      prompt += `DOCUMENT CONTEXT:\n${documentContext}\n\n`;
      prompt += `INSTRUCTION: Base your answer primarily on the DOCUMENT CONTEXT above. Cite specific clauses or sections if applicable.\n\n`;
    }

    prompt += `DETECTION: ${patternInsights?.detectedPatterns?.join(', ') || 'General Legal'}\n\n`;



    prompt += `TASK:
1. DIRECT ANSWER: Address the user's specific question or situation.
2. CONSEQUENCES: Explain potential legal outcomes or risks.
3. NEXT STEPS: What should the user do next?

Respond with the exact JSON format specified in the system prompt.`;

    return prompt;
  }



  /**
   * Parse ASI response and create David result
   */
  private parseASIResponse(asiResponse: string, query: string): ASIDavidResult {
    try {
      // Try to parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response if it's wrapped in text
        const jsonMatch = asiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch {
        console.warn('ASI David: Could not parse JSON response, using fallback');
        return this.fallbackAnalysis(query);
      }

      // Pure Chatbot Mode - No Lawyers
      const matchedLawyers: Lawyer[] = [];

      return {
        matchedLawyers,
        queryContext: {
          originalQuery: query,
          detectedSpecializations: parsedResponse.legalAreas || ['General Legal'],
          confidence: parsedResponse.confidence || 75,
          reasoning: parsedResponse.reasoning || parsedResponse.analysis || 'ASI-powered legal analysis'
        },
        recommendations: {
          primaryMatch: null,
          alternativeMatches: [],
          whyThisMatch: parsedResponse.recommendedLawyers?.[0]?.reasoning || 'ASI-powered recommendation'
        },
        asiContext: {
          analysis: parsedResponse.analysis || parsedResponse.reasoning || 'ASI legal analysis',
          legalAreas: parsedResponse.legalAreas || ['General Legal'],
          complexity: parsedResponse.complexity || 'moderate',
          urgency: parsedResponse.urgency || 'medium'
        }
      };

    } catch (error) {
      console.error('Error parsing ASI response:', error);
      return this.fallbackAnalysis(query);
    }
  }

  /**
   * Fallback analysis when ASI fails
   */
  private fallbackAnalysis(query: string): ASIDavidResult {
    try {
      const safeQuery = query || 'legal consultation';

      // Pure Chatbot Mode - No Lawyers
      const finalLawyers: Lawyer[] = [];

      return {
        matchedLawyers: finalLawyers,
        queryContext: {
          originalQuery: safeQuery,
          detectedSpecializations: ['General Legal'],
          confidence: 60,
          reasoning: 'Pattern matching analysis (ASI unavailable)'
        },
        recommendations: {
          primaryMatch: finalLawyers[0] || null,
          alternativeMatches: finalLawyers.slice(1, 3),
          whyThisMatch: 'Fallback recommendation'
        },
        asiContext: {
          analysis: `Legal consultation needed for: ${safeQuery}`,
          legalAreas: ['General Legal'],
          complexity: 'moderate',
          urgency: 'medium'
        }
      };
    } catch (error) {
      console.error('ASI David Agent: Critical error in fallback analysis:', error);
      return {
        matchedLawyers: [],
        queryContext: {
          originalQuery: query || 'legal consultation',
          detectedSpecializations: ['General Legal'],
          confidence: 20,
          reasoning: 'System temporarily unavailable'
        },
        recommendations: {
          primaryMatch: null,
          alternativeMatches: [],
          whyThisMatch: 'Please try again later'
        },
        asiContext: {
          analysis: 'System error - please try again',
          legalAreas: ['General Legal'],
          complexity: 'simple',
          urgency: 'low'
        }
      };
    }
  }

  /**
   * Assess urgency level of the query
   */
  private assessUrgency(query: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'emergency', 'immediately', 'asap', 'crisis', 'deadline', 'court date', 'hearing'];
    const normalizedQuery = query.toLowerCase();

    for (const keyword of urgentKeywords) {
      if (normalizedQuery.includes(keyword)) {
        return 'high';
      }
    }
    return 'medium';
  }

  /**
   * Assess complexity level of the query
   */
  private assessComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const complexKeywords = ['complex', 'multiple', 'several', 'various', 'complicated', 'intricate', 'detailed'];
    const normalizedQuery = query.toLowerCase();

    for (const keyword of complexKeywords) {
      if (normalizedQuery.includes(keyword)) {
        return 'complex';
      }
    }

    if (query.length > 200) {
      return 'complex';
    } else if (query.length > 100) {
      return 'moderate';
    }

    return 'simple';
  }

  /**
   * Select optimal ASI model based on query characteristics
   */
  private selectOptimalModel(query: string): ASIModel {
    const lowerQuery = query.toLowerCase();

    // Complex legal analysis - use asi1-extended (89% accuracy, deep reasoning)
    if (lowerQuery.includes('analyze') || lowerQuery.includes('legal implications') ||
      lowerQuery.includes('precedent') || lowerQuery.includes('jurisdiction') ||
      lowerQuery.includes('complex') || lowerQuery.includes('detailed')) {
      return 'asi1-extended';
    }

    // Quick factual questions - use asi1-fast (87% accuracy, ultra-low latency)
    if (lowerQuery.includes('what is') || lowerQuery.includes('when') ||
      lowerQuery.includes('where') || lowerQuery.includes('who') ||
      lowerQuery.includes('how much') || lowerQuery.includes('cost')) {
      return 'asi1-fast';
    }

    // Agent orchestration needed - use asi1-agentic (85% accuracy, built-in orchestration)
    if (lowerQuery.includes('help me') || lowerQuery.includes('guide me') ||
      lowerQuery.includes('what should i do') || lowerQuery.includes('next steps')) {
      return 'asi1-agentic';
    }

    // Default to asi1-mini (85% accuracy, 128K tokens, general purpose)
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
