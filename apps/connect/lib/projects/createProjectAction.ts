'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { redirect } from 'next/navigation';
import { v4 } from 'uuid';

import type { FormValues } from 'components/projects/utils/form';
import { schema } from 'components/projects/utils/form';
import { authActionClient } from 'lib/actions/actionClient';
import { getFarcasterProfile } from 'lib/farcaster/getFarcasterUser';
import { uid } from 'lib/utils/strings';
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

    const projectMembers = (
      await Promise.all(
        input.projectMembers.slice(1).map(async (member) => {
          if (farcasterAccountsUserIdRecord[member.farcasterId]) {
            return {
              userId: farcasterAccountsUserIdRecord[member.farcasterId],
              name: member.name,
              farcasterId: member.farcasterId
            };
          }
          try {
            const farcasterProfile = await getFarcasterProfile({
              fid: member.farcasterId
            });
            if (!farcasterProfile) {
              return null;
            }
            const farcasterWalletUser = await prisma.user.findFirst({
              where: {
                wallets: {
                  some: {
                    address: {
                      in: farcasterProfile.connectedAddresses.map((address) => address.toLowerCase())
                    }
                  }
                }
              }
            });
            if (farcasterWalletUser) {
              return {
                userId: farcasterWalletUser.id,
                name: member.name,
                farcasterId: member.farcasterId
              };
            }
            const username = farcasterProfile.body.username;
            const displayName = farcasterProfile.body.displayName;
            const bio = farcasterProfile.body.bio;
            const pfpUrl = farcasterProfile.body.avatarUrl;
            const fid = member.farcasterId;

            const newUser = await prisma.user.create({
              data: {
                id: v4(),
                username,
                identityType: 'Farcaster',
                claimed: false,
                avatar: farcasterProfile.body.avatarUrl,
                farcasterUser: {
                  create: {
                    account: { username, displayName, bio, pfpUrl },
                    fid
                  }
                },
                path: uid(),
                profile: {
                  create: {
                    ...(bio && { description: bio || '' }),
                    social: {
                      farcasterUrl: `https://warpcast.com/${username}`
                    }
                  }
                }
              }
            });

            return {
              userId: newUser.id,
              name: member.name,
              farcasterId: member.farcasterId
            };
          } catch (err) {
            return null;
          }
        })
      )
    ).filter(isTruthy);

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
              ...projectMembers.map((member) => ({
                teamLead: false,
                updatedBy: currentUserId,
                userId: member.userId,
                name: member.name,
                farcasterId: member.farcasterId
              }))
            ]
          }
        }
      }
    });

    redirect('/projects');
  });
