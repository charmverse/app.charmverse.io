import type { Role, Space } from '@prisma/client';
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { isUrl } from 'lib/utilities/strings';

import { useSpaces } from './useSpaces';

export default function useWebhookSubscription(spaceId: string) {
  const { setSpace } = useSpaces();

  // const { data: roles } = useSWR(
  //   () => (space ? `roles/${spaceId}` : null),
  //   () => space && charmClient.listRoles(spaceId)
  // );

  async function updateSpaceWebhookUrl(url: string): Promise<Space> {
    if (!isUrl(url)) {
      throw new Error("Url isn't valid.");
    }

    const updatedSpace = await charmClient.updateSpace({ webhookSubscriptionUrl: url, id: spaceId });

    setSpace(updatedSpace);

    return updatedSpace;
  }

  async function updateWebhookSubscriptions(namespaces: Record<string, boolean>) {
    if (!spaceId) {
      return;
    }

    await charmClient.updateWebhookSubscription(spaceId, namespaces);
  }

  return {
    updateSpaceWebhookUrl,
    updateWebhookSubscriptions
  };
}
