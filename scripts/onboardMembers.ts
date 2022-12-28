import { prisma } from 'db';

async function onboardMembers () {
  await prisma.spaceRole.updateMany({
    data: {
      onboarded: true
    }
  });
}

onboardMembers();
