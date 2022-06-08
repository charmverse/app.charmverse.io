import { PageContent } from 'models';

/**
 * Extract all mention ids from page content (json)
 * @param content Page content as raw json
 * @returns An array of mention ids
 */
export function extractMentions (content: PageContent) {
  const mentionIds: string[] = [];

  function recurse (parentNode: PageContent) {
    if (parentNode.content) {
      parentNode.content.forEach(contentNode => recurse(contentNode));
    }

    if (parentNode.type === 'mention' && parentNode.attrs) {
      mentionIds.push(parentNode.attrs.id);
    }
  }

  recurse(content);

  return mentionIds;
}
