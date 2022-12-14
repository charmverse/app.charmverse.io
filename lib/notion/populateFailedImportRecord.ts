import type { GetPageResponse, GetDatabaseResponse } from './types';

function convertToPlainText(chunks: { plain_text: string }[]) {
  return chunks.reduce((prev: string, cur: { plain_text: string }) => prev + cur.plain_text, '');
}

export function populateFailedImportRecord(
  failedImportBlocks: [string, number][][],
  block: GetPageResponse | GetDatabaseResponse
) {
  let title = '';
  // Database
  if (block.object === 'database') {
    title = convertToPlainText(block.title);
  } else if (block.parent.type === 'database_id') {
    // Focalboard cards
    title = convertToPlainText(
      (Object.values(block.properties).find((property) => property.type === 'title') as any).title
    );
  }
  // Regular page
  else {
    title = convertToPlainText((block.properties.title as any)[block.properties.title.type]);
  }
  return {
    pageId: block.id,
    type: block.object,
    title,
    blocks: failedImportBlocks
  };
}
