import { prisma } from '@charmverse/core/prisma-client';

import { getENSName } from 'lib/blockchain';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { shortWalletAddress } from 'lib/utils/blockchain';
import { uid } from 'lib/utils/strings';

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

  if (email) {
    const googleAccount = await prisma.googleAccount.findFirst({
      where: {
        email
      },
      select: {
        userId: true
      }
    });
    connectedUserId = googleAccount?.userId;

    if (!connectedUserId) {
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

  if (!connectedUserId && walletAddress) {
    const userWallet = await prisma.userWallet.findFirst({
      where: {
        OR: [
          {
            address: walletAddress.toLowerCase()
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

    if (userWallet) {
      connectedUserId = userWallet.userId;
    } else {
      const ens = await getENSName(walletAddress);
      const userPath = shortWalletAddress(walletAddress).replace('…', '-');
      const isUserPathAvailable = await isProfilePathAvailable(userPath);

      const walletUser = await prisma.user.create({
        data: {
          username: ens ?? shortWalletAddress(walletAddress.toLowerCase()),
          identityType: 'Wallet',
          path: isUserPathAvailable ? userPath : uid(),
          wallets: {
            create: {
              address: walletAddress.toLowerCase(),
              ensname: ens
            }
          },
          claimed: false
        }
      });
      connectedUserId = walletUser.id;
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
