import { FormatListBulleted } from '@mui/icons-material';
import { useState } from 'react';

import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';
import { useVotes } from 'hooks/useVotes';
import type { ExtendedVote } from 'lib/votes/interfaces';

import { EmptyEmbed } from '../common/EmptyEmbed';
import { VoteDetail } from '../inlineVote/components/VoteDetail';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

export function PollNodeView({ node, readOnly, updateAttrs, selected, deleteNode }: CharmNodeViewProps) {
  const { pollId } = node.attrs as { pollId: string | null };
  const { votes, cancelVote, castVote, deleteVote, updateDeadline } = useVotes();

  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');

  const [showModal, setShowModal] = useState(autoOpen);

  function onCreateVote(vote: ExtendedVote) {
    updateAttrs({
      pollId: vote.id
    });
    setShowModal(false);
  }
  if (!pollId || !votes[pollId]) {
    if (readOnly) {
      return <div />;
    }
    return (
      <>
        <CreateVoteModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
          }}
          onCreateVote={onCreateVote}
        />
        <div
          onClick={(e) => {
            // e.stopPropagation();
            // e.preventDefault();
            setShowModal(true);
          }}
        >
          <EmptyEmbed
            buttonText='Add a poll'
            icon={<FormatListBulleted fontSize='small' />}
            isSelected={selected}
            onDelete={deleteNode}
          />
        </div>
      </>
    );
  }

  return (
    <VoteDetail
      cancelVote={cancelVote}
      castVote={castVote}
      deleteVote={deleteVote}
      detailed={false}
      vote={votes[pollId]}
      updateDeadline={updateDeadline}
    />
  );
}
