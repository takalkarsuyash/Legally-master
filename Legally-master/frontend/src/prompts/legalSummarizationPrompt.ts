/**
 * Prompt template for legal document summarization
 */
export const getLegalDocumentSummaryPrompt = (documentType?: string): string => {
  const basePrompt = `
You are an expert legal assistant specializing in document analysis and summarization. Please analyze the following legal document and provide a comprehensive yet concise summary using Markdown formatting.

Your summary MUST:
- Use proper Markdown syntax throughout (headings with #, lists with -, etc.)
- Be structured with clear headings for each section
- Include concise bullet points rather than paragraphs wherever possible
- Focus on essential information only, avoiding unnecessary details

Include these sections in your summary (as Markdown headings):

## Document Type and Purpose
- Identify the type of legal document and its primary purpose in 1-2 bullet points.

## Key Parties
- List each relevant party and their role using bullet points.

## Main Provisions
- Summarize the most important clauses or terms using concise bullet points.

## Critical Dates
- List any significant deadlines or timeframes in bullet format.

## Legal Obligations
- Outline the key obligations using separate bullet points for each party.

## Potential Issues
- Highlight any ambiguities or concerns using clear bullet points.

## Next Steps
- Suggest immediate actions in a prioritized bullet list.

Remember to maintain professional language while ensuring the output is extremely clear, scannable, and actionable.
`;

  // Add specific guidance based on document type if provided
  if (documentType) {
    switch (documentType.toLowerCase()) {
      case 'contract':
        return `${basePrompt}

For this contract, pay special attention to these elements (include as their own bullet points):
- Consideration and value exchange
- Term and termination conditions
- Representations and warranties
- Indemnification provisions
- Dispute resolution mechanisms`;

      case 'lawsuit':
      case 'complaint':
        return `${basePrompt}

For this legal complaint/lawsuit, pay special attention to these elements (include as their own bullet points):
- Causes of action
- Relief sought
- Jurisdiction and venue assertions
- Factual allegations
- Legal precedents cited`;

      case 'will':
      case 'testament':
        return `${basePrompt}

For this will/testament, pay special attention to these elements (include as their own bullet points):
- Executor appointments
- Distribution of assets
- Trust provisions
- Conditions on bequests
- Codicils or amendments`;

      default:
        return basePrompt;
    }
  }

  return basePrompt;
}; 