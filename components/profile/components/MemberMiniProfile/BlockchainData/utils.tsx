import type { ProfileItem } from '@prisma/client';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';

export async function updateProfileItem<Data extends { id: string; isPinned: boolean; isHidden: boolean }>(
  data: Data,
  type: ProfileItem['type'],
  mutate?: KeyedMutator<Data[]>
) {
  const profileItem: Omit<ProfileItem, 'userId' | 'address'> = {
    id: data.id,
    isHidden: data.isHidden,
    type,
    metadata: null,
    isPinned: !data.isPinned
  };

  await charmClient.profile.updateProfileItem({
    profileItems: [profileItem]
  });

  if (mutate) {
    await mutate(
      (cachedData) => {
        if (!cachedData) {
          return [];
        }

        return cachedData.map((cached) => (cached.id === data.id ? { ...cached, isPinned: !data.isPinned } : cached));
      },
      { revalidate: false }
    );
  }
}
