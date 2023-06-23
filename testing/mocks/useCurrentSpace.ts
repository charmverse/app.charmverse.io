import type { Space } from '@charmverse/core/prisma-client';

import type { useCurrentSpace } from 'hooks/useCurrentSpace';

import { createMockSpace } from './space';

export const mockCurrentSpaceContext = (space?: Partial<Space>): ReturnType<typeof useCurrentSpace> => {
  return {
    space: createMockSpace(space),
    isLoading: false,
    refreshCurrentSpace: () => null
  };
};
