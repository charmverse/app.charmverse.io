import { nestedPageMarkdownEnclosure } from './nestedPage.constants';

/**
 * Encloses a nested page with markers so it can be parsed after the markdown serializer has run on the whole document.
 * @param pageId
 */
export function encloseNestedPage(pageId: string): string {
  return `_${nestedPageMarkdownEnclosure}(${pageId})_`;
}
