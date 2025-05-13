import type { Space } from '@charmverse/core/prisma-client';
import { createMockSpace } from '@packages/testing/mocks/space';

import type { useCurrentSpace } from 'hooks/useCurrentSpace';

export const mockCurrentSpaceContext = (space?: Partial<Space>): ReturnType<typeof useCurrentSpace> => {
  return {
    space: createMockSpace(space),
    isLoading: false,
    refreshCurrentSpace: () => null
  };
};
