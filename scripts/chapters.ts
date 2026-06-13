import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ChapterRange = { name: string; from: number; to: number };

const chaptersPath = join(dirname(fileURLToPath(import.meta.url)), 'chapters.json');

export function loadChapters(): ChapterRange[] {
  const raw = readFileSync(chaptersPath, 'utf8');
  const data = JSON.parse(raw) as ChapterRange[];
  return data.map((entry) => ({ ...entry })).sort((a, b) => a.from - b.from);
}
