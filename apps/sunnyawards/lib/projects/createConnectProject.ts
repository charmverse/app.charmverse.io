import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';
import { generatePagePathFromPathAndTitle } from '@root/lib/pages/utils';
import { stringToValidPath, uid } from '@root/lib/utils/strings';
import { isTruthy } from '@root/lib/utils/types';
import { v4 } from 'uuid';

import type { FormValues } from './form';

export async function createConnectProject({ userId, input }: { input: FormValues; userId: string }) {
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
    (acc, { userId: _userId, fid }) => {
      acc[fid] = _userId;
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
          const [farcasterProfile] = await getFarcasterUsers({
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
                    in: [
                      farcasterProfile.custody_address,
                      ...(farcasterProfile.verified_addresses ? farcasterProfile.verified_addresses.eth_addresses : [])
                    ].map((address) => address.toLowerCase())
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
          const username = farcasterProfile.username;
          const displayName = farcasterProfile.display_name;
          const bio = farcasterProfile.profile.bio.text;
          const pfpUrl = farcasterProfile.pfp_url;
          const fid = member.farcasterId;

          const newUser = await prisma.user.create({
            data: {
              id: v4(),
              username,
              identityType: 'Farcaster',
              claimed: false,
              avatar: farcasterProfile.pfp_url,
              farcasterUser: {
                create: {
                  account: { username, displayName, bio, pfpUrl },
                  fid
                }
              },
              path: uid(),
              profile: {
                create: {
                  ...(bio && { description: bio || '' })
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
          log.error('Error creating user', {
            fid: member.farcasterId,
            err
          });
          return null;
        }
      })
    )
  ).filter(isTruthy);

  let path = stringToValidPath({ input: input.name ?? '', wordSeparator: '-', autoReplaceEmpty: false });

  const existingProjectWithPath = await prisma.project.findFirst({
    where: {
      path
    },
    select: {
      id: true
    }
  });

  if (existingProjectWithPath) {
    path = generatePagePathFromPathAndTitle({
      title: input.name,
      existingPagePath: path
    });
  }

  const project = await prisma.project.create({
    data: {
      name: input.name,
      path,
      updatedBy: userId,
      createdBy: userId,
      description: input.description,
      category: input.category,
      websites: input.websites?.filter(isTruthy),
      farcasterValues: input.farcasterValues?.filter(isTruthy),
      twitter: input.twitter,
      github: input.github,
      mirror: input.mirror,
      avatar: input.avatar,
      coverImage: input.coverImage,
      source: 'connect',
      projectMembers: {
        createMany: {
          data: [
            {
              teamLead: true,
              updatedBy: userId,
              userId,
              name: input.projectMembers[0].name,
              farcasterId: input.projectMembers[0].farcasterId
            },
            ...projectMembers.map((member) => ({
              teamLead: false,
              updatedBy: userId,
              userId: member.userId,
              name: member.name,
              farcasterId: member.farcasterId
            }))
          ]
        }
      }
    }
  });

  return project;
}
