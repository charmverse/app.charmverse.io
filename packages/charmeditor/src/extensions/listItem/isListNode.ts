import { Node } from 'prosemirror-model';

import { BULLET_LIST, ORDERED_LIST } from '../../nodeNames';

export function isListNode(node: Node): boolean {
  if (node instanceof Node) {
    return node.type.name === BULLET_LIST || node.type.name === ORDERED_LIST;
  }
  return false;
}
