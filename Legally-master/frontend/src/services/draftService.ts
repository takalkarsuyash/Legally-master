import { ASIService, ASIModel } from './asiService';
import { FormInputs } from '../types/draft';
import { SYSTEM_PROMPT, getContextualPrompt, GENERATION_CONFIG } from '../ai/draftPrompt';

// Initialize ASI service
const asiService = new ASIService();

// Message type for ASI API
interface ASIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Clean ASI response by removing unwanted footer/disclaimer text
 */
function cleanASIResponse(content: string): string {
  // Remove common ASI footer patterns
  const footerPatterns = [
    /ASI:One is not a law firm[\s\S]*?do not assume liability for implementation\./i,
    /Prepared in compliance with[\s\S]*?Document ID: [^\n]*/i,
    /Verified by ASI:One[\s\S]*?Agentverse\.ai Agentic Workflow[^\n]*/i,
    /Fetch\.ai Inc\. and ASI:One[\s\S]*?do not assume liability[^\n]*/i
  ];

  let cleanedContent = content;

  for (const pattern of footerPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '').trim();
  }

  // Remove any trailing newlines or spaces
  return cleanedContent.replace(/\s+$/, '');
}

/**
 * Simple service class for legal document generation using GROQ API
 */
export class DraftService {
  /**
   * Prepare messages for ASI API
   */
  private static prepareMessages(params: FormInputs): ASIMessage[] {
    return [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: getContextualPrompt(
          params.documentType,
          params.partyA,
          params.partyB,
          `${params.additionalDetails}${params.state ? `\nState: ${params.state}` : ''}`,
          params.specificDetails
        )
      }
    ];
  }

  /**
   * Generate a legal document using ASI API
   */
  static async generateDocument(params: FormInputs): Promise<string> {
    if (!import.meta.env.VITE_ASI_KEY) {
      throw new Error("Missing ASI API key");
    }

    const messages = this.prepareMessages(params);

    const result = await asiService.generateCompletion(messages, {
      model: 'asi1-extended',
      temperature: GENERATION_CONFIG.temperature,
      max_tokens: 32768, // Increased for extended model with 64K context
      top_p: GENERATION_CONFIG.top_p,
      stream: false
    });

    if (!result) {
      throw new Error('No content received from API');
    }

    // Clean the response to remove ASI footers/disclaimers
    return cleanASIResponse(result);
  }

  /**
   * Stream document generation with realtime updates
   */
  static async streamDocument(
    params: FormInputs,
    onChunk: (chunk: string, done: boolean) => void
  ): Promise<string> {
    if (!import.meta.env.VITE_ASI_KEY) {
      throw new Error("Missing ASI API key");
    }

    const messages = this.prepareMessages(params);
    let accumulatedResponse = "";

    const stream = asiService.streamCompletion(messages, {
      model: 'asi1-extended',
      temperature: GENERATION_CONFIG.temperature,
      max_tokens: 32768, // Increased for extended model with 64K context
      top_p: GENERATION_CONFIG.top_p
    });

    try {
      for await (const chunk of stream) {
        accumulatedResponse += chunk;
        onChunk(chunk, false);
      }

      onChunk("", true);
    } catch (error) {
      console.error('Streaming error:', error);
      onChunk("", true); // Signal completion even on error
      throw error;
    }

    return accumulatedResponse;
  }
}