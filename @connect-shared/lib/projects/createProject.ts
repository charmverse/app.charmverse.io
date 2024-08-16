import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { OptionalPrismaTransaction, Project, ProjectSource } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-client';
import { resolveENSName } from '@root/lib/blockchain';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';
import { generatePagePathFromPathAndTitle } from '@root/lib/pages/utils';
import { stringToValidPath, uid } from '@root/lib/utils/strings';
import { isTruthy } from '@root/lib/utils/types';
import { v4 } from 'uuid';

import type { FormValues } from './projectSchema';

export async function createProject({
  source,
  userId,
  input,
  tx = prisma
}: {
  source: ProjectSource;
  input: FormValues &
    Partial<
      Pick<
        Project,
        'primaryContractAddress' | 'primaryContractChainId' | 'mintingWalletAddress' | 'sunnyAwardsProjectType'
      >
    >;
  userId: string;
} & OptionalPrismaTransaction) {
  const hasEnsName = !!input.mintingWalletAddress && input.mintingWalletAddress.trim().endsWith('.eth');

  if (hasEnsName) {
    const resolvedAddress = await resolveENSName(input.mintingWalletAddress as string, true);
    if (resolvedAddress) {
      input.mintingWalletAddress = resolvedAddress;
    } else {
      throw new InvalidInputError('Invalid ENS name');
    }
  }

  const farcasterAccounts = await tx.farcasterUser.findMany({
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

          const farcasterWalletUser = await tx.user.findFirst({
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

          const newUser = await tx.user.create({
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

  const existingProjectWithPath = await tx.project.findFirst({
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

  const project = await tx.project.create({
    data: {
      name: input.name,
      path,
      updatedBy: userId,
      createdBy: userId,
      description: input.description,
      optimismCategory: input.optimismCategory,
      sunnyAwardsCategory: input.sunnyAwardsCategory,
      websites: input.websites?.filter(isTruthy),
      farcasterValues: input.farcasterValues?.filter(isTruthy),
      twitter: input.twitter,
      github: input.github,
      avatar: input.avatar,
      coverImage: input.coverImage,
      primaryContractAddress: input.primaryContractAddress,
      primaryContractChainId: input.primaryContractChainId,
      mintingWalletAddress: input.mintingWalletAddress,
      sunnyAwardsProjectType: input.sunnyAwardsProjectType,
      source,
      projectMembers: {
        createMany: {
          data: [
            {
              teamLead: true,
              updatedBy: userId,
              userId,
              name: farcasterAccountsRecord[input.projectMembers[0]?.farcasterId]?.account.displayName as string,
              farcasterId: input.projectMembers[0]?.farcasterId
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
