import { SingleChoiceVoting } from 'components/proposals/components/SnapshotVoting/SingleChoiceVoting';
import type { SnapshotProposal, SnapshotVote } from 'lib/snapshot';

type Props = {
  snapshotProposal: SnapshotProposal;
  votingPower: number;
  userVotes: SnapshotVote[] | undefined;
};

export function SnapshotVotingForm(props: Props) {
  return <SingleChoiceVoting {...props} />;
}
