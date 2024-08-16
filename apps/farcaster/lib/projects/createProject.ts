import { prisma } from '@charmverse/core/prisma-client';
import type { FormValues } from '@connect-shared/lib/projects/projectSchema';
import type { StatusAPIResponse } from '@farcaster/auth-client';
import { generatePagePathFromPathAndTitle } from '@root/lib/pages/utils';
import { stringToValidPath } from '@root/lib/utils/strings';
import { isTruthy } from '@root/lib/utils/types';

export async function createProject(input: FormValues) {
  const farcasterUser = await prisma.farcasterUser.findFirstOrThrow({
    where: {
      fid: input.projectMembers[0].farcasterId
    },
    select: {
      userId: true,
      fid: true,
      account: true
    }
  });

  const userId = farcasterUser.userId;

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
      websites: input.websites?.filter(isTruthy),
      farcasterValues: input.farcasterValues?.filter(isTruthy),
      twitter: input.twitter,
      github: input.github,
      avatar: input.avatar,
      coverImage: input.coverImage,
      source: 'farcaster',
      projectMembers: {
        createMany: {
          data: [
            {
              teamLead: true,
              updatedBy: userId,
              userId,
              name: (farcasterUser.account as unknown as StatusAPIResponse).displayName as string,
              farcasterId: input.projectMembers[0]?.farcasterId
            }
          ]
        }
      }
    }
  });

  return project;
}
