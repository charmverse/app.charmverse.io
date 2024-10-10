'use server';

import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import * as yup from 'yup';

import { actionClient } from 'lib/actions/actionClient';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import type { BuilderInfo } from './interfaces';

export const getSortedBuildersAction = actionClient
  .metadata({ actionName: 'get_sorted_builders' })
  .schema(
    yup.object({
      sort: yup.string().oneOf(['hot', 'new', 'top']).required(),
      cursor: yup.string().optional()
    })
  )
  .action<{ builders: BuilderInfo[]; nextCursor: string | null }>(async ({ parsedInput }) => {
    const { sort, cursor } = parsedInput;
    const { builders, nextCursor } = await getSortedBuilders({
      sort,
      limit: 20,
      week: getCurrentWeek(),
      season: currentSeason,
      cursor
    });

    return { builders, nextCursor };
  });
