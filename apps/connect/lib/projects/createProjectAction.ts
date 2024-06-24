'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { authActionClient } from 'lib/actions/actionClient';

export type FarcasterAccount = {
  id: number;
  address: string;
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  avatarUrl: string;
  isVerifiedAvatar: boolean;
  registeredAt: number;
};

export const actionCreateProject = authActionClient
  .metadata({ actionName: 'create-project' })
  .action(async ({ ctx }) => {
    const formData = ctx.clientInput as FormData;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const avatar = formData.get('avatar') as string;
    const coverImage = formData.get('cover') as string;
    const websites = formData.getAll('websites') as string[];
    const farcasterIds = formData.getAll('farcasterIds') as string[];
    const twitter = formData.get('twitter') as string;
    const github = formData.get('github') as string;
    const mirror = formData.get('mirror') as string;
    const userId = ctx.session.user!.id;
    const farcasterUser = await prisma.farcasterUser.findUniqueOrThrow({
      where: {
        userId
      },
      select: {
        account: true
      }
    });

    const farcasterUserAccount = farcasterUser.account as FarcasterAccount;
    await prisma.project.create({
      data: {
        name,
        updatedBy: userId,
        createdBy: userId,
        description,
        category,
        websites,
        farcasterIds,
        twitter,
        github,
        mirror,
        avatar,
        coverImage,
        projectMembers: {
          createMany: {
            data: [
              {
                teamLead: true,
                updatedBy: userId,
                userId,
                name: farcasterUserAccount.displayName,
                walletAddress: farcasterUserAccount.address
              }
            ]
          }
        }
      }
    });
  });
