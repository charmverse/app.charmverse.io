import type { ProjectMember } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getENSName } from '@packages/blockchain/getENSName';
import { isProfilePathAvailable } from '@root/lib/profile/isProfilePathAvailable';
import { shortWalletAddress } from '@root/lib/utils/blockchain';
import { v4 as uuid } from 'uuid';

import type { ProjectAndMembersPayload } from './interfaces';

async function getOrCreateUserByWallet(walletAddress: string) {
  const user = await prisma.userWallet.findFirst({
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

  if (user) {
    return user.userId;
  }

  const ens = await getENSName(walletAddress);
  const userPath = shortWalletAddress(walletAddress).replace('…', '-');
  const isUserPathAvailable = await isProfilePathAvailable(userPath);

  const walletUser = await prisma.user.create({
    data: {
      username: ens ?? shortWalletAddress(walletAddress.toLowerCase()),
      identityType: 'Wallet',
      path: isUserPathAvailable ? userPath : uuid(),
      wallets: {
        create: {
          address: walletAddress.toLowerCase(),
          ensname: ens
        }
      },
      claimed: false
    }
  });

  return walletUser.id;
}

async function getOrCreateUserByEmail(email: string) {
  const googleAccount = await prisma.googleAccount.findFirst({
    where: {
      email
    },
    select: {
      userId: true
    }
  });

  if (googleAccount) {
    return googleAccount.userId;
  }

  const verifiedEmail = await prisma.verifiedEmail.findFirst({
    where: {
      email
    },
    select: {
      userId: true
    }
  });

  if (verifiedEmail) {
    return verifiedEmail.userId;
  }

  const user = await prisma.user.create({
    data: {
      username: email,
      claimed: false,
      path: uuid(),
      identityType: 'VerifiedEmail',
      email,
      verifiedEmails: {
        create: {
          email,
          avatarUrl: '',
          name: email
        }
      }
    }
  });

  return user.id;
}

export async function findCharmVerseUserIdWithProjectMember(
  projectMember: Partial<Pick<ProjectMember, 'walletAddress' | 'email'>>
) {
  const walletAddress = projectMember.walletAddress;
  const email = projectMember.email;

  let connectedUserId: string | undefined;

  if (!email && !walletAddress) {
    connectedUserId = undefined;
  } else if (walletAddress && !email) {
    connectedUserId = await getOrCreateUserByWallet(walletAddress);
  } else if (!walletAddress && email) {
    connectedUserId = await getOrCreateUserByEmail(email);
  } else if (walletAddress && email) {
    connectedUserId = await getOrCreateUserByWallet(walletAddress);
    if (!connectedUserId) {
      connectedUserId = await getOrCreateUserByEmail(email);
    }
  }

  return connectedUserId;
}

export function getProjectMemberCreateTransaction({
  projectId,
  projectMember,
  userId,
  connectedUserId
}: {
  projectId: string;
  userId: string;
  projectMember: ProjectAndMembersPayload['projectMembers'][number];
  connectedUserId?: string;
}) {
  return prisma.projectMember.create({
    data: {
      name: projectMember.name,
      email: projectMember.email,
      walletAddress: projectMember.walletAddress?.toLowerCase()?.trim(),
      socialUrls: projectMember.socialUrls,
      updatedBy: userId,
      projectId,
      userId: connectedUserId
    }
  });
}
