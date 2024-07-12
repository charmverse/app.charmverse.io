'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { actionClient } from '@connect/lib/actions/actionClient';

import { saveSubscriptionSchema } from '../pwa/subscriptionSchema';

export const actionSaveSubscription = actionClient
  .schema(saveSubscriptionSchema)
  .metadata({ actionName: 'sendNotification' })
  .action<void>(async ({ parsedInput }) => {
    const subscription = parsedInput?.subscription;

    await prisma.serviceWorkerSubscriptions.create({
      data: {
        subscription
      }
    });
  });
