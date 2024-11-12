'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { authActionClient } from '../actions/actionClient';

import { generateUserPath } from './generateUserPath';
import { updateUserDetailsSchema } from './updateUserDetailsSchema';

export const updateUserDetailsAction = authActionClient
  .metadata({ actionName: 'update-user-details' })
  .schema(updateUserDetailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    const existingUser = await prisma.scout.findUniqueOrThrow({
      where: { id: userId },
      select: {
        displayName: true
      }
    });

    const path =
      existingUser.displayName === parsedInput.displayName
        ? undefined
        : await generateUserPath(parsedInput.displayName);

    const updatedUser = await prisma.scout.update({
      where: { id: userId },
      data: {
        avatar: parsedInput.avatar,
        displayName: parsedInput.displayName,
        path
      }
    });

    return updatedUser;
  });
