export const generateNotesPrompt = (title: string, court: string): string => {
    return `Generate professional case notes for a legal case with the following details:
Case Title: "${title}"
Court: "${court}"

Validation Rules:
- Evaluate if the title represents a legitimate legal case. Reject if it's gibberish, random characters, or not a real case title (e.g., "fafdsa", "test", "abc123").
- Evaluate if the court represents a legitimate court name. Reject if it's gibberish, random characters, or not a real court name.
- If either the title or court is missing, blank, gibberish, irrelevant, or not representative of a real legal case/court, return exactly:
  "Error: Insufficient or irrelevant information provided."

Output Requirements:
- Provide the response in exactly 3 lines of plain text.
- Each line must not exceed 20 words.

Line Format:
1. Brief note summarizing the case based on title and court (max 20 words).
2. Key documents required for the case (max 20 words).
3. Legal references or acts to review before the hearing (max 20 words).
- Ensure the notes are concise, professional, and relevant to the case.
- Do not include any additional information or commentary.
- The response should be suitable for legal documentation and easy to read.`;
  };
  