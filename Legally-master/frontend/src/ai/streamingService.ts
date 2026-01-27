import { GeminiDavidResult, GeminiDavidAgent, GeminiDavidProgress } from './geminiDavid';
import { GeminiAndrewMessage, GeminiAndrewAgent } from './geminiAndrew';

export interface StreamingChunk {
    content: string;
    stage: 'david' | 'andrew' | 'complete';
    progress: number;
    isComplete: boolean;
    davidResult?: GeminiDavidResult;
    andrewMessage?: GeminiAndrewMessage;
}

export class StreamingService {
    private davidAgent: GeminiDavidAgent;
    private andrewAgent: GeminiAndrewAgent;

    constructor() {
        this.davidAgent = new GeminiDavidAgent();
        this.andrewAgent = new GeminiAndrewAgent();
    }

    /**
     * Stream David's analysis with real-time updates using Gemini
     */
    async *streamDavidAnalysis(query: string): AsyncGenerator<StreamingChunk> {
        try {
            // Input validation
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                yield {
                    content: 'I need a valid legal question to analyze.',
                    stage: 'david',
                    progress: 100,
                    isComplete: true
                };
                return;
            }

            // Stream from GeminiDavidAgent
            for await (const chunk of this.davidAgent.streamProcessQuery(query)) {
                yield {
                    content: chunk.content,
                    stage: 'david',
                    progress: chunk.progress,
                    isComplete: chunk.isComplete && !!chunk.davidResult,
                    davidResult: chunk.davidResult
                };
            }

        } catch (error) {
            console.error('Streaming David analysis error:', error);
            yield {
                content: 'I apologize, but I encountered an error while analyzing your query.',
                stage: 'david',
                progress: 100,
                isComplete: true
            };
        }
    }

    /**
     * Stream Andrew's presentation with real-time updates using Gemini
     */
    async *streamAndrewPresentation(davidResult: GeminiDavidResult, userQuery: string): AsyncGenerator<StreamingChunk> {
        try {
            // Stream from GeminiAndrewAgent
            for await (const chunk of this.andrewAgent.streamProcessDavidResult(davidResult, userQuery)) {
                yield {
                    content: chunk.content,
                    stage: 'andrew',
                    progress: chunk.progress,
                    isComplete: chunk.isComplete,
                    andrewMessage: chunk.andrewMessage
                };
            }

        } catch (error) {
            console.error('Streaming Andrew presentation error:', error);
            yield {
                content: 'I apologize, but I encountered an error while formatting the response.',
                stage: 'andrew',
                progress: 100,
                isComplete: true
            };
        }
    }

}