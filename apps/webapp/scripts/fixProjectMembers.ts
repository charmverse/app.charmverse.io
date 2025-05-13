import { prisma } from '@charmverse/core/prisma-client';
import { ensureFarcasterUserExists } from '@packages/lib/farcaster/ensureFarcasterUserExists';
import { sleep } from '@packages/lib/utils/sleep';

async function fixProjectMembers() {
  const projectMembersWithoutUser = await prisma.projectMember.findMany({
    where: {
      userId: null,
      project: {
        source: 'sunny_awards'
      }
    }
  });

  for (const member of projectMembersWithoutUser) {
    const farcasterUser = await ensureFarcasterUserExists({ fid: member.farcasterId as number });

    await prisma.projectMember.update({
      where: {
        id: member.id
      },
      data: {
        userId: farcasterUser.userId
      }
    });
  }

  console.log('Fixed project members', projectMembersWithoutUser.length);

  await sleep(10000);

  return fixProjectMembers();
}

// fixProjectMembers();
