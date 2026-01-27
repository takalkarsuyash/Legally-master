/**
 * Reads a file and returns its contents as a base64 string
 * @param file File to read
 * @returns Promise resolving to a base64 string
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // The result is a string with format: "data:application/pdf;base64,JVBERi0xLjMK..."
      // We need to strip the prefix "data:application/pdf;base64," to get just the base64 string
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};
