/**
 * Document Text Extractor Middleware
 * Extracts text from various file types and prepares it for ASI processing
 */

// PDF.js for PDF text extraction
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractedText {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    pageCount?: number;
    wordCount: number;
    extractionMethod: 'pdf-js' | 'file-reader' | 'manual';
  };
}

export interface ExtractionOptions {
  maxPages?: number;
  includeMetadata?: boolean;
  preserveFormatting?: boolean;
}

/**
 * Document Text Extractor - Middleware for ASI Integration
 */
export class DocumentExtractor {
  private static instance: DocumentExtractor;

  private constructor() {}

  public static getInstance(): DocumentExtractor {
    if (!DocumentExtractor.instance) {
      DocumentExtractor.instance = new DocumentExtractor();
    }
    return DocumentExtractor.instance;
  }

  /**
   * Extract text from any supported file type
   */
  async extractTextFromFile(
    file: File, 
    options: ExtractionOptions = {}
  ): Promise<ExtractedText> {
    const {
      maxPages = 50,
      includeMetadata = true,
      preserveFormatting = true
    } = options;

    const fileName = file.name;
    const fileType = file.type.toLowerCase();
    const fileExtension = fileName.toLowerCase().split('.').pop() || '';

    try {
      let extractedText = '';
      let extractionMethod: 'pdf-js' | 'file-reader' | 'manual' = 'file-reader';
      let pageCount = 0;

      // Route to appropriate extraction method
      if (fileExtension === 'pdf' || fileType === 'application/pdf') {
        const result = await this.extractFromPDF(file, maxPages);
        extractedText = result.text;
        pageCount = result.pageCount;
        extractionMethod = 'pdf-js';
      } else if (fileExtension === 'txt' || fileType === 'text/plain') {
        extractedText = await this.extractFromTextFile(file);
        extractionMethod = 'file-reader';
      } else if (fileExtension === 'doc' || fileExtension === 'docx') {
        // For DOC/DOCX, we'll try to read as text (basic approach)
        extractedText = await this.extractFromTextFile(file);
        extractionMethod = 'file-reader';
      } else {
        // Fallback: try to read as text
        extractedText = await this.extractFromTextFile(file);
        extractionMethod = 'file-reader';
      }

      // Clean and format the extracted text
      if (preserveFormatting) {
        extractedText = this.cleanAndFormatText(extractedText);
      }

      const wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;

      return {
        text: extractedText,
        metadata: {
          fileName,
          fileType,
          pageCount,
          wordCount,
          extractionMethod
        }
      };

    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error(`Failed to extract text from ${fileName}. Please ensure the file is readable and not corrupted.`);
    }
  }

  /**
   * Extract text from PDF using PDF.js
   */
  private async extractFromPDF(file: File, maxPages: number): Promise<{ text: string; pageCount: number }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pageCount = Math.min(pdf.numPages, maxPages);
      let fullText = '';

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items and join them
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      }

      return {
        text: fullText,
        pageCount: pageCount
      };

    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractFromTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file as text'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Clean and format extracted text for better ASI processing
   */
  private cleanAndFormatText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page markers
      .replace(/--- Page \d+ ---/g, '\n\n')
      // Clean up line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove special characters that might confuse ASI
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim whitespace
      .trim();
  }

  /**
   * Get file type information
   */
  getFileTypeInfo(file: File): {
    isPDF: boolean;
    isText: boolean;
    isDocument: boolean;
    supported: boolean;
  } {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    return {
      isPDF: fileType === 'application/pdf' || fileName.endsWith('.pdf'),
      isText: fileType === 'text/plain' || fileName.endsWith('.txt'),
      isDocument: fileName.endsWith('.doc') || fileName.endsWith('.docx'),
      supported: this.isFileTypeSupported(file)
    };
  }

  /**
   * Check if file type is supported
   */
  private isFileTypeSupported(file: File): boolean {
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const supportedExtensions = ['.pdf', '.txt', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    
    return supportedTypes.includes(file.type.toLowerCase()) || 
           supportedExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Validate file for processing
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 50MB limit. Please upload a smaller file.'
      };
    }

    if (!this.isFileTypeSupported(file)) {
      return {
        valid: false,
        error: 'Unsupported file type. Please upload PDF, TXT, DOC, or DOCX files.'
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const documentExtractor = DocumentExtractor.getInstance();

// Export convenience functions
export const extractTextFromFile = (file: File, options?: ExtractionOptions) => 
  documentExtractor.extractTextFromFile(file, options);

export const getFileTypeInfo = (file: File) => 
  documentExtractor.getFileTypeInfo(file);

export const validateFile = (file: File) => 
  documentExtractor.validateFile(file);
