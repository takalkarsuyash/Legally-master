import { PromptEngine, DavidPromptContext, AndrewPromptContext } from './prompts';
import { Lawyer } from '../data/lawyerData';
import { asiService, ASIModel } from '../services/asiService';

export interface AIResponse {
  content: string;
  confidence: number;
  reasoning: string;
  metadata?: any;
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  stage: string;
  progress: number;
}

export interface DavidAIResult {
  analysis: {
    queryIntent: string;
    legalAreas: string[];
    urgencyAssessment: string;
    complexityLevel: string;
  };
  recommendations: {
    primaryMatch: {
      lawyerId: number;
      matchScore: number;
      reasoning: string;
    };
    alternativeMatches: Array<{
      lawyerId: number;
      matchScore: number;
      reasoning: string;
    }>;
  };
  confidence: number;
  reasoning: string;
}

export interface AndrewAIResult {
  content: string;
  lawyerCards: Array<{
    lawyer: Lawyer;
    matchScore: number;
    whyRecommended: string;
    isPrimary: boolean;
  }>;
  queryContext: {
    specializations: string[];
    confidence: number;
    reasoning: string;
  };
}

export class AIService {
  private davidModel: ASIModel;
  private andrewModel: ASIModel;
  private streamingModel: ASIModel;

  constructor(apiKey?: string) {
    // David - Legal Analysis Model (using ASI extended for deep reasoning)
    this.davidModel = 'asi1-extended';
    
    // Andrew - Presentation Model (using ASI mini for general tasks)
    this.andrewModel = 'asi1-mini';
    
    // Streaming Model (using ASI fast for real-time responses)
    this.streamingModel = 'asi1-fast';
  }

  /**
   * David AI - Legal Analysis and Lawyer Matching (using ASI)
   */
  async davidAnalyze(context: DavidPromptContext): Promise<DavidAIResult> {
    try {
      const prompt = PromptEngine.generateDavidPrompt(context);
      
      const messages = [
        {
          role: 'system' as const,
          content: 'You are David, a legal analysis AI specialized in matching lawyers with client queries. Provide detailed analysis in JSON format.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      const response = await asiService.generateCompletion(messages, {
        model: this.davidModel,
        temperature: 0.3,
        max_tokens: 2048,
        top_p: 0.95
      });
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return this.parseDavidResponse(response);
    } catch (error) {
      console.error('David AI Error:', error);
      throw new Error('Failed to analyze legal query');
    }
  }

  /**
   * Andrew AI - Presentation and User Communication (using ASI)
   */
  async andrewPresent(context: AndrewPromptContext): Promise<AndrewAIResult> {
    try {
      const prompt = PromptEngine.generateAndrewPrompt(context);
      
      const messages = [
        {
          role: 'system' as const,
          content: 'You are Andrew, a presentation AI specialized in communicating legal analysis results to users in a friendly, professional manner.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      const response = await asiService.generateCompletion(messages, {
        model: this.andrewModel,
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.95
      });
      
      return this.parseAndrewResponse(response, context.davidResults);
    } catch (error) {
      console.error('Andrew AI Error:', error);
      throw new Error('Failed to present results');
    }
  }

