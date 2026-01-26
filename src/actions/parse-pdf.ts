// app/actions.ts
'use server';

import { normalizeText } from '@/shared/lib/text';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export async function parsePdfAction(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing file' }, { status: 400 });
  }
  
  // TODO: should we use a more robust file size validation?
  if (file.size > MAX_RESUME_BYTES) {
    return Response.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
  }

  const filename = file.name.toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  try {
    if (filename.endsWith('.pdf')) {
      const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
      try {
        const result = await parser.getText();
        return {
          text: normalizeText(result.text),
        };
      } finally {
        await parser.destroy();
      }
    }
    
    if (filename.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      return {
        text: normalizeText(result.value),
      };
    }

    // TODO: to do validation to filter out other file types way before we get here to prevent this error from being thrown
    throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
  } catch (error) {
    throw error;
  }
}