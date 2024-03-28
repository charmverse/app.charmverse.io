import { prisma } from '@charmverse/core/prisma-client';

import type { ProjectValues } from './interfaces';

export async function getProjectMemberCreateTransaction({
  projectId,
  projectMember,
  userId
}: {
  projectId: string;
  userId: string;
  projectMember: ProjectValues['projectMembers'][number];
}) {
  const walletAddress = projectMember.walletAddress ?? '';
  const email = projectMember.email ?? '';

  let connectedUserId: string | undefined;

  if (walletAddress) {
    const userWallet = await prisma.userWallet.findFirst({
      where: {
        OR: [
          {
            address: walletAddress
          },
          {
            ensname: walletAddress
          }
        ]
      },
      select: {
        userId: true
      }
    });

    connectedUserId = userWallet?.userId;
  } else if (email) {
    const googleAccount = await prisma.googleAccount.findFirst({
      where: {
        email
      },
      select: {
        userId: true
      }
    });
    connectedUserId = googleAccount?.userId;

    if (!userId) {
      const verifiedEmail = await prisma.verifiedEmail.findFirst({
        where: {
          email
        },
        select: {
          userId: true
        }
      });
      connectedUserId = verifiedEmail?.userId;
    }
  }

  return () =>
    prisma.projectMember.create({
      data: {
        name: projectMember.name,
        email: projectMember.email ?? '',
        walletAddress: projectMember.walletAddress ?? '',
        twitter: projectMember.twitter,
        warpcast: projectMember.warpcast,
        github: projectMember.github,
        linkedin: projectMember.linkedin,
        telegram: projectMember.telegram,
        otherUrl: projectMember.otherUrl,
        previousProjects: projectMember.previousProjects,
        updatedBy: userId,
        projectId,
        userId: connectedUserId
      }
    });
}
