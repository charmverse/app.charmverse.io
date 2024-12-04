'use server';

import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { authActionClient } from '../actions/actionClient';

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
