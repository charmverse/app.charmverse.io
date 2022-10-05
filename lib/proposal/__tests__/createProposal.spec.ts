import type { Space, User } from '@prisma/client';

import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createProposal } from '../createProposal';
import { proposalPermissionMapping } from '../syncProposalPermissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('Creates a page and proposal with relevant configuration', () => {

  it('Create a page and proposal', async () => {

    const { page, workspaceEvent } = await createProposal({
      contentText: '',
      title: 'page-title',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(page).toMatchObject(expect.objectContaining({
      title: 'page-title',
      type: 'proposal'
    }));

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: page.proposalId as string
      },
      include: {
        authors: true
      }
    });

    expect(proposal).toMatchObject(expect.objectContaining({
      authors: [{
        proposalId: proposal?.id,
        userId: user.id
      }]
    }));

    expect(workspaceEvent).toMatchObject(expect.objectContaining({
      type: 'proposal_status_change'
    }));
  });

  it('Should provision the proposal permissions', async () => {

    const { page } = await createProposal({
      createdBy: user.id,
      contentText: '',
      spaceId: space.id,
      title: 'page-title'
    });

    const permissions = await prisma.pagePermission.findMany({
      where: {
        pageId: page.id
      }
    });

    const privateDraftAuthorPermissionLevel = proposalPermissionMapping.private_draft.author;

    expect(permissions.some(p => p.userId === user.id && p.permissionLevel === privateDraftAuthorPermissionLevel)).toBe(true);
  });

});
