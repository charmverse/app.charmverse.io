import { shortenHex } from 'lib/utilities/strings';
import type { PageContent } from 'models';

/**
 * Extract all mention ids from page content (json)
 * @param content Page content as raw json
 * @returns An array of mention ids
 */
export function extractMentions (content: PageContent, username?: string) {
  const mentions: { id: string, createdAt: string, createdBy: string, text: string, value: string }[] = [];

  function recurse (node: PageContent, parentNode: PageContent | null) {
    if (node.content) {
      node.content.forEach(childNode => {
        // A back reference to the parent node
        recurse(childNode, node);
      });
    }

    // Checking if all the mention attributes exist or not, and continue only if they exist
    if (node.type === 'mention' && node.attrs && node.attrs.type === 'user' && parentNode && node.attrs.id && node.attrs.createdAt && node.attrs.createdBy && node.attrs.value) {
      let text = '';
      if (parentNode.type.match(/(paragraph|heading)/)) {
        parentNode.content?.forEach((childNode: PageContent) => {
          if (childNode.text) {
            text += childNode.text;
          }
          else if (childNode.type === 'mention') {
            text += `@${username ?? shortenHex(childNode.attrs?.value)}`;
          }
        });
      }

      mentions.push({ id: node.attrs.id, text, createdAt: node.attrs.createdAt, createdBy: node.attrs.createdBy, value: node.attrs.value });
    }
  }

  recurse(content, null);

  return mentions;
}
