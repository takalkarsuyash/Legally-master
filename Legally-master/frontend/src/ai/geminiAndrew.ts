import { generateCompletion, streamCompletion, GeminiMessage } from './geminiService';
import { GeminiDavidResult } from './geminiDavid';
import { Lawyer } from '../data/lawyerData';

export interface GeminiAndrewMessage {
    id: string;
    type: 'bot';
    content: string;
    timestamp: number;
    lawyerCards?: any[]; // Keep consistent structure
    queryContext?: any;
}

export interface GeminiAndrewProgress {
    stage: 'processing' | 'formatting' | 'presenting' | 'complete';
    message: string;
    progress: number;
}

/**
 * Gemini-based Andrew Agent for presentation
 */
export class GeminiAndrewAgent {
    private onProgress?: (progress: GeminiAndrewProgress) => void;

    constructor(onProgress?: (progress: GeminiAndrewProgress) => void) {
        this.onProgress = onProgress;
    }

    private updateProgress(stage: GeminiAndrewProgress['stage'], message: string, progress: number) {
        if (this.onProgress) {
            this.onProgress({ stage, message, progress });
        }
    }

    async processDavidResult(davidResult: GeminiDavidResult, userQuery: string): Promise<GeminiAndrewMessage> {
        try {
            this.updateProgress('processing', 'Andrew is reviewing Gemini analysis...', 20);

            const prompt = this.createPrompt(davidResult, userQuery);

            this.updateProgress('formatting', 'Andrew is formatting response...', 50);

            const messages: GeminiMessage[] = [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: prompt }
            ];

            const response = await generateCompletion(messages, {
                model: 'gemini-2.5-flash',
                temperature: 0.7
            });

            this.updateProgress('presenting', 'Andrew is ready.', 90);

            return {
                id: Math.random().toString(36).substr(2, 9),
                type: 'bot',
                content: response,
                timestamp: Date.now(),
                lawyerCards: [],
                queryContext: davidResult.queryContext
            };
        } catch (error) {
            console.error('Gemini Andrew Error:', error);
            return this.fallbackResponse(userQuery);
        }
    }

    async *streamProcessDavidResult(davidResult: GeminiDavidResult, userQuery: string): AsyncGenerator<{
        content: string;
        progress: number;
        isComplete: boolean;
        andrewMessage?: GeminiAndrewMessage;
    }, void, unknown> {
        try {
            this.updateProgress('processing', 'Andrew is starting...', 20);

            const prompt = this.createPrompt(davidResult, userQuery);
            const messages: GeminiMessage[] = [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: prompt }
            ];

            let fullResponse = '';
            let progress = 50;

            for await (const chunk of streamCompletion(messages, {
                model: 'gemini-2.5-flash',
                temperature: 0.7
            })) {
                fullResponse += chunk;
                progress = Math.min(50 + (fullResponse.length / 50), 90);
                yield {
                    content: chunk,
                    progress,
                    isComplete: false
                };
            }

            const message: GeminiAndrewMessage = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'bot',
                content: fullResponse,
                timestamp: Date.now(),
                lawyerCards: [],
                queryContext: davidResult.queryContext
            };

            yield {
                content: '',
                progress: 100,
                isComplete: true,
                andrewMessage: message
            };

        } catch (error) {
            console.error('Gemini Andrew Streaming Error:', error);
            yield {
                content: '',
                progress: 100,
                isComplete: true,
                andrewMessage: this.fallbackResponse(userQuery)
            };
        }
    }

    private getSystemPrompt(): string {
        return `You are Andrew, a helpful Legal Communication AI.
Take the analysis provided by David and present it to the user in a clear, friendly, and professional markdown format.
Structure:
1. Direct Answer
2. Explanation/Analysis
3. Actionable Next Steps`;
    }

    private createPrompt(davidResult: GeminiDavidResult, userQuery: string): string {
        return `User Query: "${userQuery}"

David's Analysis:
${davidResult.geminiContext.analysis}

Metadata:
Complexity: ${davidResult.geminiContext.complexity}
Urgency: ${davidResult.geminiContext.urgency}

Please present this to the user.`;
    }

    private fallbackResponse(query: string): GeminiAndrewMessage {
        return {
            id: Math.random().toString(36).substr(2, 9),
            type: 'bot',
            content: `I analyzed your query regarding "${query}" but encountered an error generating the full response. Please try again.`,
            timestamp: Date.now(),
            lawyerCards: []
        };
    }
}
