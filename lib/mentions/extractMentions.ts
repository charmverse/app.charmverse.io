import { PageContent } from 'models';

/**
 * Extract all mention ids from page content (json)
 * @param content Page content as raw json
 * @returns An array of mention ids
 */
export function extractMentions (content: PageContent) {
  const mentions: {id: string, createdAt: string, createdBy: string, text: string}[] = [];

  function recurse (parentNode: PageContent) {
    if (parentNode.content) {
      parentNode.content.forEach(contentNode => {
        // A back reference to the parent node
        (contentNode as any).parent = parentNode;
        recurse(contentNode);
      });
    }

    if (parentNode.type === 'mention' && parentNode.attrs) {
      const parent = parentNode.parent;
      let text = '';

      if (parent.type.match(/(paragraph|heading)/)) {
        parent.content.forEach((node: PageContent) => {
          if (node.text) {
            text += node.text;
          }
        });
      }

      mentions.push({ id: parentNode.attrs.id, text, createdAt: parentNode.attrs.createdAt, createdBy: parentNode.attrs.createdBy });
    }
  }

  recurse(content);

  return mentions;
}
