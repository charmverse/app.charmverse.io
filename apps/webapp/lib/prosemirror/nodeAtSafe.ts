import type { Node } from 'prosemirror-model';

export function nodeAtSafe(doc: Node, pos: number): Node | null {
  if (pos < 0 || pos > doc.content.size) {
    // Exit here or error will be thrown:
    // e.g. RangeError: Position outside of fragment.
    return null;
  }
  return doc.nodeAt(pos);
}
