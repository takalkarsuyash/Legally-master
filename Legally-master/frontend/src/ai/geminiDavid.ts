import { generateCompletion, streamCompletion, GeminiMessage } from './geminiService';
import { Lawyer, allLawyers } from '../data/lawyerData'; // Assuming same data source
import { LegalPatternMatcher } from './patternMatcher';

export interface GeminiDavidResult {
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
    // Context for Andrew
    geminiContext: {
        analysis: string;
        legalAreas: string[];
        complexity: 'simple' | 'moderate' | 'complex';
        urgency: 'low' | 'medium' | 'high';
    };
}

export interface GeminiDavidProgress {
    stage: 'analyzing' | 'matching' | 'ranking' | 'complete';
    message: string;
    progress: number;
}

/**
 * Gemini-based David Agent for legal analysis
 */
export class GeminiDavidAgent {
    private onProgress?: (progress: GeminiDavidProgress) => void;
    private patternMatcher: LegalPatternMatcher;

    constructor(onProgress?: (progress: GeminiDavidProgress) => void) {
        this.onProgress = onProgress;
        this.patternMatcher = new LegalPatternMatcher();
    }

    private updateProgress(stage: GeminiDavidProgress['stage'], message: string, progress: number) {
        if (this.onProgress) {
            this.onProgress({ stage, message, progress });
        }
    }

    async processQuery(query: string): Promise<GeminiDavidResult> {
        try {
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                return this.fallbackAnalysis('General legal consultation');
            }

            this.updateProgress('analyzing', 'David is analyzing your legal needs using Gemini...', 20);

            const patternInsights = this.patternMatcher.getPatternInsights(query);
            const prompt = this.createPrompt(query, patternInsights);

            this.updateProgress('matching', 'David is processing with Gemini...', 40);

            const messages: GeminiMessage[] = [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: prompt }
            ];

            const response = await generateCompletion(messages, {
                model: 'gemini-2.5-flash',
                temperature: 0.3
            });

            this.updateProgress('ranking', 'David is ranking matches...', 80);

            const result = this.parseResponse(response, query);

            this.updateProgress('complete', 'David has completed analysis!', 100);
            return result;

        } catch (error) {
            console.error('Gemini David Agent Error:', error);
            return this.fallbackAnalysis(query);
        }
    }

    async *streamProcessQuery(query: string): AsyncGenerator<{
        content: string;
        progress: number;
        isComplete: boolean;
        davidResult?: GeminiDavidResult;
    }, void, unknown> {
        try {
            this.updateProgress('analyzing', 'David is analyzing using Gemini...', 20);

            const patternInsights = this.patternMatcher.getPatternInsights(query);
            const prompt = this.createPrompt(query, patternInsights);

            const messages: GeminiMessage[] = [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: prompt }
            ];

            let fullResponse = '';
            let progress = 40;

            for await (const chunk of streamCompletion(messages, {
                model: 'gemini-2.5-flash',
                temperature: 0.3
            })) {
                fullResponse += chunk;
                progress = Math.min(40 + (fullResponse.length / 100), 80);
                yield {
                    content: chunk,
                    progress,
                    isComplete: false
                };
            }

            const result = this.parseResponse(fullResponse, query);

            yield {
                content: '',
                progress: 100,
                isComplete: true,
                davidResult: result
            };

        } catch (error) {
            console.error('David Streaming Error:', error);
            yield {
                content: '',
                progress: 100,
                isComplete: true,
                davidResult: this.fallbackAnalysis(query)
            };
        }
    }

    private getSystemPrompt(): string {
        return `You are David, an expert Legal AI for Indian law powered by Google Gemini.
Your GOAL: Answer legal queries and provide structural analysis.

RESPONSE FORMAT (Strict JSON):
{
  "analysis": "Comprehensive answer explaining the legal situation, laws involved, and advice.",
  "legalAreas": ["Area1", "Area2"],
  "complexity": "simple|moderate|complex",
  "urgency": "low|medium|high",
  "confidence": 85,
  "reasoning": "Brief summary of reasoning"
}

Do NOT output markdown code blocks. Output RAW JSON.`;
    }

    private createPrompt(query: string, patternInsights: any): string {
        return `Analyze this legal query: "${query}"
    
Examples of detected patterns: ${patternInsights?.detectedPatterns?.join(', ') || 'None'}

Provide a direct legal answer, consequences, and next steps in the specified JSON format.`;
    }

    private parseResponse(response: string, query: string): GeminiDavidResult {
        try {
            // Clean markdown code blocks if present
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            return {
                matchedLawyers: [], // Pure chatbot for now
                queryContext: {
                    originalQuery: query,
                    detectedSpecializations: parsed.legalAreas || ['General Legal'],
                    confidence: parsed.confidence || 70,
                    reasoning: parsed.reasoning || 'Gemini analysis'
                },
                recommendations: {
                    primaryMatch: null,
                    alternativeMatches: [],
                    whyThisMatch: 'AI recommendation'
                },
                geminiContext: {
                    analysis: parsed.analysis || response,
                    legalAreas: parsed.legalAreas || ['General Legal'],
                    complexity: parsed.complexity || 'moderate',
                    urgency: parsed.urgency || 'medium'
                }
            };
        } catch (e) {
            console.warn('David failed to parse JSON, using raw text');
            return this.fallbackAnalysis(query, response);
        }
    }

    private fallbackAnalysis(query: string, rawResponse?: string): GeminiDavidResult {
        return {
            matchedLawyers: [],
            queryContext: {
                originalQuery: query,
                detectedSpecializations: ['General Legal'],
                confidence: 50,
                reasoning: 'Fallback'
            },
            recommendations: {
                primaryMatch: null,
                alternativeMatches: [],
                whyThisMatch: 'Fallback'
            },
            geminiContext: {
                analysis: rawResponse || 'Could not process detailed analysis.',
                legalAreas: ['General Legal'],
                complexity: 'moderate',
                urgency: 'medium'
            }
        };
    }
}
