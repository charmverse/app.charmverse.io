import { MarkType, Node } from "@bangle.dev/pm";

export function findFirstMarkPosition(
  mark: MarkType,
  doc: Node,
  from: number,
  to: number,
) {
  let markPos = { start: -1, end: -1 };
  
  doc.nodesBetween(from - 1, to, (node, pos) => {
    // stop recursing if result is found
    if (markPos.start > -1) {
      return false;
    }

    if (markPos.start === -1 && mark.isInSet(node.marks)) {
      markPos = {
        start: pos,
        end: pos + Math.max(node.textContent.length, 1),
      };
    }
  });

  return markPos;
}