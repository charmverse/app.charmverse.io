import { generateUserAndSpace } from '../../../packages/testing/src/setupDatabase';
import type { ProposalWithUsersAndPageMeta } from '../proposals';
import { generateProposal } from '../proposals';

describe('generateProposal', () => {
  it('should generate a proposal with a default status of draft if no status is provided, and 0 authors and reviewers', async () => {
    const { space, user } = await generateUserAndSpace();

    const proposal = await generateProposal({
      userId: user.id,
      spaceId: space.id
    });

    expect(proposal).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsersAndPageMeta>>({
        id: expect.any(String),
        status: 'draft',
        authors: [],
        reviewers: [],
        page: {
          path: expect.any(String),
          title: expect.any(String)
        }
      })
    );
  });
});
