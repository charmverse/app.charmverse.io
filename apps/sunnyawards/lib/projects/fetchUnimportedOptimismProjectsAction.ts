'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';

import { schema } from './schema';

export const fetchUnimportedOptimismProjectsAction = authActionClient
  .metadata({ actionName: 'fetch-unimported-projects' })
  .action(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;

    const farcasterUser = await prisma.farcasterUser.findUniqueOrThrow({
      where: {
        userId: currentUserId
      }
    });

    const attestationsWithoutProject = await prisma.optimismProjectAttestation.findMany({
      where: {
        farcasterIds: {
          hasSome: [farcasterUser.fid]
        },
        projectId: null
      }
    });

    return attestationsWithoutProject;
  });
