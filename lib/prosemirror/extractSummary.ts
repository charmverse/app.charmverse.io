import type { PageContent } from './interfaces';

export function extractSummaryNode(doc: PageContent): PageContent | null {
  // get the first paragraph node
  return null;
}

export function extractSummaryHtml(doc: PageContent): string {
  const node = extractSummaryNode(doc);
  return '';
}
