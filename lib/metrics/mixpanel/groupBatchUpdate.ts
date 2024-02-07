import { POST } from '@charmverse/core/http';

import { apiKey } from './mixpanel';
import type { GroupKeys } from './mixpanel';

type GroupItem = {
  $token: string;
  $group_key: string;
  $group_id: string;
  $set: object;
};

type GroupData = { id: string };

// Docs: https://developer.mixpanel.com/reference/group-batch-update
export function groupBatchUpdate<T extends GroupData>(groupKey: GroupKeys, groups: T[]) {
  if (!apiKey) {
    throw new Error('No Mixpanel api key found');
  }
  const groupData: GroupItem[] = groups.map(({ id, ...group }) => {
    return {
      $token: apiKey as string,
      $group_key: groupKey,
      $group_id: id,
      $set: group
    };
  });
  return POST('https://api.mixpanel.com/groups#group-batch-update', groupData);
}
