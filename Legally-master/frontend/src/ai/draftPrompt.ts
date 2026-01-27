// Simple document types
export const DOCUMENT_TYPES = [
  'Rent Agreement',
  'Employment Contract',
  'Non-Disclosure Agreement',
  'Will',
  'Other'
] as const;

// Simple legal references for document types
export const INDIAN_LEGAL_REFERENCES = {
  'Rent Agreement': {
    acts: ['Transfer of Property Act, 1882', 'Registration Act, 1908', 'Rent Control Act'],
    stampDuty: 'Varies by state from 0.5% to 5% of annual rent',
    registrationRequired: true
  },
  'Employment Contract': {
    acts: ['Industrial Employment Act, 1946', 'Minimum Wages Act, 1948', 'Shops and Establishments Act'],
    stampDuty: 'Not applicable',
    registrationRequired: false
  },
  'Non-Disclosure Agreement': {
    acts: ['Indian Contract Act, 1872', 'Information Technology Act, 2000'],
    stampDuty: 'Not applicable',
    registrationRequired: false
  },
  'Will': {
    acts: ['Indian Succession Act, 1925', 'Registration Act, 1908'],
    stampDuty: 'Minimal stamp duty',
    registrationRequired: false
  },
  'Other': {
    acts: ['Indian Contract Act, 1872'],
    stampDuty: 'As applicable',
    registrationRequired: false
  }
} as const;

// Simple system prompt for document generation

export const SYSTEM_PROMPT = `You are an expert Indian legal document generator. Generate professional legal documents following Indian law with proper formatting and legal references.

Requirements:
1. Use proper Indian legal document structure with numbered sections
2. Include relevant Indian legal act references
3. Format in clean markdown with headers and proper citations
4. Add signature blocks and witness requirements
5. Include appropriate legal disclaimers
6. Use professional legal language that's understandable

Format the document with:
- Title and parties section
- Recitals/background
- Main terms and conditions
- Legal references and citations
- Signature blocks with witness provisions
- Proper markdown formatting`;

// Simple contextual prompt generation
export const getContextualPrompt = (
  documentType: string,
  partyA: string,
  partyB: string,
  additionalDetails: string,
  specificDetails: string
): string => {
  const legalRefs = INDIAN_LEGAL_REFERENCES[documentType as keyof typeof INDIAN_LEGAL_REFERENCES] || INDIAN_LEGAL_REFERENCES['Other'];

  return `Generate a ${documentType} with the following details:

Parties:
- Party A: ${partyA}
- Party B: ${partyB}

Additional Details: ${additionalDetails}

Specific Requirements: ${specificDetails}

Legal References: ${legalRefs.acts.join(', ')}

Please create a comprehensive legal document following Indian law with proper formatting, legal citations, and all necessary clauses.`;
};

// Simple validation
export const validateDocumentType = (type: string): boolean => {
  return DOCUMENT_TYPES.includes(type as typeof DOCUMENT_TYPES[number]);
};

// Simple configuration
export const GENERATION_CONFIG = {
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 0.95
} as const;

export const GROQ_MODEL = 'llama-3.1-8b-instant';