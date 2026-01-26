import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

import { normalizeText } from '@/shared/lib/text';

export const runtime = 'nodejs';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing file' }, { status: 400 });
  }

  if (file.size > MAX_RESUME_BYTES) {
    return Response.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
  }

  const lower = file.name.toLowerCase();
  const buf = await file.arrayBuffer();

  try {
    if (lower.endsWith('.pdf')) {
      const parser = new PDFParse({ data: Buffer.from(buf) });
      try {
        const result = await parser.getText();
        return Response.json({ text: normalizeText(result.text || '') });
      } finally {
        await parser.destroy();
      }
    }
    
    if (lower.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return Response.json({ text: normalizeText(result.value || '') });
    }

    return Response.json(
      { error: 'Unsupported file type. Please upload a PDF or DOCX.' },
      { status: 400 },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to parse file' },
      { status: 500 },
    );
  }
}
