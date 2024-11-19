'use server';

import { prisma } from '@charmverse/core/prisma-client';
import * as yup from 'yup';

import { authActionClient } from '../actions/actionClient';

export const getBuilderStrikesCountAction = authActionClient
  .metadata({ actionName: 'builder-strikes-count' })
  .schema(yup.object({ builderId: yup.string().required() }))
  .action(async ({ parsedInput }) => {
    const strikes = await prisma.builderStrike.count({
      where: {
        builderId: parsedInput.builderId
      }
    });
    return strikes;
  });
