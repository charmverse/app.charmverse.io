export function removeApiKeyFromQuery(text: string) {
  if (!text) {
    return text;
  }
  return text.replace(/api_key=[^&]+&?/, '');
}
