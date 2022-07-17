import { MarkType, Node } from '@bangle.dev/pm';

function flatten (node: Node) {
  const result: {node: Node, pos: number}[] = [];
  node.descendants((child, pos) => {
    result.push({ node: child, pos });
    return false;
  });
  return result;
}

function findChildren (node: Node, predicate: (node: Node) => boolean) {
  return flatten(node).filter((child) => {
    return predicate(child.node);
  });
}

export function findChildrenByMark (node: Node, markType: MarkType) {
  return findChildren(node, (child) => Boolean(markType.isInSet(child.marks)));
}
