import type { User } from '@prisma/client';

import { prisma } from 'db';
import randomName from 'lib/utilities/randomName';

export async function addUserGoogleAccount({
  userId,
  avatarUrl = '',
  name = '',
  email
}: {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  await prisma.googleAccount.create({
    data: {
      name,
      avatarUrl,
      email,
      user: {
        connect: {
          id: userId
        }
      }
    }
  });
}

export function addUserWallet({ userId, address }: { userId: string; address: string }) {
  return prisma.userWallet.create({
    data: {
      userId,
      address
    }
  });
}

type GenerateUserInput = {
  verifiedEmail?: string;
};

export function generateUser(input?: GenerateUserInput): Promise<User> {
  return prisma.user.create({
    data: {
      username: randomName(),
      identityType: 'RandomName',
      verifiedEmails: input?.verifiedEmail
        ? {
            create: {
              email: input.verifiedEmail,
              name: input.verifiedEmail,
              avatarUrl: 'https://example.com/image.png'
            }
          }
        : undefined
    }
  });
}
