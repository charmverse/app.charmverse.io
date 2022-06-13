import { PageContent } from 'models';

/**
 * Extract all mention ids from page content (json)
 * @param content Page content as raw json
 * @returns An array of mention ids
 */
export function extractMentions (content: PageContent) {
  const mentions: {id: string, createdAt: string}[] = [];

  function recurse (parentNode: PageContent) {
    if (parentNode.content) {
      parentNode.content.forEach(contentNode => recurse(contentNode));
    }

    if (parentNode.type === 'mention' && parentNode.attrs) {
      mentions.push({ id: parentNode.attrs.id, createdAt: parentNode.attrs.createdAt });
    }
  }

  recurse(content);

  return mentions;
}
