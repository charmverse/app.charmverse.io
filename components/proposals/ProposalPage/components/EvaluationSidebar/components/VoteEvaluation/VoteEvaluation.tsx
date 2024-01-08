import HowToVoteIcon from '@mui/icons-material/HowToVoteOutlined';
import { Stack, Tooltip, Typography } from '@mui/material';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { useGetVotesForPage } from 'charmClient/hooks/votes';
import { NoCommentsMessage } from 'components/[pageId]/DocumentPage/components/Sidebar/components/CommentsSidebar';
import { Button } from 'components/common/Button';
import { VoteDetail } from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';

import { PublishToSnapshot } from './components/PublishToSnapshot/PublishToSnapshot';
import { SnapshotVoteDetails } from './components/SnapshotVoteDetails';

export type Props = {
  isCurrent: boolean;
  pageId: string;
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'permissions'>;
  evaluation: PopulatedEvaluation;
};

export function VoteEvaluation({ pageId, isCurrent, proposal, evaluation }: Props) {
  const { data: votes, mutate: refreshVotes, isLoading } = useGetVotesForPage(pageId ? { pageId } : undefined);
  const { showMessage } = useSnackbar();
  const isReviewer = isCurrent && proposal?.permissions.evaluate;
  const vote = votes?.find((v) => v.id === evaluation.voteId);
  const hasVote = !!vote;

  async function castVote(voteId: string, choices: string[]) {
    try {
      await charmClient.votes.castVote(voteId, choices);
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    await refreshVotes();
  }

  async function updateDeadline(voteId: string, deadline: Date) {
    try {
      await charmClient.votes.updateVote(voteId, { deadline });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    await refreshVotes();
  }

  function onPublishToSnapshot() {}

  useEffect(() => {
    if (!hasVote && isCurrent) {
      // retrieve vote if this status becomes active
      refreshVotes();
    }
  }, [hasVote, isCurrent, refreshVotes]);

  if (isLoading) {
    return <LoadingComponent minHeight={200} />;
  }

  if (!vote) {
    if (evaluation.voteSettings?.publishToSnapshot) {
      return (
        <Tooltip
          title={!isReviewer ? 'Only proposal authors and space admins can publish this proposal to snapshot' : ''}
        >
          <span>
            <PublishToSnapshot
              renderContent={({ label, onClick, icon }) => (
                <Button disabled={!isReviewer} onClick={onClick}>
                  {icon}
                  <Typography>{label}</Typography>
                </Button>
              )}
              onPublish={onPublishToSnapshot}
              pageId={pageId!}
              evaluationId={evaluation.id}
              proposalId={proposal!.id}
              snapshotProposalId={evaluation.snapshotId}
            />
          </span>
        </Tooltip>
      );
    }
    return (
      <NoCommentsMessage
        icon={
          <HowToVoteIcon
            fontSize='large'
            color='secondary'
            sx={{
              height: '2em',
              width: '100%'
            }}
          />
        }
        message='Vote has not been initiated yet'
      />
    );
  }

  vote.title = evaluation.title;

  if (evaluation.snapshotId) {
    return <SnapshotVoteDetails snapshotProposalId={evaluation.snapshotId} />;
  }

  return (
    <VoteDetail
      castVote={castVote}
      updateDeadline={updateDeadline}
      vote={vote}
      detailed={false}
      isProposal={true}
      disableVote={!isReviewer}
    />
  );
}
