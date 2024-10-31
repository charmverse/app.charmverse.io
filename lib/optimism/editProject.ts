import { InvalidInputError } from '@charmverse/core/errors';
import type { Project } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { resolveENSName } from '@packages/blockchain/getENSName';
import { ensureFarcasterUserExists } from '@root/lib/farcaster/ensureFarcasterUserExists';
import { isTruthy } from '@root/lib/utils/types';

import type { FormValues } from './projectSchema';

export type EditProjectValues = FormValues &
  Partial<Pick<Project, 'primaryContractAddress' | 'mintingWalletAddress'>> & {
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

  const [currentProjectMembers] = await Promise.all([
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

  const projectMembers = await Promise.all(
    newProjectMembers.map((member) => ensureFarcasterUserExists({ fid: member.farcasterId }))
  );

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
        websites: input.websites?.filter(isTruthy),
        farcasterValues: input.farcasterValues?.filter(isTruthy),
        twitter: input.twitter,
        github: input.github,
        avatar: input.avatar,
        coverImage: input.coverImage,
        mintingWalletAddress: input.mintingWalletAddress,
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
        name: member.account.displayName || member.account.username,
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
