import { log } from '@charmverse/core/log';
import type { ProjectSource } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-client';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';
import { generatePagePathFromPathAndTitle } from '@root/lib/pages/utils';
import { stringToValidPath, uid } from '@root/lib/utils/strings';
import { isTruthy } from '@root/lib/utils/types';
import { v4 } from 'uuid';

import type { FormValues } from './form';

export async function createOptimismProject({
  source,
  userId,
  input
}: {
  source: ProjectSource;
  input: FormValues;
  userId: string;
}) {
  const farcasterAccounts = await prisma.farcasterUser.findMany({
    where: {
      fid: {
        in: input.projectMembers.map(({ farcasterId }) => farcasterId)
      }
    },
    select: {
      userId: true,
      fid: true,
      account: true
    }
  });

  const farcasterAccountsRecord: Record<
    number,
    {
      userId: string;
      account: StatusAPIResponse;
    }
  > = farcasterAccounts.reduce<
    Record<
      number,
      {
        userId: string;
        account: StatusAPIResponse;
      }
    >
  >((acc, { fid, userId: _userId, account }) => {
    acc[fid] = {
      userId: _userId,
      account: account as unknown as StatusAPIResponse
    };
    return acc;
  }, {});

  const projectMembers = (
    await Promise.all(
      input.projectMembers.slice(1).map(async (member) => {
        if (farcasterAccountsRecord[member.farcasterId]) {
          return {
            userId: farcasterAccountsRecord[member.farcasterId].userId,
            name: farcasterAccountsRecord[member.farcasterId].account.displayName as string,
            farcasterId: member.farcasterId
          };
        }
        try {
          const [farcasterProfile] = await getFarcasterUsers({
            fids: [member.farcasterId]
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
            },
            select: {
              id: true
            }
          });

          if (farcasterWalletUser) {
            return {
              userId: farcasterWalletUser.id,
              name: farcasterProfile.display_name,
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
            name: displayName,
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
      source,
      projectMembers: {
        createMany: {
          data: [
            {
              teamLead: true,
              updatedBy: userId,
              userId,
              name: farcasterAccountsRecord[input.projectMembers[0].farcasterId].account.displayName as string,
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
