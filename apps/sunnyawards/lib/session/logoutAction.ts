'use server';

import { log } from '@charmverse/core/log';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';

const schema = yup.object({
  projectPath: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

export const logoutAction = authActionClient.metadata({ actionName: 'login' }).action(async ({ ctx, parsedInput }) => {
  const userId = ctx.session.user?.id;
  ctx.session.destroy();

  log.info('User logged out with Farcaster', { userId, method: 'farcaster' });

  return { success: true };
});
