import * as pdfjsLib from 'pdfjs-dist';

// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source path to local module
// This uses Vite's ?url import to get the resolved path to the worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Extracts text content from a PDF file
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDocument = await loadingTask.promise;

        let fullText = '';

        // Iterate through each page
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += `[Page ${i}]\n${pageText}\n\n`;
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF document');
    }
};
