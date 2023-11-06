// Assume this test file is at the same level as the folder where `exportSpaceData` is located.
import fs from 'fs/promises';
import path from 'path';

import type { AssignedProposalCategoryPermission } from '@charmverse/core/dist/cjs/permissions';
import type { Proposal, ProposalCategory, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { mapProposalCategoryPermissionToAssignee } from 'lib/permissions/proposals/mapProposalCategoryPermissionToAssignee';
import {
  mapSpacePermissionToAssignee,
  type AssignedSpacePermission
} from 'lib/permissions/spaces/mapSpacePermissionToAssignee';

import type { SpaceDataExport } from '../exportSpaceData';
import { exportSpaceData } from '../exportSpaceData';
import type { ExportedPage } from '../exportWorkspacePages';

describe('exportSpaceData', () => {
  let space: Space;
  let user: User;

  let proposalReviewerRole: Role;
  let secondProposalReviewerRole: Role;

  let spacePermissions: AssignedSpacePermission[];
  let proposalCategoryPermissions: AssignedProposalCategoryPermission[];

  let proposalCategory1WithoutPermissions: ProposalCategory;
  let proposalCategory2WithSpacePermissions: ProposalCategory;
  let proposalCategory3WithRolePermissions: ProposalCategory;

  let proposalInCategory1: ExportedPage;

  let proposalInCategory2: ExportedPage;
  let proposalInCategory3: ExportedPage;
  beforeAll(async () => {
    ({ space, user } = await testUtilsUser.generateUserAndSpace());

    proposalReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });
    secondProposalReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    spacePermissions = await prisma
      .$transaction([
        prisma.spacePermission.create({
          data: {
            operations: ['reviewProposals', 'deleteAnyProposal', 'createPage'],
            forSpace: { connect: { id: space.id } },
            role: { connect: { id: proposalReviewerRole.id } }
          }
        }),
        prisma.spacePermission.create({
          data: {
            operations: ['reviewProposals', 'deleteAnyProposal', 'createPage'],
            forSpace: { connect: { id: space.id } },
            role: { connect: { id: secondProposalReviewerRole.id } }
          }
        }),
        prisma.spacePermission.create({
          data: {
            operations: ['createPage'],
            forSpace: { connect: { id: space.id } },
            space: { connect: { id: space.id } }
          }
        })
      ])
      .then((data) => data.map(mapSpacePermissionToAssignee));

    [proposalCategory1WithoutPermissions, proposalCategory2WithSpacePermissions, proposalCategory3WithRolePermissions] =
      await Promise.all([
        testUtilsProposals.generateProposalCategory({
          spaceId: space.id,
          proposalCategoryPermissions: [
            { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'view_comment_vote' }
          ]
        }),
        testUtilsProposals.generateProposalCategory({
          spaceId: space.id,
          proposalCategoryPermissions: [
            { assignee: { group: 'space', id: space.id }, permissionLevel: 'view_comment' },
            { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'full_access' }
          ]
        }),
        testUtilsProposals.generateProposalCategory({
          spaceId: space.id,
          proposalCategoryPermissions: [
            { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'full_access' },
            { assignee: { group: 'role', id: secondProposalReviewerRole.id }, permissionLevel: 'view_comment_vote' }
          ]
        })
      ]);

    proposalCategoryPermissions = await prisma.proposalCategoryPermission
      .findMany({
        where: {
          proposalCategory: {
            spaceId: space.id
          }
        }
      })
      .then((data) => data.map(mapProposalCategoryPermissionToAssignee));

    proposalInCategory1 = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: space.createdBy,
        reviewers: [
          { group: 'role', id: proposalReviewerRole.id },
          // This permission should be ignored because it's not a role-reviewer
          { group: 'user', id: user.id }
        ]
      })
      .then((p) =>
        prisma.page.findUniqueOrThrow({
          where: { id: p.id },
          include: {
            proposal: {
              include: {
                category: true
              }
            }
          }
        })
      )
      .then((p) => ({ ...p, children: [], permissions: [] }));

    proposalInCategory2 = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: space.createdBy,
        reviewers: [
          { group: 'role', id: proposalReviewerRole.id },
          { group: 'role', id: secondProposalReviewerRole.id }
        ]
      })
      .then((p) =>
        prisma.page.findUniqueOrThrow({
          where: { id: p.id },
          include: {
            proposal: {
              include: {
                category: true
              }
            }
          }
        })
      )
      .then((p) => ({ ...p, children: [], permissions: [] }));

    proposalInCategory3 = await testUtilsProposals
      .generateProposal({
        spaceId: space.id,
        userId: space.createdBy,
        reviewers: [{ group: 'role', id: secondProposalReviewerRole.id }]
      })
      .then((p) =>
        prisma.page.findUniqueOrThrow({
          where: { id: p.id },
          include: {
            proposal: {
              include: {
                category: true
              }
            }
          }
        })
      )
      .then((p) => ({ ...p, children: [], permissions: [] }));
  });

  it('should export space data successfully by space ID', async () => {
    const exportedData = await exportSpaceData({ spaceIdOrDomain: space.id });

    // High level assertions for documentation purposes
    expect(exportedData).toHaveProperty('pages');
    expect(exportedData).toHaveProperty('roles');
    expect(exportedData).toHaveProperty('permissions');
    expect(exportedData).toHaveProperty('proposalCategories');

    expect(exportedData).toMatchObject<SpaceDataExport>({
      roles: expect.arrayContaining([proposalReviewerRole, secondProposalReviewerRole]),
      permissions: {
        proposalCategoryPermissions: expect.arrayContaining(proposalCategoryPermissions),
        spacePermissions: expect.arrayContaining(spacePermissions)
      },
      pages: expect.arrayContaining([proposalInCategory1, proposalInCategory2, proposalInCategory3]),
      proposalCategories: expect.arrayContaining([
        proposalCategory1WithoutPermissions,
        proposalCategory2WithSpacePermissions,
        proposalCategory3WithRolePermissions
      ])
    });
  });

  it('should export space data successfully by space domain', async () => {
    const exportedData = await exportSpaceData({ spaceIdOrDomain: space.id });

    // High level assertions for documentation purposes

    expect(exportedData).toMatchObject<SpaceDataExport>({
      roles: expect.arrayContaining([proposalReviewerRole, secondProposalReviewerRole]),
      permissions: {
        proposalCategoryPermissions: expect.arrayContaining(proposalCategoryPermissions),
        spacePermissions: expect.arrayContaining(spacePermissions)
      },
      pages: expect.arrayContaining([proposalInCategory1, proposalInCategory2, proposalInCategory3]),
      proposalCategories: expect.arrayContaining([
        proposalCategory1WithoutPermissions,
        proposalCategory2WithSpacePermissions,
        proposalCategory3WithRolePermissions
      ])
    });
  });

  it('should export space data and write to a file when a filename is provided', async () => {
    // Params for calling export
    const filename = `test-export-${Date.now()}.json`;

    await exportSpaceData({ spaceIdOrDomain: space.id, filename });

    const filePath = path.resolve(`lib/templates/exports/${filename}`);

    const fileContent = JSON.parse(await fs.readFile(filePath, { encoding: 'utf-8' }));

    expect(fileContent).toMatchObject<SpaceDataExport>({
      roles: expect.arrayContaining([
        { ...proposalReviewerRole, createdAt: proposalReviewerRole.createdAt.toISOString() },
        { ...secondProposalReviewerRole, createdAt: secondProposalReviewerRole.createdAt.toISOString() }
      ]),
      permissions: {
        proposalCategoryPermissions: expect.arrayContaining(proposalCategoryPermissions),
        spacePermissions: expect.arrayContaining(spacePermissions)
      },
      pages: expect.arrayContaining(
        [proposalInCategory1, proposalInCategory2, proposalInCategory3].map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        }))
      ),
      proposalCategories: expect.arrayContaining([
        proposalCategory1WithoutPermissions,
        proposalCategory2WithSpacePermissions,
        proposalCategory3WithRolePermissions
      ])
    });
  });
});
