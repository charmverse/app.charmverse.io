import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { createOrUpdateFarcasterUser } from '@packages/farcaster/createOrUpdateFarcasterUser';
import { generatePagePathFromPathAndTitle } from '@packages/pages/utils';
import { stringToValidPath } from '@packages/utils/strings';
import { getFarcasterUsers } from '@root/lib/farcaster/getFarcasterUsers';

import type { FormValues } from './projectSchema';

export async function createProject(input: FormValues) {
  const [farcasterUser] = await getFarcasterUsers({
    fids: [input.teamLeadFarcasterId]
  });

  if (!farcasterUser) {
    throw new DataNotFoundError('Farcaster user not found');
  }

  const { userId } = await createOrUpdateFarcasterUser({
    fid: input.teamLeadFarcasterId,
    username: farcasterUser.username,
    verifications: farcasterUser.verifications,
    bio: farcasterUser.profile?.bio?.text,
    displayName: farcasterUser.display_name,
    pfpUrl: farcasterUser.pfp_url
  });

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
      avatar: input.avatar,
      source: 'farcaster',
      projectMembers: {
        createMany: {
          data: [
            {
              teamLead: true,
              updatedBy: userId,
              userId,
              name: farcasterUser.display_name,
              farcasterId: input.teamLeadFarcasterId
            }
          ]
        }
      }
    }
  });

  return project;
}
