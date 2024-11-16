'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { completeQuest } from './completeQuest';

export const completeQuestAction = authActionClient
  .schema(
    yup.object({
      questType: yup.string().required()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    await completeQuest(ctx.session.scoutId, parsedInput.questType);
    revalidatePath('/quests');
  });
