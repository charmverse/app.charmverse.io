import { prisma } from "@charmverse/core/prisma-client";
import { ensureFarcasterUserExists } from "@root/lib/farcaster/ensureFarcasterUserExists";

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
    const farcasterUser = await ensureFarcasterUserExists({fid: member.farcasterId as number});

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
}

fixProjectMembers();