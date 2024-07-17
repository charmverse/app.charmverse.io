import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';
import { uid } from '@root/lib/utils/strings';
import { isTruthy } from '@root/lib/utils/types';
import { v4 } from 'uuid';

import type { FormValues } from './form';

export async function editConnectProject({
  userId,
  input
}: {
  input: FormValues & {
    projectId: string;
  };
  userId: string;
}) {
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
        fid: true
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

  const farcasterAccountsUserIdRecord: Record<number, string> = inputProjectMembers.reduce<Record<number, string>>(
    (acc, { userId: _userId, fid }) => {
      acc[fid] = _userId;
      return acc;
    },
    {}
  );

  const projectMembers = (
    await Promise.all(
      newProjectMembers.map(async (member) => {
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

  const [editedProject] = await prisma.$transaction([
    prisma.project.update({
      where: {
        id: input.projectId
      },
      data: {
        name: input.name,
        updatedBy: userId,
        description: input.description,
        category: input.category,
        websites: input.websites?.filter(isTruthy),
        farcasterValues: input.farcasterValues?.filter(isTruthy),
        twitter: input.twitter,
        github: input.github,
        mirror: input.mirror,
        avatar: input.avatar,
        coverImage: input.coverImage
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
