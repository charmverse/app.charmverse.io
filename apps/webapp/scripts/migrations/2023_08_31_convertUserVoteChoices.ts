// @ts-nocheck

import { prisma } from '@charmverse/core/prisma-client';

async function convertUserVoteChoices() {
  const userVotes = await prisma.userVote.findMany({});

  for (const userVote of userVotes) {
    await prisma.userVote.update({
      where: {
        voteId_userId: {
          userId: userVote.userId,
          voteId: userVote.voteId
        }
      },
      data: {
        choices: userVote.choice && userVote.choices.length === 0 ? [userVote.choice] : userVote.choices,
        choice: null
      }
    });
  }
}

convertUserVoteChoices().then(() => console.log('done'));
