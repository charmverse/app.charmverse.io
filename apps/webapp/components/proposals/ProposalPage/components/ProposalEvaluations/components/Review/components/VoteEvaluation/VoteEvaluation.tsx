import HowToVoteIcon from '@mui/icons-material/HowToVoteOutlined';
import { Tooltip, Typography } from '@mui/material';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import { useGetVotesForPage } from 'charmClient/hooks/votes';
import { NoCommentsMessage } from 'components/[pageId]/DocumentPage/components/Sidebar/components/CommentsSidebar';
import { Button } from 'components/common/Button';
import { VoteDetail } from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCharmEditorView } from 'hooks/useCharmEditorView';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from '@packages/lib/proposals/interfaces';

import { PublishToSnapshot } from './components/PublishToSnapshot/PublishToSnapshot';
import { SnapshotVoteDetails } from './components/SnapshotVoteDetails';

export type Props = {
  isCurrent: boolean;
  pageId: string;
  proposal: Pick<ProposalWithUsersAndRubric, 'id' | 'permissions' | 'archived'>;
  evaluation: PopulatedEvaluation;
  refreshProposal?: VoidFunction;
};

export function VoteEvaluation({ pageId, isCurrent, proposal, evaluation, refreshProposal }: Props) {
  const { data: votes, mutate: refreshVotes, isLoading } = useGetVotesForPage(pageId ? { pageId } : undefined);
  const { showMessage } = useSnackbar();
  const canSubmitVote = isCurrent && proposal.permissions.evaluate && !proposal.archived;
  const canCreateVote = isCurrent && proposal.permissions.create_vote && !proposal.archived;
  const vote = votes?.find((v) => v.id === evaluation.voteId);
  const hasVote = !!vote;
  const { view } = useCharmEditorView();

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

  function onPublishToSnapshot() {
    refreshProposal?.();
  }

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
    if (evaluation.snapshotId) {
      return <SnapshotVoteDetails snapshotProposalId={evaluation.snapshotId} />;
    } else if (evaluation.voteSettings?.strategy === 'snapshot') {
      return (
        <Tooltip
          title={!canCreateVote ? 'Only proposal authors and space admins can publish this proposal to snapshot' : ''}
        >
          <span>
            <PublishToSnapshot
              renderContent={({ label, onClick, icon }) => (
                <Button disabled={!canCreateVote} onClick={onClick}>
                  {icon}
                  <Typography>{label}</Typography>
                </Button>
              )}
              onPublish={onPublishToSnapshot}
              pageId={pageId!}
              evaluationId={evaluation.id}
              proposalId={proposal.id}
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

  if (evaluation.voteSettings?.strategy === 'snapshot') {
    return evaluation.snapshotId ? null : (
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
        message='Waiting for Snapshot vote...'
      />
    );
  }

  return (
    <VoteDetail
      castVote={castVote}
      updateDeadline={updateDeadline}
      vote={vote}
      detailed={false}
      isProposal={true}
      disableVote={!canSubmitVote}
      view={view}
    />
  );
}
