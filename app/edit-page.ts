import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const entities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

export async function renderEditPage(redirectUrl: string, hitCount: number) {
  const html = await readFile(resolve('app/pages/edit.html'), 'utf8');
  const escapedUrl = redirectUrl.replace(/[&<>"']/g, char => entities[char]);
  return html
    .replace('{{hitCount}}', String(hitCount))
    .replace('{{redirectUrl}}', () => escapedUrl);
}
