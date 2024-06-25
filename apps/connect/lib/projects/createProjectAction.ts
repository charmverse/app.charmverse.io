'use server';

import { prisma } from '@charmverse/core/prisma-client';

import type { FormValues } from 'components/projects/utils/form';
import { schema } from 'components/projects/utils/form';
import { authActionClient } from 'lib/actions/actionClient';
import { isTruthy } from 'lib/utils/type';

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
  .schema(schema)
  .metadata({ actionName: 'create-project' })
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput as FormValues;
    const currentUserId = ctx.session.user!.id;
    const farcasterAccounts = await prisma.farcasterUser.findMany({
      where: {
        fid: {
          in: input.projectMembers.slice(1).map(({ farcasterId }) => farcasterId)
        }
      },
      select: {
        userId: true,
        fid: true
      }
    });

    const farcasterAccountsUserIdRecord: Record<number, string> = farcasterAccounts.reduce<Record<number, string>>(
      (acc, { userId, fid }) => {
        acc[fid] = userId;
        return acc;
      },
      {}
    );

    await prisma.project.create({
      data: {
        name: input.name,
        updatedBy: currentUserId,
        createdBy: currentUserId,
        description: input.description,
        category: input.category,
        websites: input.websites?.filter(isTruthy),
        farcasterIds: input.farcasterIds?.filter(isTruthy),
        twitter: input.twitter,
        github: input.github,
        mirror: input.mirror,
        avatar: input.avatar,
        coverImage: input.cover,
        source: 'connect',
        projectMembers: {
          createMany: {
            data: [
              {
                teamLead: true,
                updatedBy: currentUserId,
                userId: currentUserId,
                name: input.projectMembers[0].name,
                farcasterId: input.projectMembers[0].farcasterId
              },
              ...input.projectMembers.slice(1).map((member) => ({
                teamLead: false,
                updatedBy: currentUserId,
                userId: farcasterAccountsUserIdRecord[member.farcasterId] ?? undefined,
                name: member.name,
                farcasterId: member.farcasterId
              }))
            ]
          }
        }
      }
    });
  });
