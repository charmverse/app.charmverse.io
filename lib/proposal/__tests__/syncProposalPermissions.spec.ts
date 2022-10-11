/* eslint-disable no-loop-func */
import type { Role, Space, User } from '@prisma/client';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import { typedKeys } from 'lib/utilities/objects';
import { createPage, generateProposal, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { ProposalReviewerInput } from '../interface';
import { proposalPermissionMapping, syncProposalPermissions } from '../syncProposalPermissions';

let space: Space;
let user: User;
let secondAuthor: User;
let reviewerUser: User;
let reviewerRole: Role;

beforeAll(async () => {

  const result = await generateUserAndSpaceWithApiToken();

  space = result.space;
  user = result.user;

  secondAuthor = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  reviewerUser = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });

  reviewerRole = await generateRole({
    createdBy: user.id,
    spaceId: space.id
  });

});

jest.setTimeout(1200000);

describe('syncProposalPagePermissions', () => {

  it('should set permissions for a proposal and its children to the target state for that proposal status', async () => {

    const authors = [user.id, secondAuthor.id];

    const reviewers: ProposalReviewerInput[] = [{ group: 'user', id: reviewerUser.id }, { group: 'role', id: reviewerRole.id }];

    let { proposal } = await generateProposal({
      proposalStatus: 'private_draft',
      spaceId: space.id,
      userId: user.id,
      authors,
      reviewers
    });

    const proposalChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: proposal.id
    });

    const proposalSubChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: proposal.id
    });

    const proposalStatusKeys = typedKeys(proposalPermissionMapping);

    for (const proposalStatus of proposalStatusKeys) {
      if (proposal?.status !== proposalStatus) {
        proposal = await prisma.proposal.update({
          where: {
            id: proposal.id
          },
          data: {
            status: proposalStatus
          },
          include: {
            authors: true,
            reviewers: true,
            category: true
          }
        });
      }

      const proposalPage = await syncProposalPermissions({ proposalId: proposal.id });

      const childPage = await getPage(proposalChild.id);

      const subChildPage = await getPage(proposalSubChild.id);

      // Assert correct permissions
      const authorSetting = proposalPermissionMapping[proposalStatus].author;
      const reviewerSetting = proposalPermissionMapping[proposalStatus].reviewer;
      const communitySetting = proposalPermissionMapping[proposalStatus].community;

      ([proposalPage, childPage, subChildPage] as IPageWithPermissions[]).map(page => page.permissions).forEach(permissions => {
        if (authorSetting !== null) {
          authors.forEach(a => {
            expect(permissions.some(p => p.userId === a && p.permissionLevel === authorSetting)).toBe(true);
          });
        }
        else {
          authors.forEach(a => {
            expect(permissions.every(p => p.userId !== a)).toBe(true);
          });
        }

        if (reviewerSetting !== null) {
          reviewers.forEach(r => {
            expect(permissions.some(p => (r.group === 'user' ? p.userId === r.id : p.roleId === r.id) && p.permissionLevel === reviewerSetting)).toBe(true);
          });
        }
        else {
          reviewers.forEach(r => {
            expect(permissions.every(p => (r.group === 'user' ? p.userId !== r.id : p.roleId !== r.id))).toBe(true);
          });
        }

        if (communitySetting !== null) {
          expect(permissions.some(p => p.spaceId === space.id && p.permissionLevel === communitySetting)).toBe(true);
        }
        else {
          expect(permissions.every(p => p.spaceId !== space.id)).toBe(true);
        }
      });
    }

  });

  it('should not impact any public permissions for a page', async () => {
    const authors = [user.id, secondAuthor.id];

    const reviewers: ProposalReviewerInput[] = [{ group: 'user', id: reviewerUser.id }, { group: 'role', id: reviewerRole.id }];

    const { proposal } = await generateProposal({
      proposalStatus: 'private_draft',
      spaceId: space.id,
      userId: user.id,
      authors,
      reviewers
    });

    const proposalChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: proposal.id
    });

    const proposalSubChild = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: proposal.id
    });

    await prisma.pagePermission.createMany({
      data: [
        {
          pageId: proposal.id,
          permissionLevel: 'view',
          public: true
        },
        {
          pageId: proposalChild.id,
          permissionLevel: 'view',
          public: true
        },
        {
          pageId: proposalSubChild.id,
          permissionLevel: 'view',
          public: true
        }
      ]
    });

    const proposalPage = await syncProposalPermissions({ proposalId: proposal.id });

    const childPage = await getPage(proposalChild.id);

    const subChildPage = await getPage(proposalSubChild.id);

    ([proposalPage, childPage, subChildPage] as IPageWithPermissions[]).forEach(page => {
      expect(page.permissions.some(p => p.public)).toBe(true);
    });

  });
});
