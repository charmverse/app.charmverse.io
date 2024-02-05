import type { SyncRelationPropertyPayload } from 'pages/api/blocks/sync-relation-property';
import type { SyncRelationPropertyValuePayload } from 'pages/api/blocks/sync-relation-property-value';

import { usePUT } from './helpers';

export function useSyncRelationProperty() {
  return usePUT<SyncRelationPropertyPayload>('/api/blocks/sync-relation-property');
}

export function useSyncRelationPropertyValue() {
  return usePUT<SyncRelationPropertyValuePayload>('/api/blocks/sync-relation-property-value');
}
