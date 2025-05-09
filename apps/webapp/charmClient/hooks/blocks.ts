import type { RemoveRelationPropertyPayload } from '@packages/databases/relationProperty/removeRelationProperty';
import type { RenameRelationPropertyPayload } from '@packages/databases/relationProperty/renameRelationProperty';
import type { SyncRelatedCardsValuesPayload } from '@packages/databases/relationProperty/syncRelatedCardsValues';
import type { SyncRelationPropertyPayload } from '@packages/databases/relationProperty/syncRelationProperty';

import { usePOST, usePUT } from './helpers';

export function useSyncRelationProperty() {
  return usePOST<SyncRelationPropertyPayload>('/api/blocks/relation/sync');
}

export function useRenameRelationProperty() {
  return usePUT<RenameRelationPropertyPayload>('/api/blocks/relation/rename');
}

export function useRemoveRelationProperty() {
  return usePOST<RemoveRelationPropertyPayload>('/api/blocks/relation/remove');
}

export function useSyncRelationPropertyValue() {
  return usePUT<SyncRelatedCardsValuesPayload>('/api/blocks/relation/sync-values');
}
