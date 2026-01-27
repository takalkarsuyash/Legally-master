// ASI Web Search Service - Based on websearchDocs.txt
import OpenAI from 'openai';

// ASI Configuration
const ASI_API_KEY = import.meta.env.VITE_ASI_KEY;
const ASI_API_BASE_URL = 'https://api.asi1.ai/v1';

if (!ASI_API_KEY) {
  console.error('VITE_ASI_KEY is not set in environment variables');
}

// Initialize OpenAI client for ASI - exactly as in websearchDocs.txt
const client = new OpenAI({
  apiKey: ASI_API_KEY,
  baseURL: ASI_API_BASE_URL,
  dangerouslyAllowBrowser: true,
});

export type ResponseMode = 'research' | 'article' | 'hybrid';

export interface WebSearchResponse {
  content: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

/**
 * Simple ASI Web Search Service
 */
export class ASIWebSearchService {
  /**
   * Perform web search using ASI models - exactly as in websearchDocs.txt
   */
  async performWebSearch(
    query: string,
    responseMode: ResponseMode = 'hybrid'
  ): Promise<WebSearchResponse> {
    try {
      console.log('Starting ASI web search for:', query);
      console.log('Response mode:', responseMode);

      // Create system prompt based on response mode
      const systemPrompt = this.getSystemPrompt(responseMode);
      
      // Exactly as shown in websearchDocs.txt
      const response = await client.chat.completions.create({
        model: 'asi1-extended',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        web_search: true,
      } as any);

      console.log('ASI Response received:', response);
      
      let content = response.choices[0]?.message?.content || '';
      console.log('Raw ASI Response content:', content);
      console.log('Response mode for processing:', responseMode);

      // Handle empty or whitespace-only responses
      if (!content || content.trim() === '') {
        console.log('Empty response from ASI API, providing fallback');
        if (responseMode === 'article') {
          content = JSON.stringify([{
            title: 'No Results Found',
            link: '#',
            description: 'Your search query did not return any results. Please try different keywords or check your spelling.'
          }]);
        } else {
          content = 'I apologize, but I was unable to find relevant information for your query. Please try rephrasing your question or providing more specific details.';
        }
      } else {
        // If in article mode, try to extract or generate a valid JSON array from the response
        if (responseMode === 'article') {
          // Look for valid JSON array within the content
          const originalContent = content;
          
          // Find content between the outermost [ and ]
          const bracketsRegex = /\[([\s\S]*?)\]/;
          const matches = content.match(bracketsRegex);
          
          if (matches) {
            try {
              // Attempt to parse the matched content as JSON
              const parsed = JSON.parse(matches[0]);
              if (Array.isArray(parsed)) {
                content = matches[0]; // Use just the JSON array part
                console.log('Successfully extracted JSON array for article mode');
              } else {
                console.log('Found bracket content but it\'s not an array:', parsed);
                content = JSON.stringify([{
                  title: 'Search Results Unavailable',
                  link: '#',
                  description: 'Unable to retrieve specific articles at this time. Please try rephrasing your query or check back later.'
                }]);
              }
            } catch (e) {
              console.log('Could not parse bracketed content as JSON for article mode:', e);
              // If the bracket content isn\'t valid JSON, try to process as Markdown links
              content = originalContent; // Use original content for UI to handle as markdown
            }
          } else {
            // If no brackets found, the model might have returned Markdown links instead
            console.log('No bracketed JSON array found in response');
            
            // First, try to parse the original content as potential markdown links
            const markdownLinks = this.extractMarkdownLinks(originalContent);
            if (markdownLinks.length > 0) {
              // Convert markdown links to JSON array format
              const jsonArray = markdownLinks.map(link => ({
                title: link.title || 'Legal Resource',
                link: link.url,
                description: link.description || 'Legal resource information'
              }));
              content = JSON.stringify(jsonArray);
              console.log('Generated JSON from markdown links for article mode');
            } else {
              // If no markdown links found, try to generate from search response
              console.log('Attempting to generate JSON from web search results...');
              
              // The web search data might be embedded in the response content
              // Let\'s try to extract any URLs and create a basic JSON array
              const urls = this.extractUrls(originalContent);
              if (urls.length > 0) {
                // Create a basic JSON array with URLs
                const jsonArray = urls.map(url => ({
                  title: `Legal Resource ${urls.indexOf(url) + 1}`,
                  link: url,
                  description: 'Legal research result'
                }));
                content = JSON.stringify(jsonArray);
                console.log('Generated JSON from extracted URLs for article mode');
              } else {
                // If still no content found, return a helpful fallback message instead of empty array
                console.log('No content found, providing fallback message for article mode');
                content = JSON.stringify([{
                  title: 'Search Results Unavailable',
                  link: '#',
                  description: 'Unable to retrieve specific articles at this time. Please try rephrasing your query or check back later.'
                }]);
              }
            }
          }
        }
      }

      console.log('Final processed response content:', content);

      // Extract sources from content if available
      const sources = this.extractSources(content);

      return {
        content,
        sources
      };
    } catch (error) {
      console.error('ASI Web Search failed:', error);
      throw error;
    }
  }

