import type { BlockNode, TextContent, PageContent } from '@packages/charmeditor/interfaces';

export function checkIsContentEmpty(content: PageContent | null | undefined): boolean {
  return (
    !content?.content ||
    content.content.length === 0 ||
    (content.content.length === 1 && isEmptyNode(content.content[0]))
  );
}

function isEmptyNode(node: BlockNode): boolean {
  return (
    // These nodes dont contain any content so there is no content field
    !!node.type.match(/(cryptoPrice|farcasterFrame|columnLayout|image|iframe|mention|page|poll|tableOfContents)/) ||
    (!node.content?.length && !(node as TextContent).text)
  );
}
