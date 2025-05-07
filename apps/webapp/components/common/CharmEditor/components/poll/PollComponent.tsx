import { FormatListBulleted } from '@mui/icons-material';
import { useState } from 'react';

import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import LoadingComponent from 'components/common/LoadingComponent';
import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';
import { usePostPermissions } from 'hooks/usePostPermissions';
import { useVotes } from 'hooks/useVotes';
import type { ExtendedVote } from '@packages/lib/votes/interfaces';

import { EmptyEmbed } from '../common/EmptyEmbed';
import { VoteDetail } from '../inlineVote/components/VoteDetail';
import { VotesWrapper } from '../inlineVote/components/VotesWrapper';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

export function PollNodeView({
  node,
  pageId,
  postId,
  readOnly,
  updateAttrs,
  pagePermissions,
  selected,
  deleteNode
}: CharmNodeViewProps) {
  const { pollId } = node.attrs as { pollId: string | null };
  const { votes, cancelVote, castVote, deleteVote, isLoading, updateDeadline } = useVotes({
    pageId,
    postId
  });

  const view = useEditorViewContext();
  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');

  const postPermissions = usePostPermissions({
    postIdOrPath: pollId ? votes[pollId]?.postId : (null as any)
  });

  const [showModal, setShowModal] = useState(autoOpen);

  function onCreateVote(vote: ExtendedVote) {
    updateAttrs({
      pollId: vote.id
    });
    setShowModal(false);
  }

  if (!pollId) {
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
          pageId={pageId}
          postId={postId}
        />
        <div
          onClick={() => {
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
  } else if (isLoading) {
    if (readOnly) {
      return <div />;
    }

    return (
      <VotesWrapper>
        <LoadingComponent />
      </VotesWrapper>
    );
  } else if (votes[pollId]) {
    return (
      <VoteDetail
        cancelVote={cancelVote}
        castVote={castVote}
        deleteVote={deleteVote}
        detailed={false}
        // This makes sure that if something goes wrong in loading state, we won't stop users who should be able to vote from voting
        disableVote={(pagePermissions && !pagePermissions.comment) || (postPermissions && !postPermissions.add_comment)}
        vote={votes[pollId]}
        updateDeadline={updateDeadline}
        view={view}
      />
    );
  }

  // If the poll id in the node attribute doesn't point to any vote, return an empty div
  return <div />;
}
