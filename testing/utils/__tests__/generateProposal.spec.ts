import type { ProposalWithUsers } from 'lib/proposal/interface';
import { generateUserAndSpace } from 'testing/setupDatabase';

import { generateProposal, generateProposalCategory } from '../proposals';

describe('generateProposal', () => {
  it('should generate a proposal with a default status of draft if no status is provided, and 0 authors and reviewers', async () => {
    const { space, user } = await generateUserAndSpace();

    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await generateProposal({
      categoryId: proposalCategory.id,
      userId: user.id,
      spaceId: space.id
    });

    expect(proposal).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsers>>({
        id: expect.any(String),
        categoryId: proposalCategory.id,
        status: 'draft',
        authors: [],
        reviewers: []
      })
    );
  });
});