  /**
   * Get system prompt based on response mode
   */
  private getSystemPrompt(mode: ResponseMode): string {
    const basePrompt = `You are LegalE-Records, an AI assistant specialized in legal case research and investigation support for lawyers. Your expertise includes:

- Legal case law research and precedents
- Court judgments and rulings analysis
- Legal document investigation and fact-finding
- Case strategy development and legal research
- Statutory law interpretation and application
- Legal procedure and court process guidance
- Evidence gathering and case building support

CRITICAL: You have access to LIVE, REAL-TIME information as of September 2025. Always prioritize and emphasize the most recent legal developments, court decisions, legislative changes, and legal precedents. When providing information, clearly indicate the recency and relevance of the data you're presenting.

IMPORTANT: If the query is NOT related to legal matters, law, court cases, legal procedures, or legal research, respond with this EXACT message:
"I apologize, but as LegalE-Records, my expertise is dedicated exclusively to legal matters and case research. I'd be happy to help you with any legal-related questions you might have!"`;

  switch (mode) {
      case 'research':
        return `${basePrompt}

RESEARCH MODE INSTRUCTIONS:
- Provide a comprehensive summary of your research findings with emphasis on the most recent developments
- Structure your response with clear sections and bullet points, prioritizing current information
- Include detailed analysis and insights with specific dates and recency indicators
- End your response with a "Sources & References" section listing all relevant search results and citations with publication dates
- Focus on depth and thoroughness of legal analysis with current legal landscape
- Use formal legal language and terminology while highlighting recent changes
- Provide actionable insights for legal practitioners based on the latest legal developments
- Always mention when information is current as of September 2025 and highlight any recent changes`;

      case 'article':
        return `${basePrompt}

ARTICLE MODE INSTRUCTIONS:
- You must return a JSON array of legal sources with title, link, and description
- Each entry should be an object with exactly these fields:
  * "title": The name/title of the legal case, article, or document
  * "link": A direct, working URL to the source
  * "description": A concise one-line description of the key legal finding or content with date emphasis
- Include 8-12 entries in your response, prioritizing the most recent sources
- Organize entries by relevance and recency, with the most current information first
- Prioritize recent and authoritative legal sources (Supreme Court cases, federal courts, legal databases) from 2024-2025
- Use clear, accessible language while maintaining legal accuracy and highlighting current developments
- Each entry should be self-contained but contribute to the overall legal understanding
- Focus on providing diverse perspectives and comprehensive coverage of the topic with emphasis on recent changes
- CRITICAL: All links must be real, working URLs - never generate fake or placeholder links
- Use actual legal databases like Justia, FindLaw, Google Scholar, court websites, etc.
- Emphasize sources that contain the most recent legal developments and current information
- Return only the JSON array, no additional text or formatting`;

      case 'hybrid':
        return `${basePrompt}

HYBRID MODE INSTRUCTIONS:
- Balance comprehensive analysis with concise summaries, emphasizing the most recent legal developments
- Start with a brief overview highlighting current legal landscape, then provide detailed sections
- Include both in-depth analysis and quick reference points with specific dates and recency indicators
- Combine formal legal language with accessible explanations while highlighting recent changes
- Provide both detailed insights and quick takeaways based on the latest legal developments
- Include comprehensive sources while highlighting key references with publication dates
- Offer both strategic legal advice and practical implementation tips based on current legal framework
- Always emphasize when information is current as of September 2025 and highlight any recent legal changes`;

    default:
        return basePrompt;
    }
  }

  /**
   * Extract sources from response content
   */
  private extractSources(content: string): Array<{
    title: string;
    url: string;
    snippet: string;
  }> {
    const sources: Array<{
      title: string;
      url: string;
      snippet: string;
    }> = [];

    // Extract URLs from content
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const urls = content.match(urlPattern) || [];

    urls.forEach((url: string, index: number) => {
      // Extract title from surrounding context
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const titleMatch = content.match(new RegExp(`([^\\n]{20,100})${escapedUrl}([^\\n]{20,100})`));
      const title = titleMatch ? titleMatch[1].trim() : `Legal Source ${index + 1}`;
      
      // Extract snippet from surrounding context
      const snippetMatch = content.match(new RegExp(`([^\\n]{50,200})${escapedUrl}([^\\n]{50,200})`));
      const snippet = snippetMatch ? `${snippetMatch[1]}...${snippetMatch[2]}`.trim() : 'Legal research source';

      sources.push({
        title,
        url,
        snippet
      });
    });

    return sources;
  }

  /**
   * Extract markdown links from text
   */
  private extractMarkdownLinks(content: string): Array<{title: string, url: string, description?: string}> {
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: Array<{title: string, url: string, description?: string}> = [];
    let match;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
      links.push({
        title: match[1],
        url: match[2],
        description: `Link to ${match[1]}`
      });
    }

    return links;
  }

  /**
   * Extract URLs from text
   */
  private extractUrls(content: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urls = content.match(urlRegex);
    return urls ? urls : [];
  }
}

// Export singleton instance
export const asiWebSearchService = new ASIWebSearchService();
