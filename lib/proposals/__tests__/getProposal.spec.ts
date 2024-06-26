import type { SubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { getProposal } from '../getProposal';
import type { ProposalWithUsersAndRubric } from '../interfaces';

describe('getProposal', () => {
  it('should return a proposal', async () => {
    const { proposal } = await mockProposal();

    const result = await getProposal({
      id: proposal.id,
      permissionsByStep: {
        draft: {} as any
      }
    });
    expect(result).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsersAndRubric>>({
        id: proposal.id,
        issuedCredentials: []
      })
    );
  });

  it('should return isPublic for individual page', async () => {
    const { proposal } = await mockProposal();

    // make public
    await prisma.pagePermission.create({
      data: {
        pageId: proposal.id,
        permissionLevel: 'view',
        public: true
      }
    });

    const result = await getProposal({
      id: proposal.id,
      permissionsByStep: {
        draft: {} as any
      }
    });
    expect(result.isPublic).toBe(true);
  });

  it('should return isPublic for free space', async () => {
    const { proposal } = await mockProposal({ tier: 'free' });

    const result = await getProposal({
      id: proposal.id,
      permissionsByStep: {
        draft: {} as any
      }
    });
    expect(result.isPublic).toBe(true);
  });

  it('should return isPublic when all proposals are public', async () => {
    const { proposal } = await mockProposal({ publicProposals: true });

    const result = await getProposal({
      id: proposal.id,
      permissionsByStep: {
        draft: {} as any
      }
    });
    expect(result.isPublic).toBe(true);
  });
});

async function mockProposal({
  tier = 'community',
  publicProposals
}: { tier?: SubscriptionTier; publicProposals?: boolean } = {}) {
  const { space, user } = await testUtilsUser.generateUserAndSpace({
    isAdmin: true,
    spacePaidTier: tier,
    publicProposals
  });

  const proposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: user.id
  });
  return { space, user, proposal };
}
