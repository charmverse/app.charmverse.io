import { POST } from '@packages/core/http';

import { getApiKey } from './mixpanel';
import type { GroupKeys } from './mixpanel';

type GroupItem = {
  $token: string;
  $group_key: string;
  $group_id: string;
  $set: object;
};

type GroupData = { id: string };

// Mixpanel sdk does not support batch group updates so we need to build request manually
// https://developer.mixpanel.com/reference/group-batch-update
export function groupBatchUpdate<T extends GroupData>(groupKey: GroupKeys, groups: T[]) {
  const apiKey = getApiKey();
  const groupData: GroupItem[] = groups.map(({ id, ...group }) => {
    return {
      $token: apiKey,
      $group_key: groupKey,
      $group_id: id,
      $set: group
    };
  });
  return POST('https://api.mixpanel.com/groups#group-batch-update', groupData);
}
