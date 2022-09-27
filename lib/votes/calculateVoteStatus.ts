import type { UserVote, Vote } from '@prisma/client';
import { VoteStatus, VoteType } from '@prisma/client';

export function calculateVoteStatus ({ deadline, type, status, threshold, userVotes }:{ userVotes: Pick<UserVote, 'choice'>[], threshold: Vote['threshold'], status: Vote['status'], type: Vote['type'], deadline: Vote['deadline'] }) {
  const userVoteFrequencyRecord = userVotes.reduce<Record<string, number>>((currentFrequencyRecord, userVote) => {
    if (!currentFrequencyRecord[userVote.choice]) {
      currentFrequencyRecord[userVote.choice] = 1;
    }
    else {
      currentFrequencyRecord[userVote.choice] += 1;
    }
    return currentFrequencyRecord;
  }, {});

  const totalVotes = userVotes.length;
  let voteStatus = status;

  if (status !== VoteStatus.Cancelled && new Date(deadline) < new Date()) {
    if (type === VoteType.Approval) {
      voteStatus = ((userVoteFrequencyRecord.Yes * 100) / totalVotes) >= threshold ? VoteStatus.Passed : VoteStatus.Rejected;
    } // If any of the option passed the threshold amount
    else if (Object.values(userVoteFrequencyRecord).some(voteCount => ((voteCount / totalVotes) * 100) >= threshold)) {
      voteStatus = VoteStatus.Passed;
    }
    else {
      voteStatus = VoteStatus.Rejected;
    }
  }

  return voteStatus;
}
