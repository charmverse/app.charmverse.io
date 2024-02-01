import type { SyncRelationPropertyPayload } from 'pages/api/blocks/sync-relation-property';

import { usePUT } from './helpers';

export function useSyncRelationProperty() {
  return usePUT<SyncRelationPropertyPayload>('/api/blocks/sync-relation-property');
}
