// Dynamic import to avoid top-level await
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
}

export interface ParsedPdfContent {
  fileName: string;
  title: string;
  description: string;
  content: string;
  pageCount: number;
}

export async function parsePdfFile(file: File): Promise<ParsedPdfContent> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  const pageCount = pdf.numPages;
  
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  // Clean up the text
  const cleanedText = cleanPdfText(fullText);
  
  // Extract title from first meaningful line or file name
  const title = extractTitle(cleanedText, file.name);
  
  // Generate description from content
  const description = generateDescription(cleanedText, title);
  
  return {
    fileName: file.name,
    title,
    description,
    content: cleanedText,
    pageCount,
  };
}

function cleanPdfText(text: string): string {
  return text
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove page numbers (common patterns)
    .replace(/\s*\d+\s*\/\s*\d+\s*/g, ' ')
    .replace(/\s*Page\s+\d+\s*/gi, ' ')
    .replace(/\s*Trang\s+\d+\s*/gi, ' ')
    // Clean up line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTitle(content: string, fileName: string): string {
  // Try to get title from first line
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // If first line is short enough and looks like a title
    if (firstLine.length > 5 && firstLine.length < 150) {
      return firstLine;
    }
  }
  
  // Fallback to file name without extension
  return fileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').trim();
}

function generateDescription(content: string, title: string): string {
  // Get first 150 chars after title as description
  const contentWithoutTitle = content.replace(title, '').trim();
  const description = contentWithoutTitle.substring(0, 150).trim();
  
  if (description.length > 0) {
    return description + (contentWithoutTitle.length > 150 ? '...' : '');
  }
  
  return `Nội dung về ${title}`;
}

export async function parseMutiplePdfFiles(
  files: File[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<ParsedPdfContent[]> {
  const results: ParsedPdfContent[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file.name);
    
    try {
      const parsed = await parsePdfFile(file);
      results.push(parsed);
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error);
      // Add failed file with error info
      results.push({
        fileName: file.name,
        title: file.name.replace(/\.pdf$/i, ''),
        description: 'Lỗi khi đọc file PDF',
        content: '',
        pageCount: 0,
      });
    }
  }
  
  return results;
}
