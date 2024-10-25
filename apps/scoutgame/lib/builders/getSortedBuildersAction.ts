'use server';

import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import * as yup from 'yup';

import { actionClient } from 'lib/actions/actionClient';
import type { CompositeCursor } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import type { BuilderInfo } from './interfaces';

export const getSortedBuildersAction = actionClient
  .metadata({ actionName: 'get_sorted_builders' })
  .schema(
    yup.object({
      sort: yup.string().oneOf(['hot', 'new', 'top']).required(),
      cursor: yup
        .object({
          userId: yup.string().required(),
          rank: yup.number().nullable()
        })
        .nullable()
    })
  )
  .action<{ builders: BuilderInfo[]; nextCursor: CompositeCursor | null }>(async ({ parsedInput }) => {
    const { sort, cursor } = parsedInput;
    const { builders, nextCursor } = await getSortedBuilders({
      sort,
      limit: 30, // 6 rows per page
      week: getCurrentWeek(),
      season: currentSeason,
      cursor
    });

    return { builders, nextCursor };
  });