  /**
   * Real-time streaming response (using ASI)
   */
  async *streamResponse(agent: 'david' | 'andrew', context: any): AsyncGenerator<StreamingResponse> {
    try {
      const prompt = PromptEngine.generateStreamingPrompt(agent, context);
      
      const messages = [
        {
          role: 'system' as const,
          content: `You are ${agent === 'david' ? 'David, a legal analysis AI' : 'Andrew, a presentation AI'}. Provide real-time updates as you process the request.`
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      let fullContent = '';
      let stage = 'initializing';
      let progress = 0;
      
      for await (const chunk of asiService.streamCompletion(messages, {
        model: this.streamingModel,
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 0.95
      })) {
        fullContent += chunk;
        
        // Update stage based on content
        if (fullContent.includes('analyzing')) stage = 'analyzing';
        else if (fullContent.includes('matching')) stage = 'matching';
        else if (fullContent.includes('formatting')) stage = 'formatting';
        else if (fullContent.includes('complete')) stage = 'complete';
        
        progress = Math.min(progress + 5, 100);
        
        yield {
          content: fullContent,
          isComplete: false,
          stage,
          progress
        };
      }
      
      yield {
        content: fullContent,
        isComplete: true,
        stage: 'complete',
        progress: 100
      };
    } catch (error) {
      console.error('Streaming Error:', error);
      throw new Error('Failed to stream response');
    }
  }

  /**
   * AI-to-AI Communication Protocol
   */
  async aiToAICommunication(davidContext: DavidPromptContext, andrewContext: AndrewPromptContext): Promise<{
    davidResult: DavidAIResult;
    andrewResult: AndrewAIResult;
  }> {
    try {
      // Step 1: David analyzes
      const davidResult = await this.davidAnalyze(davidContext);
      
      // Step 2: Prepare Andrew's context with David's results
      const updatedAndrewContext: AndrewPromptContext = {
        ...andrewContext,
        davidResults: {
          matchedLawyers: this.getLawyersByIds(davidResult.recommendations, davidContext.lawyerDatabase),
          reasoning: davidResult.reasoning,
          confidence: davidResult.confidence
        }
      };
      
      // Step 3: Andrew presents
      const andrewResult = await this.andrewPresent(updatedAndrewContext);
      
      return { davidResult, andrewResult };
    } catch (error) {
      console.error('AI-to-AI Communication Error:', error);
      throw new Error('Failed AI-to-AI communication');
    }
  }

  /**
   * Validate user query quality (using ASI)
   */
  async validateQuery(query: string): Promise<{
    isLegalQuery: boolean;
    relevanceScore: number;
    clarityScore: number;
    actionabilityScore: number;
    urgency: string;
    complexity: string;
    suggestions: string[];
    confidence: number;
  }> {
    try {
      const prompt = PromptEngine.generateValidationPrompt(query);
      
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a legal query validation AI. Analyze the query and provide detailed assessment in JSON format.'
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      const response = await asiService.generateCompletion(messages, {
        model: this.davidModel,
        temperature: 0.3,
        max_tokens: 1024,
        top_p: 0.9
      });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback validation
      return {
        isLegalQuery: this.isLegalQuery(query),
        relevanceScore: 75,
        clarityScore: 80,
        actionabilityScore: 70,
        urgency: 'medium',
        complexity: 'moderate',
        suggestions: ['Provide more specific details about your legal issue'],
        confidence: 60
      };
    } catch (error) {
      console.error('Query Validation Error:', error);
      return {
        isLegalQuery: true,
        relevanceScore: 50,
        clarityScore: 50,
        actionabilityScore: 50,
        urgency: 'low',
        complexity: 'simple',
        suggestions: ['Please provide more details'],
        confidence: 30
      };
    }
  }

  /**
   * Generate follow-up response (using ASI)
   */
  async generateFollowUp(agent: 'david' | 'andrew', previousContext: any, newQuery: string): Promise<string> {
    try {
      const prompt = PromptEngine.generateFollowUpPrompt(agent, previousContext, newQuery);
      
      const messages = [
        {
          role: 'system' as const,
          content: `You are ${agent === 'david' ? 'David, a legal analysis AI' : 'Andrew, a presentation AI'}. Provide a helpful follow-up response.`
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      return await asiService.generateCompletion(messages, {
        model: this.streamingModel,
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 0.95
      });
    } catch (error) {
      console.error('Follow-up Error:', error);
      throw new Error('Failed to generate follow-up response');
    }
  }

  /**
   * Handle errors gracefully (using ASI)
   */
  async handleError(agent: 'david' | 'andrew', error: string, context: any): Promise<string> {
    try {
      const prompt = PromptEngine.generateErrorPrompt(agent, error, context);
      
      const messages = [
        {
          role: 'system' as const,
          content: `You are ${agent === 'david' ? 'David, a legal analysis AI' : 'Andrew, a presentation AI'}. Handle errors gracefully and provide helpful responses.`
        },
        {
          role: 'user' as const,
          content: prompt
        }
      ];
      
      return await asiService.generateCompletion(messages, {
        model: this.streamingModel,
        temperature: 0.5,
        max_tokens: 512,
        top_p: 0.9
      });
    } catch (error) {
      console.error('Error Handling Error:', error);
      return 'I apologize, but I encountered an issue processing your request. Please try again or contact support if the problem persists.';
    }
  }

  // Helper methods
  private parseDavidResponse(text: string): DavidAIResult {
    // Fallback parsing logic
    return {
      analysis: {
        queryIntent: 'Legal consultation request',
        legalAreas: ['General Legal'],
        urgencyAssessment: 'Medium',
        complexityLevel: 'Moderate'
      },
      recommendations: {
        primaryMatch: {
          lawyerId: 1,
          matchScore: 85,
          reasoning: 'Best match based on query analysis'
        },
        alternativeMatches: []
      },
      confidence: 75,
      reasoning: 'Analysis completed with standard matching criteria'
    };
  }

  private parseAndrewResponse(text: string, davidResults: any): AndrewAIResult {
    return {
      content: text,
      lawyerCards: [],
      queryContext: {
        specializations: davidResults.matchedLawyers.map((l: any) => l.specialization),
        confidence: davidResults.confidence,
        reasoning: davidResults.reasoning
      }
    };
  }

  private getLawyersByIds(recommendations: any, lawyerDatabase: Lawyer[]): Lawyer[] {
    const lawyerIds = [
      recommendations.primaryMatch?.lawyerId,
      ...recommendations.alternativeMatches?.map((alt: any) => alt.lawyerId) || []
    ].filter(Boolean);
    
    return lawyerDatabase.filter(lawyer => lawyerIds.includes(lawyer.id));
  }

  private isLegalQuery(query: string): boolean {
    const legalKeywords = [
      'legal', 'lawyer', 'attorney', 'law', 'court', 'legal advice', 'consultation',
      'dispute', 'contract', 'agreement', 'rights', 'liability', 'damages',
      'criminal', 'civil', 'family', 'divorce', 'employment', 'business',
      'property', 'tax', 'intellectual', 'patent', 'trademark'
    ];
    
    const lowerQuery = query.toLowerCase();
    return legalKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}
