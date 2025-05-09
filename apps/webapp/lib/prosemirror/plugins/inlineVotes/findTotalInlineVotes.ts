import type { ExtendedVote } from '@packages/lib/votes/interfaces';
import type { MarkType, Node, Schema } from 'prosemirror-model';
import { findChildrenByMark, findChildrenByType } from 'prosemirror-utils';
import type { EditorView } from 'prosemirror-view';

export function findTotalInlineVotes(view: EditorView, node: Node, votes: Record<string, ExtendedVote>) {
  const inlineVoteMarkSchema = view.state.schema.marks['inline-vote'] as MarkType;
  const inlineVoteNodes = findChildrenByMark(node, inlineVoteMarkSchema);
  let totalInlineVotes = 0;
  // There is a possibility that multiple nodes can have the same voteId so use a set to capture only the unique ones
  const voteIds: Set<string> = new Set();
  for (const inlineVoteNode of inlineVoteNodes) {
    // Find the inline vote mark for the node
    const inlineVoteMark = inlineVoteNode.node.marks.find((mark) => mark.type.name === inlineVoteMarkSchema.name);
    // Only count the non-resolved votes
    if (inlineVoteMark) {
      const vote = votes[inlineVoteMark.attrs.id];
      if (vote && !voteIds.has(vote.id) && vote.status === 'InProgress') {
        totalInlineVotes += 1;
      }
      voteIds.add(inlineVoteMark.attrs.id);
    }
  }
  return { totalInlineVotes, voteIds: Array.from(voteIds) };
}

// find and group votes by paragraph and heading
export function extractInlineVoteRows(schema: Schema, node: Node): { pos: number; nodes: Node[] }[] {
  const inlineCommentMarkSchema = schema.marks['inline-vote'] as MarkType;
  const paragraphs = findChildrenByType(node, schema.nodes.paragraph);
  const headings = findChildrenByType(node, schema.nodes.heading);
  return headings
    .concat(paragraphs)
    .map((_node) => ({
      pos: _node.pos,
      nodes: findChildrenByMark(_node.node, inlineCommentMarkSchema)
        .map((nodeWithPos) => nodeWithPos.node)
        .filter((__node) => __node.marks[0].attrs.id && !__node.marks[0].attrs.resolved)
    }))
    .filter(({ nodes }) => nodes.length > 0);
}
