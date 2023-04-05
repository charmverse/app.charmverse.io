export function isPdfEmbedLink(url: string) {
  return new URL(url).pathname.endsWith('.pdf');
}
