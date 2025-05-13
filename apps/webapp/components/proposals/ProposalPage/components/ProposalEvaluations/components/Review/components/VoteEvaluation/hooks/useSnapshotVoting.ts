import useSWR from 'swr';
import { getAddress } from 'viem';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { getSnapshotProposal } from '@packages/lib/snapshot/getProposal';
import { getSnapshotClient } from '@packages/lib/snapshot/getSnapshotClient';
import { getUserProposalVotes } from '@packages/lib/snapshot/getVotes';
import { getVotingPower } from '@packages/lib/snapshot/getVotingPower';
import type { SnapshotProposal, VoteChoice } from '@packages/lib/snapshot/interfaces';
import { coerceToMilliseconds, relativeTime } from '@packages/lib/utils/dates';
import { sleep } from '@packages/lib/utils/sleep';

export type CastVote = (vote: VoteChoice) => Promise<void>;

export function useSnapshotVoting({ snapshotProposalId }: { snapshotProposalId: string }) {
  const { account, provider } = useWeb3Account();
  const { space } = useCurrentSpace();
  const snapshotSpaceDomain = space?.snapshotDomain;

  const { data: snapshotProposal, mutate: refreshProposal } = useSWR<SnapshotProposal | null>(
    `/snapshotProposal/${snapshotProposalId}`,
    () => getSnapshotProposal(snapshotProposalId)
  );

  const { data: userVotes, mutate: refreshVotes } = useSWR(
    account && snapshotSpaceDomain ? `snapshotUserVotes-${account}` : null,
    () =>
      getUserProposalVotes({
        walletAddress: account as string,
        snapshotProposalId
      })
  );

  const { data: userVotingPower } = useSWR(
    account ? `snapshotUserVotingPower-${account}-${snapshotSpaceDomain}` : null,
    () => getVotingPower({ walletAddress: account!, snapshotProposalId, snapshotSpaceDomain: snapshotSpaceDomain! })
  );

  const votingPower = userVotingPower?.vp || 0;
  const proposalEndDate = coerceToMilliseconds(snapshotProposal?.end ?? 0);
  const isVotingActive = snapshotProposal?.state === 'active' && Date.now() < proposalEndDate;
  const hasPassedDeadline = proposalEndDate < Date.now();
  const remainingTime = relativeTime(proposalEndDate);

  const castSnapshotVote: CastVote = async (choice: VoteChoice) => {
    if (!snapshotProposal || !snapshotSpaceDomain || !account || !provider) {
      return;
    }

    const client = await getSnapshotClient();
    const vote = {
      space: snapshotSpaceDomain,
      proposal: snapshotProposalId,
      type: snapshotProposal.type,
      choice,
      reason: '',
      app: 'my-app'
    };

    await client.vote(provider, getAddress(account as string), vote);
    // we need this delay for vote to be propagated to the graph
    await sleep(5000);
    // workaround - fetch one more time with delay, sometimes it takes more time to get updated value
    setTimeout(() => {
      refreshProposal();
      refreshVotes();
    }, 5000);

    refreshProposal();
    refreshVotes();
  };

  return {
    snapshotProposal,
    userVotes,
    userVotingPower,
    isVotingActive,
    votingPower,
    remainingTime,
    hasPassedDeadline,
    proposalEndDate,
    castSnapshotVote,
    votingDisabledStatus: getVotingDisabledStatus({ account, votingPower, isVotingActive })
  };
}

type VotingDisabledReason = 'account' | 'no_vote_power' | 'vote_inactive';

function getVotingDisabledStatus({
  account,
  votingPower,
  isVotingActive
}: {
  account?: string | null;
  votingPower: number;
  isVotingActive: boolean;
}): null | { reason: VotingDisabledReason; message: string } {
  if (!account) {
    return {
      reason: 'account',
      message: 'You need to connect your wallet to vote on snapshot proposals.'
    };
  }

  if (!votingPower) {
    return {
      reason: 'no_vote_power',
      message: 'You do not have voting power to vote on this proposal.'
    };
  }

  if (!isVotingActive) {
    return {
      reason: 'vote_inactive',
      message: 'Voting is not active for this proposal.'
    };
  }

  return null;
}
