'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { saveSubscriptionSchema } from '../pwa/subscriptionSchema';

import { authActionClient } from './actionClient';

export const actionSaveSubscription = authActionClient
  .schema(saveSubscriptionSchema)
  .metadata({ actionName: 'sendNotification' })
  .action<void>(async ({ parsedInput, ctx }) => {
    const subscription = parsedInput?.subscription as any;

    await prisma.pushNotificationSubscription.create({
      data: {
        subscription,
        source: 'sunnyawards',
        userId: ctx.session.user.id
      }
    });
  });
