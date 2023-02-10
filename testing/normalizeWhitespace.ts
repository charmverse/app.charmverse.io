export function normalizeWhitespace(str: string) {
  // change all types of whitespaces to regular whitespace
  return str.split(/\s+/).join(' ');
}
