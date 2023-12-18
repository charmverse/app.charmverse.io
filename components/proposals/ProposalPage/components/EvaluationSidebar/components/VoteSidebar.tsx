import HowToVoteIcon from '@mui/icons-material/HowToVote';

import charmClient from 'charmClient';
import { useGetVotesForPage } from 'charmClient/hooks/votes';
import { NoCommentsMessage } from 'components/[pageId]/DocumentPage/components/Sidebar/components/CommentsSidebar';
import { VoteDetail } from 'components/common/CharmEditor/components/inlineVote/components/VoteDetail';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProposalWithUsersAndRubric, PopulatedEvaluation } from 'lib/proposal/interface';

export type Props = {
  isCurrent: boolean;
  pageId?: string;
  proposal?: Pick<ProposalWithUsersAndRubric, 'id' | 'permissions'>;
  evaluation: PopulatedEvaluation;
};

export function VoteSidebar({ pageId, isCurrent, proposal, evaluation }: Props) {
  const { data: votes, mutate: refreshVotes, isLoading } = useGetVotesForPage(pageId ? { pageId } : undefined);
  const { showMessage } = useSnackbar();
  const isReviewer = isCurrent && proposal?.permissions.evaluate;

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

  if (isLoading) {
    return <LoadingComponent minHeight={200} />;
  }
  const vote = votes?.find((v) => v.id === evaluation.voteId);

  if (!vote) {
    return (
      <NoCommentsMessage
        icon={
          <HowToVoteIcon
            fontSize='large'
            color='secondary'
            sx={{
              height: '2em',
              width: '2em'
            }}
          />
        }
        message='Vote has not been initiated yet'
      />
    );
  }

  vote.title = evaluation.title;

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
