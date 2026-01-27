export type DocumentType = 'Rent Agreement' | 'Employment Contract' | 'Non-Disclosure Agreement' | 'Will' | 'Other';

export interface FormInputs {
  documentType: DocumentType;
  partyA: string;
  partyB: string;
  additionalDetails: string;
  specificDetails: string;
  state?: string;
} 