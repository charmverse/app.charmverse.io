import { EditorView, MarkType, Node } from '@bangle.dev/pm';
import { ExtendedVote } from 'lib/votes/interfaces';
import { findChildrenByMark } from 'prosemirror-utils';

export function findTotalInlineVotes (
  view:EditorView,
  node: Node,
  votes: Record<string, ExtendedVote>
) {
  const inlineVoteMarkSchema = view.state.schema.marks['inline-vote'] as MarkType;
  const inlineVoteNodes = findChildrenByMark(node, inlineVoteMarkSchema);
  let totalInlineVotes = 0;
  // There is a possibility that multiple nodes can have the same threadId so use a set to capture only the unique ones
  const voteIds: Set<string> = new Set();
  for (const inlineVoteNode of inlineVoteNodes) {
    // Find the inline vote mark for the node
    const inlineVoteMark = inlineVoteNode.node.marks.find(mark => mark.type.name === inlineVoteMarkSchema.name);
    // Only count the non-resolved votes
    if (inlineVoteMark /* && (!inlineCommentMark.attrs.resolved) */) {
      const vote = votes[inlineVoteMark.attrs.id];
      if (vote && !voteIds.has(vote.id)) {
        totalInlineVotes += 1;
      }
      voteIds.add(inlineVoteMark.attrs.id);
    }
  }
  return { totalInlineVotes, voteIds: Array.from(voteIds) };
}
