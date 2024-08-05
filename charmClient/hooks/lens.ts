import type { TextOnlyMetadata } from '@lens-protocol/metadata';

import { usePOST } from './helpers';

export function useUploadToArweave() {
  return usePOST<{ metadata: TextOnlyMetadata }, null | string>('/api/lens/upload-arweave');
}
