import type { SubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';

import { getProposal } from '../getProposal';
import type { ProposalWithUsersAndRubric } from '../interfaces';

describe('getProposal', () => {
  it('should return a proposal', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const result = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: user.id,
        proposalStatus: 'draft',
        evaluationInputs: [
          {
            evaluationType: 'pass_fail',
            permissions: [{ assignee: { group: 'public' }, operation: 'view' }],
            reviewers: []
          }
        ]
      })
      .then(async (_proposal) => {
        const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
          resourceId: _proposal.id,
          userId: user.id
        });
        return getProposal({ id: _proposal.id, permissionsByStep });
      });
    expect(result).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsersAndRubric>>({
        id: result.id,
        issuedCredentials: []
      })
    );
  });

  it('should return isPublic if proposal has a public workflow permission', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const draftProposalWithPublicPermission = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: user.id,
        proposalStatus: 'draft',
        evaluationInputs: [
          {
            evaluationType: 'pass_fail',
            permissions: [{ assignee: { group: 'public' }, operation: 'view' }],
            reviewers: []
          }
        ]
      })
      .then(async (_proposal) => {
        const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
          resourceId: _proposal.id,
          userId: user.id
        });
        return getProposal({ id: _proposal.id, permissionsByStep });
      });

    const draftProposalWithoutPublicPermission = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: user.id,
        proposalStatus: 'draft',
        evaluationInputs: [
          {
            evaluationType: 'pass_fail',
            permissions: [{ assignee: { group: 'space_member' }, operation: 'view' }],
            reviewers: []
          }
        ]
      })
      .then(async (_proposal) => {
        const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
          resourceId: _proposal.id,
          userId: user.id
        });
        return getProposal({ id: _proposal.id, permissionsByStep });
      });

    const publishedProposalWithPublicPermission = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: user.id,
        proposalStatus: 'published',
        evaluationInputs: [
          {
            evaluationType: 'pass_fail',
            permissions: [{ assignee: { group: 'public' }, operation: 'view' }],
            reviewers: []
          }
        ]
      })
      .then(async (_proposal) => {
        const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
          resourceId: _proposal.id,
          userId: user.id
        });
        return getProposal({ id: _proposal.id, permissionsByStep });
      });

    const publishedProposalWithoutPublicPermission = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: user.id,
        proposalStatus: 'published',
        evaluationInputs: [
          {
            evaluationType: 'pass_fail',
            permissions: [{ assignee: { group: 'space_member' }, operation: 'view' }],
            reviewers: []
          }
        ]
      })
      .then(async (_proposal) => {
        const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
          resourceId: _proposal.id,
          userId: user.id
        });
        return getProposal({ id: _proposal.id, permissionsByStep });
      });

    expect(draftProposalWithPublicPermission.isPublic).toBe(false);
    expect(draftProposalWithoutPublicPermission.isPublic).toBe(false);
    expect(publishedProposalWithPublicPermission.isPublic).toBe(true);
    expect(publishedProposalWithoutPublicPermission.isPublic).toBe(false);
  });

  // This flag is now only used for showing the proposals list. The actual proposals visible in the list are controlled by workflow permissions.
  it('should return ignore the space-wide public proposals flag when all proposals are public', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      publicProposals: true
    });

    const publishedProposal = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: user.id,
        proposalStatus: 'published',
        evaluationInputs: [
          {
            evaluationType: 'pass_fail',
            permissions: [{ assignee: { group: 'space_member' }, operation: 'view' }],
            reviewers: []
          }
        ]
      })
      .then(async (_proposal) => {
        const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
          resourceId: _proposal.id,
          userId: user.id
        });
        return getProposal({ id: _proposal.id, permissionsByStep });
      });

    expect(publishedProposal.isPublic).toBe(false);
  });
});
