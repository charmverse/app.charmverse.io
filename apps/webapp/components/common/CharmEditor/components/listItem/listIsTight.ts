import type Token from 'markdown-it/lib/token.mjs';

// markdown parsing helper
export function listIsTight(tokens: Token[], i: number) {
  // eslint-disable-next-line no-plusplus
  while (++i < tokens.length) {
    if (tokens[i].type !== 'list_item_open') {
      return tokens[i].hidden;
    }
  }
  return false;
}
