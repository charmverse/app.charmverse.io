import type { RemoveRelationPropertyPayload } from 'pages/api/blocks/relation/remove';
import type { RenameRelationPropertyPayload } from 'pages/api/blocks/relation/rename';
import type { SyncRelationPropertyPayload } from 'pages/api/blocks/relation/sync';
import type { SyncRelationPropertyValuePayload } from 'pages/api/blocks/sync-relation-property-value';

import { useDELETE, usePOST, usePUT } from './helpers';

export function useSyncRelationProperty() {
  return usePOST<SyncRelationPropertyPayload>('/api/blocks/relation/sync');
}

export function useRenameRelationProperty() {
  return usePUT<RenameRelationPropertyPayload>('/api/blocks/relation/rename');
}

export function useRemoveRelationProperty() {
  return useDELETE<RemoveRelationPropertyPayload>('/api/blocks/relation/remove');
}

export function useSyncRelationPropertyValue() {
  return usePUT<SyncRelationPropertyValuePayload>('/api/blocks/sync-relation-property-value');
}
