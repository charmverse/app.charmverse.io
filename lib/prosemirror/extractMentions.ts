import type { PageContent } from 'lib/prosemirror/interfaces';

export interface UserMentionMetadata {
  id: string;
  createdAt: string;
  createdBy: string;
  value: string;
  parentNode?: PageContent | null;
  type: 'user' | 'role';
}

function checkMentionNode(node: PageContent) {
  if (
    node.type === 'mention' &&
    node.attrs &&
    (node.attrs.type === 'user' || node.attrs.type === 'role') &&
    node.attrs.id &&
    node.attrs.createdAt &&
    node.attrs.createdBy &&
    node.attrs.value
  ) {
    return {
      id: node.attrs.id,
      type: node.attrs.type,
      createdAt: node.attrs.createdAt,
      createdBy: node.attrs.createdBy,
      value: node.attrs.value
    };
  }

  return null;
}

/**
 * Extract all mention ids from page content (json)
 * @param content Page content as raw json
 * @returns An array of mention ids
 */
export function extractMentions(content: PageContent | null) {
  if (!content) {
    return [];
  }

  const mentions: Map<string, UserMentionMetadata> = new Map();

  function recurse(node: PageContent, parentNode: PageContent | null) {
    if (node.content) {
      node.content.forEach((childNode) => {
        // A back reference to the parent node
        recurse(childNode, node);
      });
    }

    const mention = parentNode ? checkMentionNode(node) : null;
    if (mention) {
      mentions.set(mention.id, {
        ...mention,
        parentNode
      });
    }
  }

  recurse(content, null);

  return Array.from(mentions.values());
}
