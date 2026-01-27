import { readFileAsBase64 } from '../utils/fileUtils';
import { generateNotesPrompt } from '../ai/notesPrompt';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Summarizes a document using Google Gemini API
 * @param file Document file to summarize
 * @param prompt Prompt template to use for summarization
 * @returns Summary text
 */
export const summarizeDocument = async (file: File, prompt: string): Promise<string> => {
  try {
    // First convert the file to base64 for sending to Gemini API
    const base64Data = await readFileAsBase64(file);
    const mimeType = file.type || 'application/octet-stream';

    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please check your environment variables.");
    }

    // Use the correct model name
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Prepare the request body for Gemini API
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,       // Lower temperature for more precise, deterministic outputs
        topK: 32,               // Lower topK for more focused responses
        topP: 0.8,              // Lower topP for more predictable outputs
        maxOutputTokens: 8192,  // Keep high max tokens for comprehensive summaries
        stopSequences: [],      // No stop sequences needed
        responseMimeType: "text/plain", // Plain text response type for Markdown
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Make the API request
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as GeminiResponse;

    // Extract summary text from response
    const summaryText = data.candidates[0]?.content?.parts[0]?.text || '';
    return summaryText;

  } catch (error) {
    console.error('Error in Gemini summarization:', error);
    throw error;
  }
};

export const generateNotes = async (title: string, court: string): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please check your environment variables.");
    }

    // Use the correct model name
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = generateNotesPrompt(title, court);

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 100,
        responseMimeType: "text/plain",
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as GeminiResponse;
    const notes = data.candidates[0]?.content?.parts[0]?.text || '';

    if (notes.includes("Error: Insufficient or irrelevant information provided.")) {
      throw new Error("Insufficient or irrelevant information provided. Please provide a valid case title and court name.");
    }

    return notes.trim();
  } catch (error) {
    console.error('Error in Gemini note generation:', error);
    throw error;
  }
};

// Types for Gemini Chat
export interface GeminiMessage {
  role: 'user' | 'model' | 'system' | 'assistant'; // Included assistant for compatibility
  content: string;
}

export interface GeminiOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

/**
 * Generate a completion using Gemini API
 */
export const generateCompletion = async (messages: GeminiMessage[], options: GeminiOptions = {}): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is missing.");

    const modelName = options.model || "gemini-2.5-flash";
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let systemInstruction = "";
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + "\n\n";
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Prepend system instruction to the first user message
    if (systemInstruction && contents.length > 0) {
      contents[0].parts[0].text = systemInstruction + "USER REQUEST: " + contents[0].parts[0].text;
    } else if (systemInstruction && contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: systemInstruction }] });
    }

    const requestBody = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048,
        topP: options.topP || 0.8,
        topK: options.topK || 40,
      }
    };

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as GeminiResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  } catch (error) {
    console.error('Gemini generateCompletion error:', error);
    throw error;
  }
};

/**
 * Stream a completion using Gemini API
 */
export async function* streamCompletion(messages: GeminiMessage[], options: GeminiOptions = {}): AsyncGenerator<string, void, unknown> {
  try {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is missing.");

    const modelName = options.model || "gemini-2.5-flash";
    const requestUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}`;

    let systemInstruction = "";
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + "\n\n";
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    if (systemInstruction && contents.length > 0) {
      contents[0].parts[0].text = systemInstruction + "USER REQUEST: " + contents[0].parts[0].text;
    } else if (systemInstruction && contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: systemInstruction }] });
    }

    const requestBody = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048,
      }
    };

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.body) throw new Error("ReadableStream not supported.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      let braceOpen = buffer.indexOf('{');
      let braceClose = buffer.indexOf('}');

      while (braceOpen !== -1 && braceClose !== -1 && braceClose > braceOpen) {
        const potentialJson = buffer.substring(braceOpen, braceClose + 1);
        try {
          const parsed = JSON.parse(potentialJson);
          if (parsed.candidates && parsed.candidates[0].content && parsed.candidates[0].content.parts) {
            const text = parsed.candidates[0].content.parts[0].text;
            if (text) yield text;
          }
          buffer = buffer.substring(braceClose + 1);
          braceOpen = buffer.indexOf('{');
          braceClose = buffer.indexOf('}');
        } catch (e) {
          braceClose = buffer.indexOf('}', braceClose + 1);
        }
      }
    }
  } catch (error) {
    console.error('Gemini streamCompletion error:', error);
    throw error;
  }
}