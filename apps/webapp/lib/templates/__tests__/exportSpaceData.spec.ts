import fs from 'fs/promises';
import path from 'path';

import type {
  MemberProperty,
  MemberPropertyPermission,
  Post,
  PostCategory,
  ProposalBlock,
  RewardBlock,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import type { AssignedPostCategoryPermission } from '@packages/core/permissions';
import { mapPostCategoryPermissionToAssignee } from '@packages/lib/permissions/forum/mapPostCategoryPermissionToAssignee';
import {
  mapSpacePermissionToAssignee,
  type AssignedSpacePermission
} from '@packages/lib/permissions/spaces/mapSpacePermissionToAssignee';

import type { SpaceDataExport } from '../exportSpaceData';
import { exportSpaceData } from '../exportSpaceData';
import type { ExportedPage } from '../exportWorkspacePages';

describe.skip('exportSpaceData', () => {
  let space: Space;
  let user: User;

  let proposalReviewerRole: Role;
  let secondProposalReviewerRole: Role;

  let spacePermissions: AssignedSpacePermission[];
  let postCategoryPermissions: AssignedPostCategoryPermission[];

  let postCategoryWithPermissions: PostCategory;

  let posts: Post[];

  let proposalInCategory1: ExportedPage;

  let proposalInCategory2: ExportedPage;
  let proposalInCategory3: ExportedPage;

  let memberProperty: MemberProperty & { permissions: MemberPropertyPermission[] };
  let customProposalBlockBoard: ProposalBlock;
  let customProposalBlockView: ProposalBlock;

  let customRewardBlockBoard: RewardBlock;
  let customRewardBlockView: RewardBlock;

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

    [postCategoryWithPermissions] = await Promise.all([
      testUtilsForum.generatePostCategory({
        spaceId: space.id,
        name: 'Example category xx',
        permissions: [
          { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'comment_vote' },
          {
            assignee: { group: 'role', id: secondProposalReviewerRole.id },
            permissionLevel: 'full_access'
          },
          {
            assignee: { group: 'space', id: space.id },
            permissionLevel: 'view'
          }
        ]
      })
    ]);

    posts = await testUtilsForum.generateForumPosts({
      count: 3,
      createdBy: space.createdBy,
      spaceId: space.id,
      categoryId: postCategoryWithPermissions.id
    });

    postCategoryPermissions = await prisma.postCategoryPermission
      .findMany({
        where: {
          postCategory: {
            spaceId: space.id
          }
        }
      })
      .then((data) => data.map(mapPostCategoryPermissionToAssignee));

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
                evaluations: {
                  include: {
                    reviewers: true,
                    rubricCriteria: true,
                    permissions: true
                  }
                }
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
                evaluations: {
                  include: {
                    reviewers: true,
                    rubricCriteria: true,
                    permissions: true
                  }
                }
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
                evaluations: {
                  include: {
                    reviewers: true,
                    rubricCriteria: true,
                    permissions: true
                  }
                }
              }
            }
          }
        })
      )
      .then((p) => ({ ...p, children: [], permissions: [] }));

    space = await prisma.space.update({
      where: { id: space.id },
      data: {
        notificationToggles: { polls: false, proposals: false },
        features: [
          {
            id: 'rewards',
            path: 'rewards',
            title: 'Jobs',
            isHidden: false
          },
          {
            id: 'member_directory',
            path: 'members',
            title: 'Membership Registry',
            isHidden: false
          },
          {
            id: 'proposals',
            path: 'proposals',
            title: 'Proposals',
            isHidden: true
          },
          {
            id: 'bounties',
            path: 'bounties',
            title: 'Bounties',
            isHidden: true
          },
          {
            id: 'forum',
            path: 'forum',
            title: 'Forum',
            isHidden: false
          }
        ],
        memberProfiles: [
          {
            id: 'charmverse',
            title: 'CharmVerse',
            isHidden: false
          },
          {
            id: 'collection',
            title: 'Collection',
            isHidden: true
          },
          {
            id: 'ens',
            title: 'ENS',
            isHidden: true
          },
          {
            id: 'lens',
            title: 'Lens',
            isHidden: false
          },
          {
            id: 'summon',
            title: 'Summon',
            isHidden: false
          }
        ]
      }
    });

    memberProperty = await prisma.memberProperty.create({
      data: {
        createdBy: user.id,
        name: 'Test Member Property',
        type: 'text',
        updatedBy: user.id,
        space: { connect: { id: space.id } },
        permissions: {
          create: {
            memberPropertyPermissionLevel: 'view',
            roleId: proposalReviewerRole.id
          }
        }
      },
      include: {
        permissions: true
      }
    });

    [customProposalBlockBoard, customProposalBlockView, customRewardBlockBoard, customRewardBlockView] =
      await Promise.all([
        prisma.proposalBlock.create({
          data: {
            id: '__defaultBoard',
            title: '',
            parentId: '',
            rootId: space.id,
            spaceId: space.id,
            type: 'board',
            schema: 1,
            createdBy: space.createdBy,
            updatedBy: space.createdBy,
            fields: {
              icon: '',
              viewIds: [],
              isTemplate: false,
              description: '',
              headerImage: null,
              cardProperties: [
                { id: 'c9db9654-65db-4a34-98d5-faf13cb571dd', name: 'Person', type: 'person', options: [] }
              ],
              showDescription: false,
              columnCalculations: []
            }
          }
        }),
        prisma.proposalBlock.create({
          data: {
            id: '__defaultView',
            title: '',
            parentId: '__defaultBoard',
            rootId: space.id,
            spaceId: space.id,
            type: 'view',
            schema: 1,
            createdBy: space.createdBy,
            updatedBy: space.createdBy,
            fields: {
              filter: { filters: [], operation: 'and' },
              viewType: 'table',
              cardOrder: [],
              openPageIn: 'center_peek',
              sortOptions: [{ reversed: false, propertyId: '__title' }],
              columnWidths: { __title: 400, __status: 150, __authors: 150, __reviewers: 150 },
              hiddenOptionIds: [],
              columnWrappedIds: [],
              visibleOptionIds: [],
              defaultTemplateId: '',
              columnCalculations: {},
              kanbanCalculations: {},
              visiblePropertyIds: ['__status', '__evaluationType', '__authors', '__reviewers']
            }
          }
        }),
        prisma.rewardBlock.create({
          data: {
            id: '__defaultBoard',
            title: '',
            parentId: '',
            rootId: space.id,
            spaceId: space.id,
            type: 'board',
            schema: 1,
            createdBy: space.createdBy,
            updatedBy: space.createdBy,
            fields: {
              icon: '',
              viewIds: [],
              isTemplate: false,
              description: '',
              headerImage: null,
              cardProperties: [
                { id: '5234ba6a-c6ac-4202-ba81-f14fb2e4cbe8', name: 'Person', type: 'person', options: [] }
              ],
              showDescription: false,
              columnCalculations: []
            }
          }
        }),
        prisma.rewardBlock.create({
          data: {
            id: '__defaultView',
            title: '',
            parentId: '__defaultBoard',
            rootId: space.id,
            spaceId: space.id,
            type: 'view',
            schema: 1,
            createdBy: space.createdBy,
            updatedBy: space.createdBy,
            fields: {
              filter: { filters: [], operation: 'and' },
              viewType: 'table',
              cardOrder: [],
              openPageIn: 'center_peek',
              sortOptions: [{ reversed: false, propertyId: '__title' }],
              columnWidths: {
                __limit: 150,
                __title: 400,
                __available: 150,
                __reviewers: 150,
                __applicants: 200,
                __rewardChain: 150,
                __rewardAmount: 150,
                __rewardStatus: 150,
                __rewardCustomValue: 150
              },
              hiddenOptionIds: [],
              columnWrappedIds: ['__title'],
              visibleOptionIds: [],
              defaultTemplateId: '',
              columnCalculations: {},
              kanbanCalculations: {},
              visiblePropertyIds: [
                '__limit',
                '__applicants',
                '__reviewers',
                '__available',
                '__rewardStatus',
                '__rewardAmount',
                '__rewardChain',
                '__rewardCustomValue'
              ]
            }
          }
        })
      ]);
  });

  it('should export space data successfully by space ID', async () => {
    const exportedData = await exportSpaceData({ spaceIdOrDomain: space.id });

    // High level assertions for documentation purposes
    expect(exportedData).toHaveProperty('pages');
    expect(exportedData).toHaveProperty('roles');
    expect(exportedData).toHaveProperty('permissions');

    expect(exportedData).toMatchObject<SpaceDataExport>({
      space: {
        proposalBlocks: expect.arrayContaining([customProposalBlockBoard, customProposalBlockView]),
        proposalWorkflows: [],
        rewardBlocks: expect.arrayContaining([customRewardBlockBoard, customRewardBlockView]),
        features: space.features,
        memberProfiles: space.memberProfiles,
        memberProperties: [memberProperty],
        notificationToggles: space.notificationToggles,
        defaultPagePermissionGroup: space.defaultPagePermissionGroup,
        defaultPublicPages: space.defaultPublicPages,
        hiddenFeatures: space.hiddenFeatures,
        publicBountyBoard: space.publicBountyBoard,
        publicProposals: space.publicProposals,
        requireProposalTemplate: space.requireProposalTemplate
      },
      roles: expect.arrayContaining([proposalReviewerRole, secondProposalReviewerRole]),
      permissions: {
        postCategoryPermissions: expect.arrayContaining(postCategoryPermissions),
        spacePermissions: expect.arrayContaining(spacePermissions)
      },
      pages: expect.arrayContaining([proposalInCategory1, proposalInCategory2, proposalInCategory3]),
      postCategories: expect.arrayContaining([postCategoryWithPermissions]),
      posts: expect.arrayContaining(posts)
    });
  });

  it('should export space data successfully by space domain', async () => {
    const exportedData = await exportSpaceData({ spaceIdOrDomain: space.domain });

    // High level assertions for documentation purposes

    expect(exportedData).toMatchObject<SpaceDataExport>({
      space: {
        proposalBlocks: expect.arrayContaining([customProposalBlockBoard, customProposalBlockView]),
        proposalWorkflows: [],
        rewardBlocks: expect.arrayContaining([customRewardBlockBoard, customRewardBlockView]),
        features: space.features,
        memberProfiles: space.memberProfiles,
        memberProperties: [memberProperty],
        notificationToggles: space.notificationToggles,
        defaultPagePermissionGroup: space.defaultPagePermissionGroup,
        defaultPublicPages: space.defaultPublicPages,
        hiddenFeatures: space.hiddenFeatures,
        publicBountyBoard: space.publicBountyBoard,
        publicProposals: space.publicProposals,
        requireProposalTemplate: space.requireProposalTemplate
      },
      roles: expect.arrayContaining([proposalReviewerRole, secondProposalReviewerRole]),
      permissions: {
        spacePermissions: expect.arrayContaining(spacePermissions),
        postCategoryPermissions: expect.arrayContaining(postCategoryPermissions)
      },
      pages: expect.arrayContaining([proposalInCategory1, proposalInCategory2, proposalInCategory3]),
      postCategories: expect.arrayContaining([postCategoryWithPermissions]),
      posts: expect.arrayContaining(posts)
    });
  });

  it.skip('should export space data and write to a file when a filename is provided', async () => {
    // Params for calling export
    const filename = `jest-test-export-${Date.now()}.json`;

    await exportSpaceData({ spaceIdOrDomain: space.id, filename });

    const filePath = path.resolve(`lib/templates/exports/${filename}`);

    const fileContent = JSON.parse(await fs.readFile(filePath, { encoding: 'utf-8' }));

    expect(fileContent).toBeDefined();
  });

  afterAll(async () => {
    const exportDir = path.resolve(`lib/templates/exports/`);

    const files = await fs.readdir(exportDir);

    for (const fileName of files) {
      if (fileName.startsWith('jest-test-export-')) {
        await fs.unlink(path.join(exportDir, fileName));
      }
    }
  });
});
