'use server';

import { prisma } from '@charmverse/core/prisma-client';

import { authActionClient } from 'lib/actions/actionClient';

import { saveSubscriptionSchema } from './subscriptionSchema';

export const savePushNotificationSubscriptionAction = authActionClient
  .schema(saveSubscriptionSchema)
  .metadata({ actionName: 'sendNotification' })
  .action<void>(async ({ parsedInput, ctx }) => {
    const subscription = parsedInput?.subscription as any;

    await prisma.pushNotificationSubscription.create({
      data: {
        subscription,
        source: 'connect',
        userId: ctx.session.scoutId
      }
    });
  });
