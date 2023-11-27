export function extractRuUrls(text: string): string[] {
  // Updated regular expression to match .ru URLs with or without http/https
  const urlRegex = /(https?:\/\/)?[^\s]+?\.ru\b/g;

  // Extracting the URLs
  const matchedUrls = text.match(urlRegex);

  // Return an array of URLs or an empty array if no URLs are found
  return matchedUrls?.filter((match) => !match.includes('@')) || [];
}
