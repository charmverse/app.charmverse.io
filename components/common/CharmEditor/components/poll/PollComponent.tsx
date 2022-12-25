import { Typography } from '@mui/material';

import { useVotes } from 'hooks/useVotes';

import VoteDetail from '../inlineVote/components/VoteDetail';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

export default function PollNodeView({ node }: CharmNodeViewProps) {
  const { pollId } = node.attrs as { pollId: string | null };
  const { votes, cancelVote, castVote, deleteVote } = useVotes();

  if (!pollId || !votes[pollId]) {
    return <Typography>Vote not found</Typography>;
  }

  return (
    <VoteDetail
      cancelVote={cancelVote}
      castVote={castVote}
      deleteVote={deleteVote}
      detailed={false}
      vote={votes[pollId]}
    />
  );
}
