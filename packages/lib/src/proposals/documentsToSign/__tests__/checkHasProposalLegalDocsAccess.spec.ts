import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsMembers, testUtilsProposals } from '@charmverse/core/test';
import { InvalidInputError, UnauthorisedActionError } from '@packages/core/errors';
import { updateAllowedDocusignRolesAndUsers } from '@packages/lib/docusign/allowedDocusignRolesAndUsers';
import { canAccessDocusign } from '@packages/lib/docusign/canAccessDocusign';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { use } from 'react';
import { v4 as uuid } from 'uuid';

import { checkHasProposalLegalDocsAccess } from '../checkHasProposalLegalDocsAccess';

describe('checkHasProposalLegalDocsAccess', () => {
  it('should throw UnauthorisedActionError if userId is not provided', async () => {
    await expect(checkHasProposalLegalDocsAccess({ userId: '', proposalId: uuid() })).rejects.toThrow(
      UnauthorisedActionError
    );
  });

  it('should throw InvalidInputError if neither evaluationId nor proposalId is provided', async () => {
    const { user } = await testUtilsUser.generateUserAndSpace();
    await expect(checkHasProposalLegalDocsAccess({ userId: user.id })).rejects.toThrow(InvalidInputError);
  });

  it('should work with a proposalId or evaluationId', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: [
        { evaluationType: 'sign_documents', permissions: [], reviewers: [{ group: 'user', id: user.id }] }
      ]
    });

    await expect(
      checkHasProposalLegalDocsAccess({ userId: user.id, evaluationId: proposal.evaluations[0].id })
    ).resolves.not.toThrow();
    await expect(checkHasProposalLegalDocsAccess({ userId: user.id, proposalId: proposal.id })).resolves.not.toThrow();
  });

  it('should throw UnauthorisedActionError if user does not have docusign access', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    // Role with no assignees
    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: []
    });

    await updateAllowedDocusignRolesAndUsers({
      spaceId: space.id,
      allowedRolesAndUsers: [{ roleId: role.id }]
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: [
        { evaluationType: 'sign_documents', permissions: [], reviewers: [{ group: 'user', id: user.id }] }
      ]
    });
    await expect(checkHasProposalLegalDocsAccess({ userId: user.id, proposalId: proposal.id })).rejects.toThrow(
      UnauthorisedActionError
    );
  });

  it('should throw UnauthorisedActionError if user does not have evaluation permissions', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const requestingUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: [
        { evaluationType: 'sign_documents', permissions: [], reviewers: [{ group: 'user', id: requestingUser.id }] }
      ]
    });

    await expect(checkHasProposalLegalDocsAccess({ userId: user.id, proposalId: proposal.id })).rejects.toThrow(
      UnauthorisedActionError
    );
  });

  it('should succeed if user has docusign access and evaluation permissions', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await updateAllowedDocusignRolesAndUsers({
      spaceId: space.id,
      allowedRolesAndUsers: [{ userId: reviewer.id }]
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: [
        { evaluationType: 'sign_documents', permissions: [], reviewers: [{ group: 'user', id: reviewer.id }] }
      ]
    });

    await expect(
      checkHasProposalLegalDocsAccess({ userId: reviewer.id, evaluationId: proposal.evaluations[0].id })
    ).resolves.not.toThrow();
  });
});
