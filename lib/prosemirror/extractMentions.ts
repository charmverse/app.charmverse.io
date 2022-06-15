import { shortenHex } from 'lib/utilities/strings';
import { PageContent } from 'models';

/**
 * Extract all mention ids from page content (json)
 * @param content Page content as raw json
 * @returns An array of mention ids
 */
export function extractMentions (content: PageContent) {
  const mentions: {id: string, createdAt: string, createdBy: string, text: string}[] = [];

  function recurse (node: PageContent, parentNode: PageContent | null) {
    if (node.content) {
      node.content.forEach(childNode => {
        // A back reference to the parent node
        recurse(childNode, node);
      });
    }

    if (node.type === 'mention' && node.attrs && parentNode) {
      let text = '';
      if (parentNode.type.match(/(paragraph|heading)/)) {
        parentNode.content?.forEach((childNode: PageContent) => {
          if (childNode.text) {
            text += childNode.text;
          }
          else if (childNode.type === 'mention') {
            text += `@${shortenHex(childNode.attrs?.value)}`;
          }
        });
      }

      mentions.push({ id: node.attrs.id, text, createdAt: node.attrs.createdAt, createdBy: node.attrs.createdBy });
    }
  }

  recurse(content, null);

  return mentions;
}
