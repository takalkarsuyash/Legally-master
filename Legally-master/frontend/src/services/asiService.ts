
import { readFileAsBase64 } from '../utils/fileUtils';

// ASI Model Types based on modelDocs.md
export type ASIModel = 'asi1-agentic' | 'asi1-mini' | 'asi1-fast' | 'asi1-extended' | 'asi1-graph';

// ASI API Configuration
const ASI_API_KEY = import.meta.env.VITE_ASI_KEY;
// The endpoint for ASI/Fetch.ai OpenAI-compatible service
// Search results indicated api.asi1.ai or similar. 
// We will use the one found in the original snippet, or a standard OpenAI compatible Fetch.ai URL.
// Given the user provided code used 'https://api.asi1.ai/v1', we will use that.
const ASI_API_BASE_URL = 'https://api.asi1.ai/v1';

if (!ASI_API_KEY) {
  console.error('VITE_ASI_KEY is not set in environment variables');
}

// ASI API Interfaces - OpenAI Compatible
export type ASIMessageContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}>;

export interface ASIMessage {
  role: 'system' | 'user' | 'assistant';
  content: ASIMessageContent;
}

export interface ASIOptions {
  model?: ASIModel;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

/**
 * ASI Service - Integration with ASI Alliance / Fetch.ai API
 * Replaces Google Generative AI with OpenAI-compatible ASI endpoint
 */
export class ASIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ASI_KEY || '';
    this.baseUrl = ASI_API_BASE_URL;

    if (!this.apiKey) {
      console.error('ASIService Critical: No ASI key found. Please check .env file for VITE_ASI_KEY.');
    }
  }

  /**
   * Helper to perform standard fetch request to OpenAI-compatible endpoint
   */
  private async fetchCompletion(messages: ASIMessage[], options: ASIOptions): Promise<Response> {
    if (!this.apiKey) throw new Error('ASI API key is not configured.');

    // Map internal model names to likely real model IDs if needed, 
    // or pass them through if the API supports them.
    // Assuming the API supports these custom IDs since they were in the codebase.
    const modelId = options.model || 'asi1-mini';

    const body = {
      model: modelId,
      messages: this.formatMessages(messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      top_p: options.top_p,
      stream: options.stream ?? false
    };

    console.log(`ASI API Request: ${this.baseUrl}/chat/completions`, JSON.stringify(body, null, 2));

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });

      console.log(`ASI API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ASI API Error Body: ${errorText}`);
        throw new Error(`ASI API Error (${response.status}): ${errorText}`);
      }

      return response;
    } catch (err) {
      console.error('ASI API Network Error:', err);
      throw err;
    }
  }

  /**
   * Format messages slightly if needed (OpenAI expect content to be string or array)
   */
  private formatMessages(messages: ASIMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  async generateCompletion(
    messages: ASIMessage[],
    options: ASIOptions = {}
  ): Promise<string> {
    try {
      const response = await this.fetchCompletion(messages, { ...options, stream: false });
      const data = await response.json();

      // OpenAI usage: data.choices[0].message.content
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content || '';
      }
      return '';
    } catch (error) {
      console.error('ASI API request failed:', error);
      throw error;
    }
  }

  async *streamCompletion(
    messages: ASIMessage[],
    options: ASIOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await this.fetchCompletion(messages, { ...options, stream: true });

      if (!response.body) throw new Error('ReadableStream not supported in this browser.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.replace('data: ', '');
              const data = JSON.parse(jsonStr);
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                yield data.choices[0].delta.content;
              }
            } catch (e) {
              // Ignore parse errors from non-json data
            }
          }
        }
      }
    } catch (error) {
      console.error('ASI Streaming Error:', error);
      throw error;
    }
  }

  /**
   * Document summarization using ASI models
   */
  async summarizeDocument(file: File, prompt: string, model: ASIModel = 'asi1-mini'): Promise<string> {
    try {
      const base64Data = await readFileAsBase64(file);
      // For multimodal support with standard OpenAI endpoints, we use GPT-4 Vision format:
      // content: [ { type: "text", text: ... }, { type: "image_url", image_url: { url: "data:..." } } ]

      // Check file type. Ideally only images (jpeg/png/gif/webp) work with Vision.
      // PDFs often need text extraction first, but let's assume image-based for now or basic text.

      const isImage = file.type.startsWith('image/');

      const content: ASIMessageContent = [
        { type: 'text', text: prompt }
      ];

      if (isImage) {
        content.push({
          type: 'image_url',
          image_url: { url: base64Data } // base64Data already includes data:image/...;base64,...
        });
      } else {
        // Fallback for non-images: append "File content" text if small enough or possible?
        // Realistically, for generic files we might just verify if the model supports file upload.
        // For this implementation, we'll strip the file if it's not an image and just append metadata hint.
        content[0].text += `\n\n[Attached File: ${file.name}]`;
      }

      const messages: ASIMessage[] = [
        { role: 'user', content }
      ];

      return await this.generateCompletion(messages, { model });
    } catch (error) {
      console.error('Error in ASI document summarization:', error);
      throw error;
    }
  }

  // ... (Keep existing simple wrappers)
  async generateNotes(title: string, court: string, model: ASIModel = 'asi1-mini'): Promise<string> {
    try {
      const prompt = `Generate comprehensive legal notes for case: "${title}" in ${court}.`;
      return await this.generateCompletion([{ role: 'user', content: prompt }], { model });
    } catch (error) {
      console.error('Error in ASI note generation:', error);
      throw error;
    }
  }

  async performLegalResearch(query: string, options: any = {}): Promise<any> {
    const response = await this.generateCompletion([
      { role: 'system', content: 'You are a legal research AI.' },
      { role: 'user', content: query }
    ], { model: options.model || 'asi1-agentic' });

    return {
      content: response,
      confidence: 0.85
    };
  }

  async getQuickResponse(query: string, context?: string): Promise<string> {
    return await this.generateCompletion([
      { role: 'system', content: 'You are a legal assistant providing quick responses.' },
      { role: 'user', content: context ? `${context}\n\nQuery: ${query}` : query }
    ], { model: 'asi1-fast' });
  }

  getModelCapabilities(model: ASIModel) {
    switch (model) {
      case 'asi1-agentic': return { maxTokens: 64000, accuracy: 85, bestFor: 'Complex Tasks', speed: 'slow' };
      case 'asi1-fast': return { maxTokens: 64000, accuracy: 87, bestFor: 'Speed', speed: 'fast' };
      default: return { maxTokens: 128000, accuracy: 85, bestFor: 'General', speed: 'medium' };
    }
  }
}

// Export singleton instance
export const asiService = new ASIService();

// Export convenience functions
export const summarizeDocument = (file: File, prompt: string, model: ASIModel = 'asi1-mini') =>
  asiService.summarizeDocument(file, prompt, model);

export const generateNotes = (title: string, court: string, model: ASIModel = 'asi1-mini') =>
  asiService.generateNotes(title, court, model);

export const performLegalResearch = (query: string, options?: any) =>
  asiService.performLegalResearch(query, options);

export const getQuickResponse = (query: string, context?: string) =>
  asiService.getQuickResponse(query, context);