'use server';

import { actionClient } from '@packages/scoutgame/actions/actionClient';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import * as yup from 'yup';

import type { CompositeCursor } from 'lib/builders/getPaginatedBuilders';
import { getPaginatedBuilders } from 'lib/builders/getPaginatedBuilders';

export const getPaginatedBuildersAction = actionClient
  .metadata({ actionName: 'get_paginated_builders' })
  .schema(
    yup.object({
      cursor: yup
        .object({
          userId: yup.string().required(),
          rank: yup.number().nullable()
        })
        .nullable()
    })
  )
  .action<{ builders: BuilderInfo[]; nextCursor: CompositeCursor | null }>(async ({ parsedInput }) => {
    const { cursor } = parsedInput;
    const { builders, nextCursor } = await getPaginatedBuilders({
      limit: 30, // 6 rows per page
      week: getCurrentWeek(),
      season: currentSeason,
      cursor
    });

    return { builders, nextCursor };
  });
