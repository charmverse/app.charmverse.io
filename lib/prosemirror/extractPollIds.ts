import type { PageContent } from 'lib/prosemirror/interfaces';

export function extractPollIds(content: PageContent | null) {
  if (!content) {
    return [];
  }

  const pollIds: string[] = [];

  function recurse(node: PageContent) {
    if (node.content) {
      node.content.forEach((childNode) => {
        recurse(childNode);
      });
    }

    if (node.type === 'poll' && node.attrs?.pollId) {
      pollIds.push(node.attrs.pollId);
    }
  }

  recurse(content);

  return pollIds;
}
