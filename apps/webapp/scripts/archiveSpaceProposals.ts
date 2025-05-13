import { prisma } from '@charmverse/core/prisma-client';
import { archiveProposals } from '@packages/lib/proposals/archiveProposals';
import { createBotUser } from 'lib/spaces/createBotUser';

const spaceDomain = '';

async function archiveSpaceProposals() {
  if (!spaceDomain) {
    throw new Error('Please set spaceDomain');
  }

  const space = await prisma.space.findUnique({ where: { domain: spaceDomain }, select: { id: true } });

  if (!space) {
    throw new Error(`Space with domain "${spaceDomain}" not found`);
  }

  const botUser = await prisma.spaceRole.findFirst({ where: { spaceId: space.id, user: { isBot: true } } });
  let actorId = botUser?.userId;

  if (!botUser) {
    const bot = await createBotUser(space.id);
    actorId = bot.id;
  }

  if (!actorId) {
    throw new Error(`Bot user for the space not found`);
  }

  const proposalsToArchive = await prisma.proposal.findMany({
    where: { archived: false, spaceId: space.id },
    select: { id: true }
  });

  console.log('🔥', 'Number of proposals to be archived:', proposalsToArchive.length);

  await archiveProposals({ archived: true, proposalIds: proposalsToArchive.map((p) => p.id), actorId });
}

archiveSpaceProposals().then(() => {
  console.log('🔥', 'done');
});
