import type { PageLink } from '@packages/pages/interfaces';

import { nestedPageMarkdownEnclosure } from './nestedPage.constants';
/**
 * Encloses a nested page with markers so it can be parsed after the markdown serializer has run on the whole document.
 * @param pageId
 */
export function encloseNestedPage(pageId: string): string {
  return `_${nestedPageMarkdownEnclosure}(${pageId})_`;
}

function extractPageId(matchedMarkdownEnclosure: string): string {
  return matchedMarkdownEnclosure
    .trim()
    .split(`_${nestedPageMarkdownEnclosure}(`)
    .filter((str) => !!str)[0]
    .split(')')
    .filter((str) => !!str)[0];
}

/**
 * Returns a list of page IDs
 */
function parseNestedPagesToReplace(convertedToMarkdown: string): string[] {
  return convertedToMarkdown.match(new RegExp(`_${nestedPageMarkdownEnclosure}\\((?:[a-f]|\\d|-){1,}\\)_`, 'g')) ?? [];
}

/**
 * Returns markdown content with page data interpolated
 * @param convertedToMarkdown
 */
export async function replaceNestedPages(convertedToMarkdown: string): Promise<string> {
  const nestedPageMarkers = parseNestedPagesToReplace(convertedToMarkdown);

  const isServer = typeof window === 'undefined';

  // Dynamic import allows this function to be loaded in the client-side without triggering a server-side import
  const linkGetter = isServer
    ? // Server-side method
      (await import('@packages/pages/generatePageLink')).generatePageLink
    : // Client-side method
      (pageId: string) => {
        const documentNode = document.querySelector(`[data-id="${pageId}"]`) as HTMLDivElement;
        const pageLink: PageLink = {
          title: (documentNode?.getAttribute('data-title') as string) ?? '',
          url: (documentNode?.getAttribute('data-path') as string) ?? ''
        };
        return pageLink;
      };

  await Promise.all(
    nestedPageMarkers.map((pageMarker) => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise<void>(async (resolve) => {
        const pageId = extractPageId(pageMarker);

        try {
          const pageLink = await linkGetter(pageId);
          convertedToMarkdown = convertedToMarkdown.replace(pageMarker, `[${pageLink.title}](${pageLink.url})`);
          resolve();
        } catch (err) {
          // Lookup failed. Delete this link
          convertedToMarkdown = convertedToMarkdown.replace(pageMarker, '');
          resolve();
        }
      });
    })
  );
  return convertedToMarkdown;
}
