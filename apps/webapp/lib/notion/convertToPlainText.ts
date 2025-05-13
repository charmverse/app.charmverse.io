export function convertToPlainText(chunks: { plain_text: string }[]) {
  return chunks.reduce((prev: string, cur: { plain_text: string }) => prev + cur.plain_text, '');
}
