import fs from 'fs/promises';
import path from 'path';
import { parseOffice, type OfficeParserAST } from 'officeparser';

const MAX_CHARS_PER_FILE = 8_000;

export interface ExtractedFile {
  subject: string;
  fileName: string;
  text: string;
  error?: string;
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Content truncated for token budget]';
}

export async function extractFilesForUser(userId: string, dataRoot: string): Promise<ExtractedFile[]> {
  const userDir = path.join(dataRoot, userId);
  const results: ExtractedFile[] = [];

  try {
    await fs.access(userDir);
  } catch {
    return results;
  }

  const entries = await fs.readdir(userDir, { withFileTypes: true });
  const subjects = entries.filter((e) => e.isDirectory() && e.name !== 'Summary').map((e) => e.name);

  for (const subject of subjects) {
    const filesDir = path.join(userDir, subject, 'Files');
    try {
      await fs.access(filesDir);
    } catch {
      continue;
    }

    const files = await fs.readdir(filesDir, { withFileTypes: true });
    const fileNames = files.filter((f) => f.isFile() && !f.name.startsWith('.') && f.name !== '.gitkeep').map((f) => f.name);

    for (const fileName of fileNames) {
      const filePath = path.join(filesDir, fileName);
      try {
        const ast = (await parseOffice(filePath)) as OfficeParserAST;
        const rawText = ast.toText ? ast.toText() : '[No text extracted]';
        const text = truncateText(rawText, MAX_CHARS_PER_FILE);
        results.push({ subject, fileName, text });
      } catch (err: any) {
        results.push({
          subject,
          fileName,
          text: '',
          error: err?.message || 'Failed to parse file',
        });
      }
    }
  }

  return results;
}
