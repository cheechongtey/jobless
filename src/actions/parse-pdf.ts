// app/actions.ts
'use server';

import { convertTextToMarkdown, normalizeText } from '@/shared/lib/text';
import { PDFParse } from 'pdf-parse';

export async function parsePdfAction(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Initialize the parser with data
  const parser = new PDFParse({ data: buffer });

  try {
    // getInfo() provides metadata and page counts
    const info = await parser.getInfo();
    
    // getText() provides the actual content
    const result = await parser.getText();

    // Always destroy to free memory
    await parser.destroy();

    return {
      text: normalizeText(result.text),
      pages: info.total,
      metadata: info.metadata,
    };
  } catch (error) {
    console.error("Parsing failed:", error);
    throw error;
  }
}