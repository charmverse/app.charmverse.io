import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { FormatListBulleted } from '@mui/icons-material';
import { Box, ListItem, Typography } from '@mui/material';
import type { HTMLAttributes } from 'react';
import { useState } from 'react';

import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import { useVotes } from 'hooks/useVotes';
import type { ExtendedVote } from 'lib/votes/interfaces';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import VoteDetail from '../inlineVote/components/VoteDetail';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

const StyledEmptyPollContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

export function PollNodeView({ node, readOnly, updateAttrs, selected, deleteNode }: CharmNodeViewProps) {
  const { pollId } = node.attrs as { pollId: string | null };
  const { votes, cancelVote, castVote, deleteVote } = useVotes();
  const [showModal, setShowModal] = useState(false);

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
      <MediaSelectionPopup
        node={node}
        icon={<FormatListBulleted fontSize='small' />}
        buttonText='Add a poll'
        isSelected={selected}
        onDelete={deleteNode}
      >
        <CreateVoteModal
          onClose={() => {
            setShowModal(false);
          }}
          onCreateVote={onCreateVote}
        />
      </MediaSelectionPopup>
    );
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
