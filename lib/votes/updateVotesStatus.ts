import { prisma } from 'db';
import { ExtendedVote } from './interfaces';

export async function updateVotesStatus (pageVotes: ExtendedVote[]) {
  const pageVoteNewStatusRecord: Record<'Passed' | 'Rejected', string[]> = {
    Passed: [],
    Rejected: []
  };

  const updatedPageVote = pageVotes.map(pageVote => {
    let status = pageVote.status;
    const { deadline, userVotes, threshold } = pageVote;
    const totalVotes = userVotes.length;
    const userVoteFrequencyRecord = pageVote.userVotes.reduce<Record<string, number>>((currentRecord, userVote) => {
      if (!currentRecord[userVote.choice]) {
        currentRecord[userVote.choice] = 1;
      }
      else {
        currentRecord[userVote.choice] += 1;
      }
      return currentRecord;
    }, {});
    // Only update the vote if the deadline has passed
    if (status !== 'Cancelled' && new Date(deadline) < new Date()) {
      // If any of the option passed the threshold amount
      if (Object.values(userVoteFrequencyRecord).some(voteCount => ((voteCount / totalVotes) * 100) >= threshold)) {
        status = 'Passed';
        pageVoteNewStatusRecord.Passed.push(pageVote.id);
      }
      else {
        status = 'Rejected';
        pageVoteNewStatusRecord.Rejected.push(pageVote.id);
      }
    }
    return {
      ...pageVote
    };
  });

  await prisma.$transaction([
    prisma.vote.updateMany({
      where: {
        id: {
          in: pageVoteNewStatusRecord.Passed
        }
      },
      data: {
        status: 'Passed'
      }
    }),
    prisma.vote.updateMany({
      where: {
        id: {
          in: pageVoteNewStatusRecord.Rejected
        }
      },
      data: {
        status: 'Rejected'
      }
    })
  ]);

  return updatedPageVote;
}
