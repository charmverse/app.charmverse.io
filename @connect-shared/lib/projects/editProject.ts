import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Project } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-kit';
import { resolveENSName } from '@root/lib/blockchain';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';
import { uid } from '@root/lib/utils/strings';
import { isTruthy } from '@root/lib/utils/types';
import { v4 } from 'uuid';

import type { FormValues } from './projectSchema';

export type EditProjectValues = FormValues &
  Partial<Pick<Project, 'primaryContractAddress' | 'mintingWalletAddress' | 'sunnyAwardsProjectType'>> & {
    projectId: string;
    primaryContractChainId?: string | number;
  };

export async function editProject({ userId, input }: { input: EditProjectValues; userId: string }) {
  const hasEnsName = !!input.mintingWalletAddress && input.mintingWalletAddress.trim().endsWith('.eth');

  if (hasEnsName) {
    const resolvedAddress = await resolveENSName(input.mintingWalletAddress as string, true);
    if (!resolvedAddress) {
      throw new InvalidInputError('Invalid ENS name');
    }
  }

  const [currentProjectMembers, inputProjectMembers] = await Promise.all([
    prisma.projectMember.findMany({
      where: {
        projectId: input.projectId,
        teamLead: false
      },
      select: {
        id: true,
        user: {
          select: {
            farcasterUser: {
              select: {
                fid: true
              }
            }
          }
        }
      }
    }),
    prisma.farcasterUser.findMany({
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
    })
  ]);

  const deletedProjectMembers = currentProjectMembers.filter(
    (projectMember) =>
      !input.projectMembers.some((member) => member.farcasterId === projectMember.user?.farcasterUser?.fid)
  );

  const newProjectMembers = input.projectMembers.filter(
    (member) =>
      !currentProjectMembers.some((projectMember) => member.farcasterId === projectMember.user?.farcasterUser?.fid)
  );

  const farcasterAccountsRecord: Record<
    number,
    {
      userId: string;
      account: StatusAPIResponse;
    }
  > = inputProjectMembers.reduce<
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
      newProjectMembers.map(async (member) => {
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

  const [editedProject] = await prisma.$transaction([
    prisma.project.update({
      where: {
        id: input.projectId
      },
      data: {
        name: input.name,
        updatedBy: userId,
        description: input.description,
        optimismCategory: input.optimismCategory,
        sunnyAwardsCategory: input.sunnyAwardsCategory,
        websites: input.websites?.filter(isTruthy),
        farcasterValues: input.farcasterValues?.filter(isTruthy),
        twitter: input.twitter,
        github: input.github,
        avatar: input.avatar,
        coverImage: input.coverImage,
        mintingWalletAddress: input.mintingWalletAddress,
        sunnyAwardsProjectType: input.sunnyAwardsProjectType,
        primaryContractAddress: input.primaryContractAddress,
        primaryContractChainId: input.primaryContractChainId
          ? parseInt(input.primaryContractChainId as string)
          : undefined
      }
    }),
    prisma.projectMember.createMany({
      data: projectMembers.map((member) => ({
        teamLead: false,
        updatedBy: userId,
        name: member.name,
        userId: member.userId,
        projectId: input.projectId
      }))
    }),
    prisma.projectMember.deleteMany({
      where: {
        id: {
          in: deletedProjectMembers.map((member) => member.id)
        }
      }
    })
  ]);

  return editedProject;
}
