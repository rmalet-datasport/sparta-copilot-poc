'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { BrandExample } from '@/lib/types/brandHistory';

interface BrandHistoryContextValue {
  examples: BrandExample[];
  fileName: string | null;
  uploadFile: (file: File) => Promise<void>;
  clearExamples: () => void;
  getRelevantExamples: (context: { gate: string; segment: string; channel?: string }) => BrandExample[];
}

const BrandHistoryContext = createContext<BrandHistoryContextValue | null>(null);

// Flexible column name matching (FR + EN)
const COLUMN_MAP: Record<keyof BrandExample, string[]> = {
  channel:  ['channel', 'canal', 'ch'],
  gate:     ['gate', 'phase', 'etape', 'step'],
  segment:  ['segment', 'audience', 'cible', 'target'],
  subject:  ['subject', 'objet', 'sujet'],
  title:    ['title', 'titre'],
  body:     ['body', 'texte', 'contenu', 'content', 'message', 'text'],
  caption:  ['caption', 'legende', 'cap'],
  hashtags: ['hashtags', 'tags', 'hashtag'],
};

function normalizeHeader(header: string): keyof BrandExample | null {
  const h = header.toLowerCase().trim().replace(/[^a-z]/g, '');
  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    if (aliases.some(a => h === a.replace(/[^a-z]/g, ''))) return field as keyof BrandExample;
  }
  return null;
}

export function normalizeGate(g?: string): string | undefined {
  if (!g) return undefined;
  const s = g.toLowerCase().trim();
  if (s.includes('creat') || s === 'gate0' || s === '0') return 'gate0';
  if (s.includes('regist') || s === 'gate1' || s === '1') return 'gate1';
  if (s.includes('lotter') || s === 'gate2' || s === '2') return 'gate2';
  if (s.includes('finish') || s.includes('race') || s === 'gate3' || s === '3') return 'gate3';
  return s;
}

function parseRows(rows: Record<string, string>[]): BrandExample[] {
  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const fieldMap: Partial<Record<keyof BrandExample, string>> = {};
  for (const h of headers) {
    const field = normalizeHeader(h);
    if (field && !(field in fieldMap)) fieldMap[field] = h;
  }

  const CONTENT_FIELDS: (keyof BrandExample)[] = ['subject', 'title', 'body', 'caption', 'hashtags'];

  return rows
    .map(row => {
      const ex: BrandExample = {};
      for (const [field, originalHeader] of Object.entries(fieldMap) as [keyof BrandExample, string][]) {
        const val = row[originalHeader]?.toString().trim();
        if (val) ex[field] = val;
      }
      if (ex.gate) ex.gate = normalizeGate(ex.gate);
      if (ex.channel) ex.channel = ex.channel.toLowerCase();
      if (ex.segment) ex.segment = ex.segment.toLowerCase();
      return ex;
    })
    .filter(ex => CONTENT_FIELDS.some(f => ex[f]));
}

async function parseFile(file: File): Promise<BrandExample[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });
    return parseRows(rows);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await wb.xlsx.load(buffer);
    const ws = wb.worksheets[0];
    if (!ws) return [];

    const headers: string[] = [];
    const rows: Record<string, string>[] = [];

    ws.eachRow((row, rowIndex) => {
      if (rowIndex === 1) {
        row.eachCell({ includeEmpty: true }, (cell, col) => {
          headers[col] = String(cell.value ?? '').trim();
        });
      } else {
        const rowData: Record<string, string> = {};
        row.eachCell({ includeEmpty: true }, (cell, col) => {
          const key = headers[col];
          if (key) rowData[key] = String(cell.value ?? '').trim();
        });
        rows.push(rowData);
      }
    });

    return parseRows(rows);
  }

  return [];
}

export function BrandHistoryProvider({ children }: { children: ReactNode }) {
  const [examples, setExamples] = useState<BrandExample[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    const parsed = await parseFile(file);
    setExamples(parsed);
    setFileName(file.name);
  }, []);

  const clearExamples = useCallback(() => {
    setExamples([]);
    setFileName(null);
  }, []);

  const getRelevantExamples = useCallback(
    (context: { gate: string; segment: string; channel?: string }): BrandExample[] => {
      const ctxGate = normalizeGate(context.gate);
      const ctxSegment = context.segment.toLowerCase();
      const ctxChannel = context.channel?.toLowerCase();

      return examples
        .filter(ex => {
          if (ex.channel && ctxChannel && ex.channel !== ctxChannel) return false;
          if (ex.gate && ex.gate !== ctxGate) return false;
          if (ex.segment && ex.segment !== ctxSegment) return false;
          return true;
        })
        .map(ex => ({
          ex,
          score: (ex.channel ? 2 : 0) + (ex.gate ? 2 : 0) + (ex.segment ? 2 : 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(item => item.ex);
    },
    [examples]
  );

  return (
    <BrandHistoryContext.Provider value={{ examples, fileName, uploadFile, clearExamples, getRelevantExamples }}>
      {children}
    </BrandHistoryContext.Provider>
  );
}

export function useBrandHistory() {
  const ctx = useContext(BrandHistoryContext);
  if (!ctx) throw new Error('useBrandHistory must be used within BrandHistoryProvider');
  return ctx;
}
