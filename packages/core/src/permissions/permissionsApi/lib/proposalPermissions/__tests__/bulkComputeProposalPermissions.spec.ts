import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { bulkComputeProposalPermissions } from '../bulkComputeProposalPermissions';
import { computeProposalEvaluationPermissions } from '../computeProposalEvaluationPermissions';

describe('bulkComputeProposalPermissions', () => {
  it('should return the same results as compute page permissions, with only view, view_notes, view_private_fields, and evaluate permissions', async () => {
    const { space, user: admin } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const member = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const memberWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: admin.id,
      assigneeUserIds: [memberWithRole.id]
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [] }]
    });

    const secondProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id,
      proposalStatus: 'draft',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [] }]
    });

    const allUsers = [admin.id, member.id, memberWithRole.id, undefined];

    for (const user of allUsers) {
      const bulkPermissions = await bulkComputeProposalPermissions({
        spaceId: space.id,
        userId: user
      });

      const firstProposalPermissions = await computeProposalEvaluationPermissions({
        resourceId: proposal.id,
        userId: user
      });

      const secondProposalPermissions = await computeProposalEvaluationPermissions({
        resourceId: proposal.id,
        userId: user
      });

      expect(bulkPermissions[proposal.id]).toEqual({
        evaluate: firstProposalPermissions.evaluate,
        view: firstProposalPermissions.view,
        view_notes: firstProposalPermissions.view_notes,
        view_private_fields: firstProposalPermissions.view_private_fields
      });

      expect(bulkPermissions[secondProposal.id]).toEqual({
        evaluate: secondProposalPermissions.evaluate,
        view: secondProposalPermissions.view,
        view_notes: secondProposalPermissions.view_notes,
        view_private_fields: secondProposalPermissions.view_private_fields
      });
    }
  });
});
