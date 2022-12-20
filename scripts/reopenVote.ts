
import { prisma } from 'db'
import { strict as assert } from 'node:assert';

async function reopenProposal (path: string, newDate: Date) {
  const spaceDomain = path.split('/')[0];
  const spacePagePath = path.split('/')[1];
  const space = await prisma.space.findFirstOrThrow({
    where: {
      domain: spaceDomain
    }
  });

  const page = await prisma.page.findFirstOrThrow({
    where: {
      spaceId: space.id,
      path: spacePagePath
    },
    include: {
      votes: true
    }
  });
  const vote = page.votes[0];
  assert(vote, 'Vote not found');
  console.log('Vote found', vote.id, vote.deadline, vote.status);

  await prisma.vote.update({
    where: {
      id: page.votes[0].id
    },
    data: {
      deadline: newDate,
      status: 'InProgress'
    }
  });
}

reopenProposal('story-dao/page-04742242151671694', new Date(2022, 11, 21, 21 ));
reopenProposal('story-dao/page-08009722798423935', new Date(2022, 11, 21, 23 ));