import type { UserVote, Vote } from '@charmverse/core/prisma';
import { VoteStatus, VoteType } from '@charmverse/core/prisma';

export function calculateVoteStatus({
  deadline,
  type,
  status,
  threshold,
  userVotes
}: {
  userVotes: Pick<UserVote, 'choices'>[];
  threshold: Vote['threshold'];
  status: Vote['status'];
  type: Vote['type'];
  deadline: Vote['deadline'];
}) {
  const userVoteFrequencyRecord = userVotes.reduce<Record<string, number>>((currentFrequencyRecord, userVote) => {
    const choices = userVote.choices;

    choices.forEach((choice) => {
      if (!currentFrequencyRecord[choice]) {
        currentFrequencyRecord[choice] = 1;
      } else {
        currentFrequencyRecord[choice] += 1;
      }
    });

    return currentFrequencyRecord;
  }, {});

  const totalVotes = userVotes.length;
  let voteStatus = status;

  if (new Date(deadline) < new Date() && Object.values(userVoteFrequencyRecord).length === 0) {
    voteStatus = VoteStatus.Cancelled;
  } else if (status !== VoteStatus.Cancelled && new Date(deadline) < new Date()) {
    if (type === VoteType.Approval) {
      voteStatus =
        (userVoteFrequencyRecord.Yes * 100) / totalVotes >= threshold ? VoteStatus.Passed : VoteStatus.Rejected;
    } // If any of the option passed the threshold amount
    else if (Object.values(userVoteFrequencyRecord).some((voteCount) => (voteCount / totalVotes) * 100 >= threshold)) {
      voteStatus = VoteStatus.Passed;
    } else {
      voteStatus = VoteStatus.Rejected;
    }
  }

  return voteStatus;
}
