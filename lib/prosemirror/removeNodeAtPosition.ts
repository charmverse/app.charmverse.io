import type { Transaction } from 'prosemirror-state';

/**
 * Performs a `delete` transaction that removes a node at a given position with
 * the given `node`. `position` should point at the position immediately before
 * the node.
 *
 * @param position - the prosemirror position
 */
export function removeNodeAtPosition({ pos, tr }: { pos: number; tr: Transaction }): Transaction {
  const node = tr.doc.nodeAt(pos);
  if (node) {
    tr.delete(pos, pos);
  }
  return tr;
}
