import { asiService, ASIModel, ASIMessage } from './asiService';

/**
 * ASI Document Chat Service
 * Specialized service for professional legal document analysis and Q&A
 */
export class ASIDocumentChatService {
  private baseService: typeof asiService;

  constructor() {
    this.baseService = asiService;
  }

  /**
   * Generate a professional response for document Q&A
   */
  async generateDocumentResponse(
    message: string,
    chatHistory: Array<{ role: string; content: string }>,
    documentContext: string,
    model: ASIModel = 'asi1-mini'
  ): Promise<string> {
    try {
      // Create professional system prompt for legal document analysis
      const systemPrompt = `You are a professional legal document analysis AI. You provide concise, accurate, and direct responses about legal documents.

IMPORTANT INSTRUCTIONS:
- Be direct and professional in your responses
- Do not use emojis, greetings, or casual language
- Provide factual information based only on the document context
- If information is not available in the document, state "This information is not available in the document"
- Use clear, structured responses with bullet points when appropriate
- Focus on legal implications, key facts, dates, and important details
- Maintain a formal, analytical tone throughout
- Do not provide any information that is not in the document context
- Do not use any markdown syntaxing like highlight, bold, italic, etc.

Document Context:
${documentContext}`;

      const asiMessages: ASIMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Add chat history
      chatHistory.forEach(msg => {
        asiMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current user message
      asiMessages.push({
        role: 'user',
        content: message
      });

      // Generate response with professional settings
      const response = await this.baseService.generateCompletion(asiMessages, {
        model,
        temperature: 0.2, // Lower temperature for more focused responses
        max_tokens: 1024, // Reasonable limit for concise responses
        top_p: 0.8
      });

      return this.sanitizeResponse(response);

    } catch (error) {
      console.error('Error in ASI document chat:', error);
      throw error;
    }
  }

  /**
   * Stream a professional response for document Q&A
   */
  async *streamDocumentResponse(
    message: string,
    chatHistory: Array<{ role: string; content: string }>,
    documentContext: string,
    model: ASIModel = 'asi1-mini'
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Create professional system prompt for legal document analysis
      const systemPrompt = `You are a professional legal document analysis AI. You provide concise, accurate, and direct responses about legal documents.

IMPORTANT INSTRUCTIONS:
- Be direct and professional in your responses
- Do not use emojis, greetings, or casual language
- Provide factual information based only on the document context
- If information is not available in the document, state "This information is not available in the document"
- Use clear, structured responses with bullet points when appropriate
- Focus on legal implications, key facts, dates, and important details
- Maintain a formal, analytical tone throughout

Document Context:
${documentContext}`;

      const asiMessages: ASIMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Add chat history
      chatHistory.forEach(msg => {
        asiMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current user message
      asiMessages.push({
        role: 'user',
        content: message
      });

      // Stream response
      let fullResponse = '';
      for await (const chunk of this.baseService.streamCompletion(asiMessages, {
        model,
        temperature: 0.2,
        max_tokens: 1024,
        top_p: 0.8
      })) {
        fullResponse += chunk;
        yield chunk;
      }

    } catch (error) {
      console.error('Error in ASI document chat streaming:', error);
      throw error;
    }
  }

  /**
   * Sanitize response to ensure professional tone
   */
  private sanitizeResponse(response: string): string {
    // Remove common casual phrases and emojis
    let sanitized = response
      .replace(/hey there!?/gi, '')
      .replace(/hi!?/gi, '')
      .replace(/hello!?/gi, '')
      .replace(/thanks!?/gi, '')
      .replace(/thank you!?/gi, '')
      .replace(/you're welcome!?/gi, '')
      .replace(/no problem!?/gi, '')
      .replace(/awesome!?/gi, '')
      .replace(/great!?/gi, '')
      .replace(/cool!?/gi, '')
      .replace(/sure!?/gi, '')
      .replace(/absolutely!?/gi, '')
      .replace(/definitely!?/gi, '')
      .replace(/of course!?/gi, '')
      .replace(/let me know if/gi, 'If you need')
      .replace(/feel free to/gi, 'You can')
      .replace(/don't hesitate to/gi, 'Please')
      .replace(/😊|😀|😃|😄|😁|😆|😅|😂|🤣|😊|😇|🙂|🙃|😉|😌|😍|🥰|😘|😗|😙|😚|😋|😛|😝|😜|🤪|🤨|🧐|🤓|😎|🤩|🥳|😏|😒|😞|😔|😟|😕|🙁|☹️|😣|😖|😫|😩|🥺|😢|😭|😤|😠|😡|🤬|🤯|😳|🥵|🥶|😱|😨|😰|😥|😓|🤗|🤔|🤭|🤫|🤥|😶|😐|😑|😬|🙄|😯|😦|😧|😮|😲|🥱|😴|🤤|😪|😵|🤐|🥴|🤢|🤮|🤧|😷|🤒|🤕|🤑|🤠|😈|👿|👹|👺|🤡|💩|👻|💀|☠️|👽|👾|🤖|🎃|😺|😸|😹|😻|😼|😽|🙀|😿|😾/g, '')
      .replace(/[!]{2,}/g, '') // Remove multiple exclamation marks
      .replace(/[?]{2,}/g, '?') // Replace multiple question marks with single
      .trim();

    // Ensure the response starts professionally
    if (sanitized.toLowerCase().startsWith('based on') || 
        sanitized.toLowerCase().startsWith('according to') ||
        sanitized.toLowerCase().startsWith('the document') ||
        sanitized.toLowerCase().startsWith('this document') ||
        sanitized.toLowerCase().startsWith('in this document')) {
      return sanitized;
    }

    // If response doesn't start professionally, add a professional prefix
    if (sanitized.length > 0 && !sanitized.toLowerCase().startsWith('the document')) {
      return `Based on the document analysis: ${sanitized}`;
    }

    return sanitized;
  }

  /**
   * Get model recommendations for different types of queries
   */
  getRecommendedModel(query: string): ASIModel {
    const lowerQuery = query.toLowerCase();
    
    // Complex legal analysis
    if (lowerQuery.includes('analyze') || lowerQuery.includes('legal implications') || 
        lowerQuery.includes('precedent') || lowerQuery.includes('jurisdiction')) {
      return 'asi1-extended';
    }
    
    // Quick factual questions
    if (lowerQuery.includes('what is') || lowerQuery.includes('when') || 
        lowerQuery.includes('where') || lowerQuery.includes('who')) {
      return 'asi1-fast';
    }
    
    // General questions
    return 'asi1-mini';
  }
}

// Export singleton instance
export const asiDocumentChatService = new ASIDocumentChatService();

// Export convenience function
export const generateDocumentResponse = (
  message: string,
  chatHistory: Array<{ role: string; content: string }>,
  documentContext: string,
  model: ASIModel = 'asi1-mini'
) => asiDocumentChatService.generateDocumentResponse(message, chatHistory, documentContext, model);
