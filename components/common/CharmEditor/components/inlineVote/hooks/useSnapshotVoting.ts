import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { getSnapshotProposal, getUserProposalVotes } from 'lib/snapshot';
import { getVotingPower } from 'lib/snapshot/getVotingPower';
import type { SnapshotProposal } from 'lib/snapshot/interfaces';
import { coerceToMilliseconds, relativeTime } from 'lib/utilities/dates';

export function useSnapshotVoting({ snapshotProposalId }: { snapshotProposalId: string }) {
  const { account } = useWeb3AuthSig();
  const { space } = useCurrentSpace();
  const snapshotSpaceDomain = space?.domain;
  const [userVoteChoice, setUserVoteChoice] = useState(0);

  const { data: snapshotProposal } = useSWR<SnapshotProposal | null>(`/snapshotProposal/${snapshotProposalId}`, () =>
    getSnapshotProposal(snapshotProposalId)
  );

  const { data: userVotes } = useSWR(account && snapshotSpaceDomain ? `snapshotUserVotes-${account}` : null, () =>
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

  useEffect(() => {
    if (userVotes?.length) {
      setUserVoteChoice(userVotes[0].choice);
    }
  }, [userVotes]);

  return {
    snapshotProposal,
    userVotes,
    userVotingPower,
    isVotingActive,
    votingPower,
    remainingTime,
    hasPassedDeadline,
    proposalEndDate,
    userVoteChoice,
    setUserVoteChoice,
    votingDisabledStatus: getVotingDisabledStatus({ account, votingPower, isVotingActive })
  };
}

function getVotingDisabledStatus({
  account,
  votingPower,
  isVotingActive
}: {
  account?: string | null;
  votingPower: number;
  isVotingActive: boolean;
}) {
  if (!account) {
    return 'You need to connect your wallet to vote on snapshot proposals.';
  }

  if (!votingPower) {
    return 'You do not have voting power to vote on this proposal.';
  }

  if (!isVotingActive) {
    return 'Voting is not active for this proposal.';
  }

  return null;
}
