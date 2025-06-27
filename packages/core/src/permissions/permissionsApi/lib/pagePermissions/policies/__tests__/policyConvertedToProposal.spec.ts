import { prisma } from '@charmverse/core/prisma-client';
import type { Page, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { AvailablePagePermissions } from '@packages/core/permissions';

import { policyConvertedToProposal } from '../policyConvertedToProposal';

describe('policyConvertedToProposal', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let page: Page;
  let pageConvertedToProposal: Page;
  const fullPermissionFlags = new AvailablePagePermissions({ isReadonlySpace: false }).full;
  const emptyPermissionFlags = new AvailablePagePermissions({ isReadonlySpace: false }).empty;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    space = generated.space;
    admin = generated.user;
    member = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    page = await testUtilsPages.generatePage({
      createdBy: admin.id,
      spaceId: space.id
    });
    pageConvertedToProposal = await testUtilsPages.generatePage({
      createdBy: admin.id,
      spaceId: space.id
    });
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id
    });
    pageConvertedToProposal = await prisma.page.update({
      where: {
        id: pageConvertedToProposal.id
      },
      data: {
        convertedProposalId: proposal.id
      }
    });
  });

  it('should not have an effect if convertedToProposalId is null', async () => {
    const updated = await policyConvertedToProposal({
      flags: { ...fullPermissionFlags },
      resource: page,
      userId: member.id
    });

    expect(updated).toEqual(fullPermissionFlags);
  });
  it('should not allow a space member to delete or edit a page converted to a proposal, but still allow them to view it', async () => {
    const updated = await policyConvertedToProposal({
      flags: fullPermissionFlags,
      resource: pageConvertedToProposal,
      userId: member.id
    });

    expect(updated).toEqual({
      ...emptyPermissionFlags,
      read: true
    });
  });

  it('should not remove any permission from a space admin', async () => {
    const updated = await policyConvertedToProposal({
      flags: { ...fullPermissionFlags },
      resource: pageConvertedToProposal,
      userId: admin.id,
      isAdmin: true
    });

    expect(updated).toEqual(fullPermissionFlags);
  });
});
