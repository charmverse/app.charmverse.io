import { isUrl } from '@packages/utils/strings';
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import type { SetSpaceWebhookBody, SetSpaceWebhookResponse } from 'pages/api/spaces/[id]/set-webhook';

import { useCurrentSpace } from './useCurrentSpace';

const convertToEventMap = (webhook: SetSpaceWebhookResponse | null | undefined) => {
  const eventMap = new Map<string, boolean>();

  if (!webhook) {
    return undefined;
  }

  // Loop over all the subscriptions and create a map out of it
  for (const subscription of webhook.webhookSubscriptions) {
    const value = !subscription.deletedAt;

    eventMap.set(subscription.scope, value);
  }

  return {
    ...webhook,
    eventMap
  };
};

export default function useWebhookSubscription(spaceId: string) {
  const { space } = useCurrentSpace();

  const { data: spaceWebhook, isLoading } = useSWR(
    () => (space ? `webhook/${space.id}` : null),
    () => space && charmClient.spaces.getSpaceWebhook(space.id)
  );

  async function updateSpaceWebhook(webhookOpts: SetSpaceWebhookBody): Promise<SetSpaceWebhookResponse> {
    if (!isUrl(webhookOpts.webhookUrl)) {
      throw new Error("Url isn't valid.");
    }

    const updatedSpaceWebhook = await charmClient.spaces.updateSpaceWebhook(spaceId, webhookOpts);

    if (space?.id) {
      mutate(`webhook/${space.id}`, updatedSpaceWebhook);
    }

    return updatedSpaceWebhook;
  }

  const webhookData = useMemo(() => convertToEventMap(spaceWebhook), [spaceWebhook]);

  return {
    spaceWebhook: webhookData,
    updateSpaceWebhook,
    isLoading
  };
}
