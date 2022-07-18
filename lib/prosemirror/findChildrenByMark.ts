import { MarkType, Node } from '@bangle.dev/pm';

// source: https://github.com/atlassian/prosemirror-utils/blob/master/src/node.js#L7
function flatten (node: Node) {
  const result: {node: Node, pos: number}[] = [];
  node.descendants((child, pos) => {
    result.push({ node: child, pos });
    return false;
  });
  return result;
}

// source: https://github.com/atlassian/prosemirror-utils/blob/master/src/node.js#L27
function findChildren (node: Node, predicate: (node: Node) => boolean) {
  return flatten(node).filter((child) => {
    return predicate(child.node);
  });
}

// source: https://github.com/atlassian/prosemirror-utils/blob/master/src/node.js#L92
export function findChildrenByMark (node: Node, markType: MarkType) {
  return findChildren(node, (child) => Boolean(markType.isInSet(child.marks)));
}
