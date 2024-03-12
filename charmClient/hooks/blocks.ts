import type { RemoveRelationPropertyPayload } from 'lib/focalboard/relationProperty/removeRelationProperty';
import type { RenameRelationPropertyPayload } from 'lib/focalboard/relationProperty/renameRelationProperty';
import type { SyncRelatedCardsValuesPayload } from 'lib/focalboard/relationProperty/syncRelatedCardsValues';
import type { SyncRelationPropertyPayload } from 'lib/focalboard/relationProperty/syncRelationProperty';

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
