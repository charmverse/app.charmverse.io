import type { Space } from '@charmverse/core/prisma-client';

import { createMockSpace } from '../space';

describe('createMockSpace', () => {
  it('should return a space with default pro tier, publicBountyBoards and publicProposals null', () => {
    const mockSpace = createMockSpace();

    expect(mockSpace).toMatchObject<Partial<Space>>({
      paidTier: 'community',
      publicBountyBoard: null,
      publicProposals: null
    });
  });
});
