import { InvalidInputError } from '@charmverse/core/errors';
import type { OptionalPrismaTransaction, Prisma, Project, ProjectSource } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { resolveENSName } from '@packages/blockchain/getENSName';
import { ensureFarcasterUserExists } from '@root/lib/farcaster/ensureFarcasterUserExists';
import { generatePagePathFromPathAndTitle } from '@root/lib/pages/utils';
import { stringToValidPath, uid } from '@root/lib/utils/strings';
import { isTruthy } from '@root/lib/utils/types';

import type { FormValues } from './projectSchema';

export async function createProject({
  source,
  userId,
  input,
  tx = prisma
}: {
  source: ProjectSource;
  input: FormValues &
    Partial<Pick<Project, 'primaryContractAddress' | 'primaryContractChainId' | 'mintingWalletAddress'>>;
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

  const projectMembers = await Promise.all(
    input.projectMembers.map((member) =>
      ensureFarcasterUserExists({
        fid: member.farcasterId
      })
    )
  );

  const teamLeadFarcasterAccount = projectMembers.find((member) => member.userId === userId);

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

  const projectMembersToCreate: Omit<Prisma.ProjectMemberCreateManyInput, 'projectId'>[] = [
    ...projectMembers.map((member) => ({
      teamLead: member.fid === teamLeadFarcasterAccount?.fid,
      updatedBy: userId,
      userId: member.userId,
      // This is necessary because some test data fids do not have a corresponding farcaster profile
      name: (member.account.displayName || member.account.username)?.trim() || '',
      farcasterId: member.fid
    }))
  ];

  const project = await tx.project.create({
    data: {
      name: input.name,
      path,
      updatedBy: userId,
      createdBy: userId,
      description: input.description,
      optimismCategory: input.optimismCategory,
      websites: input.websites?.filter(isTruthy),
      farcasterValues: input.farcasterValues?.filter(isTruthy),
      twitter: input.twitter,
      github: input.github,
      avatar: input.avatar,
      coverImage: input.coverImage,
      primaryContractAddress: input.primaryContractAddress,
      primaryContractChainId: input.primaryContractChainId,
      mintingWalletAddress: input.mintingWalletAddress,
      source,
      projectMembers: {
        createMany: {
          data: projectMembersToCreate
        }
      }
    }
  });

  return project;
}
