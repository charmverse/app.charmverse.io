import type { EditorView, MarkType, Mark, Transaction } from '@bangle.dev/pm';
import type { NodeWithPos } from 'prosemirror-utils';
import { findChildrenByMark } from 'prosemirror-utils';

export function removeInlineVoteMark (view: EditorView, voteId: string) {
  const doc = view.state.doc;
  const inlineVoteMarkSchema = view.state.schema.marks['inline-vote'] as MarkType;
  const inlineVoteNodes = findChildrenByMark(doc, inlineVoteMarkSchema);
  const inlineVoteNodeWithMarks: (NodeWithPos & { mark: Mark })[] = [];

  for (const inlineVoteNode of inlineVoteNodes) {
    // Find the inline vote mark for the node
    const inlineVoteMark = inlineVoteNode.node.marks.find(mark => mark.type.name === inlineVoteMarkSchema.name);
    // Make sure the mark has the same voteId as the given one
    if (inlineVoteMark?.attrs.id === voteId) {
      inlineVoteNodeWithMarks.push({
        ...inlineVoteNode,
        mark: inlineVoteMark
      });
    }
  }

  let tr: Transaction | null = null;
  inlineVoteNodeWithMarks.forEach(inlineVoteNodeWithMark => {
    const from = inlineVoteNodeWithMark.pos;
    const to = from + inlineVoteNodeWithMark.node.nodeSize;
    tr = view.state.tr.removeMark(from, to, inlineVoteMarkSchema);
  });
  if (tr && view.dispatch) {
    view.dispatch(tr);
  }
}
