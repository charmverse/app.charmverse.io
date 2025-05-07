import fs from 'fs/promises';
import path from 'path';

import { InvalidInputError } from '@charmverse/core/errors';
import type { PageMeta } from '@charmverse/core/pages';
import type { AssignedPostCategoryPermission, TargetPermissionGroup } from '@charmverse/core/permissions';
import type {
  MemberProperty,
  MemberPropertyPermission,
  Post,
  PostCategory,
  Proposal,
  ProposalBlock,
  RewardBlock,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import {
  testUtilsForum,
  testUtilsMembers,
  testUtilsPages,
  testUtilsProposals,
  testUtilsUser
} from '@charmverse/core/test';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import { pageMetaSelect } from 'lib/pages/server/pageMetaSelect';
import { mapPostCategoryPermissionToAssignee } from '@packages/lib/permissions/forum/mapPostCategoryPermissionToAssignee';
import type { AssignedSpacePermission } from '@packages/lib/permissions/spaces/mapSpacePermissionToAssignee';
import { mapSpacePermissionToAssignee } from '@packages/lib/permissions/spaces/mapSpacePermissionToAssignee';

import { exportSpaceData, type SpaceDataExport } from '../exportSpaceData';
import type { SpaceDataImportResult } from '../importSpaceData';
import { importSpaceData } from '../importSpaceData';
import type { ImportedPermissions } from '../importSpacePermissions';
import { importSpacePermissions } from '../importSpacePermissions';

describe('importSpaceData', () => {
  let sourceSpace: Space;
  let sourceSpaceUser: User;

  let firstSourceProposal: Proposal;
  let firstSourceProposalPage: PageMeta;
  let secondSourceProposal: Proposal;
  let secondSourceProposalPage: PageMeta;

  let firstSourcePage: PageMeta;

  let firstSourcePostCategory: PostCategory;
  let secondSourcePostCategory: PostCategory;

  let posts: Post[];

  let firstSourceRole: Role;
  let secondSourceRole: Role;

  let exportedData: SpaceDataExport;

  let spacePermissions: AssignedSpacePermission[];
  let postCategoryPermissions: AssignedPostCategoryPermission[];

  let memberProperty: MemberProperty & { permissions: MemberPropertyPermission[] };

  let customProposalBlockBoard: ProposalBlock;
  let customProposalBlockView: ProposalBlock;

  let customRewardBlockBoard: RewardBlock;
  let customRewardBlockView: RewardBlock;

  const fileExportName = 'jest-test-import-space-data-import.json';

  beforeAll(async () => {
    ({ space: sourceSpace, user: sourceSpaceUser } = await testUtilsUser.generateUserAndSpace());

    firstSourceRole = await testUtilsMembers.generateRole({
      createdBy: sourceSpace.createdBy,
      spaceId: sourceSpace.id
    });

    secondSourceRole = await testUtilsMembers.generateRole({
      createdBy: sourceSpace.createdBy,
      spaceId: sourceSpace.id
    });

    firstSourcePostCategory = await testUtilsForum.generatePostCategory({
      spaceId: sourceSpace.id,
      name: 'Example created 1',
      permissions: [
        {
          assignee: { group: 'role', id: firstSourceRole.id },
          permissionLevel: 'full_access'
        },
        {
          assignee: { group: 'role', id: secondSourceRole.id },
          permissionLevel: 'comment_vote'
        },
        {
          assignee: { group: 'space', id: sourceSpace.id },
          permissionLevel: 'view'
        }
      ]
    });
    secondSourcePostCategory = await testUtilsForum.generatePostCategory({
      spaceId: sourceSpace.id,
      name: 'Example created 2',
      permissions: [
        {
          assignee: { group: 'role', id: firstSourceRole.id },
          permissionLevel: 'full_access'
        },
        {
          assignee: { group: 'role', id: secondSourceRole.id },
          permissionLevel: 'comment_vote'
        },
        {
          assignee: { group: 'space', id: sourceSpace.id },
          permissionLevel: 'view'
        }
      ]
    });

    spacePermissions = await prisma
      .$transaction([
        // Space
        prisma.spacePermission.create({
          data: {
            forSpace: { connect: { id: sourceSpace.id } },
            space: { connect: { id: sourceSpace.id } },
            operations: ['createBounty', 'createPage', 'createForumCategory']
          }
        }),
        // Roles
        prisma.spacePermission.create({
          data: {
            forSpace: { connect: { id: sourceSpace.id } },
            role: { connect: { id: firstSourceRole.id } },
            operations: ['createBounty', 'createPage', 'createForumCategory', 'deleteAnyPage', 'deleteAnyProposal']
          }
        }),
        prisma.spacePermission.create({
          data: {
            forSpace: { connect: { id: sourceSpace.id } },
            role: { connect: { id: secondSourceRole.id } },
            operations: ['createBounty', 'createPage', 'createForumCategory', 'deleteAnyPage', 'deleteAnyProposal']
          }
        })
      ])
      .then((data) => data.map(mapSpacePermissionToAssignee));

    postCategoryPermissions = await prisma.postCategoryPermission
      .findMany({
        where: { postCategory: { spaceId: sourceSpace.id } }
      })
      .then((data) => data.map(mapPostCategoryPermissionToAssignee));

    firstSourceProposal = await testUtilsProposals.generateProposal({
      spaceId: sourceSpace.id,
      userId: sourceSpaceUser.id
    });

    secondSourceProposal = await testUtilsProposals.generateProposal({
      spaceId: sourceSpace.id,
      userId: sourceSpaceUser.id
    });

    [firstSourceProposalPage, secondSourceProposalPage] = await Promise.all([
      prisma.page.findUniqueOrThrow({ where: { id: firstSourceProposal.id }, select: pageMetaSelect() }),
      prisma.page.findUniqueOrThrow({ where: { id: secondSourceProposal.id }, select: pageMetaSelect() })
    ]);

    firstSourcePage = await testUtilsPages
      .generatePage({
        createdBy: sourceSpaceUser.id,
        spaceId: sourceSpace.id,
        title: 'Example created 1',
        content: stubProsemirrorDoc({ text: 'Some text that should be copied' }),
        contentText: 'Some text that should be copied'
      })
      .then((p) => prisma.page.findUniqueOrThrow({ where: { id: p.id }, select: pageMetaSelect() }));

    sourceSpace = await prisma.space.update({
      where: { id: sourceSpace.id },
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
        createdBy: sourceSpaceUser.id,
        name: 'Test Member Property',
        type: 'text',
        updatedBy: sourceSpaceUser.id,
        space: { connect: { id: sourceSpace.id } },
        permissions: {
          create: {
            memberPropertyPermissionLevel: 'view',
            roleId: firstSourceRole.id
          }
        }
      },
      include: {
        permissions: true
      }
    });

    posts = await testUtilsForum.generateForumPosts({
      spaceId: sourceSpace.id,
      count: 3,
      createdBy: sourceSpaceUser.id,
      categoryId: firstSourcePostCategory.id
    });

    [customProposalBlockBoard, customProposalBlockView, customRewardBlockBoard, customRewardBlockView] =
      await Promise.all([
        prisma.proposalBlock.create({
          data: {
            id: '__defaultBoard',
            title: '',
            parentId: '',
            rootId: sourceSpace.id,
            spaceId: sourceSpace.id,
            type: 'board',
            schema: 1,
            createdBy: sourceSpace.createdBy,
            updatedBy: sourceSpace.createdBy,
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
            rootId: sourceSpace.id,
            spaceId: sourceSpace.id,
            type: 'view',
            schema: 1,
            createdBy: sourceSpace.createdBy,
            updatedBy: sourceSpace.createdBy,
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
            rootId: sourceSpace.id,
            spaceId: sourceSpace.id,
            type: 'board',
            schema: 1,
            createdBy: sourceSpace.createdBy,
            updatedBy: sourceSpace.createdBy,
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
            rootId: sourceSpace.id,
            spaceId: sourceSpace.id,
            type: 'view',
            schema: 1,
            createdBy: sourceSpace.createdBy,
            updatedBy: sourceSpace.createdBy,
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

    exportedData = await exportSpaceData({ spaceIdOrDomain: sourceSpace.id, filename: fileExportName });
  });

  it('should correctly import space data', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const importResult = await importSpaceData({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: exportedData
    });

    const updatedTargetSpace = await prisma.space.findUniqueOrThrow({
      where: {
        id: targetSpace.id
      },
      include: {
        memberProperties: {
          include: {
            permissions: true
          }
        }
      }
    });

    expect(importResult).toMatchObject<SpaceDataImportResult>({
      posts: expect.arrayContaining(
        posts.map((post) => ({
          ...post,
          id: expect.any(String),
          path: expect.any(String),
          spaceId: targetSpace.id,
          createdBy: targetSpace.createdBy,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          categoryId: expect.any(String)
        }))
      ),
      space: {
        notificationToggles: sourceSpace.notificationToggles,
        features: sourceSpace.features,
        memberProfiles: sourceSpace.memberProfiles,
        proposalWorkflows: [],
        defaultPagePermissionGroup: sourceSpace.defaultPagePermissionGroup,
        defaultPublicPages: sourceSpace.defaultPublicPages,
        hiddenFeatures: sourceSpace.hiddenFeatures,
        publicBountyBoard: sourceSpace.publicBountyBoard,
        publicProposals: sourceSpace.publicProposals,
        requireProposalTemplate: sourceSpace.requireProposalTemplate,
        proposalBlocks: expect.arrayContaining<ProposalBlock>([
          {
            ...customProposalBlockBoard,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          },
          {
            ...customProposalBlockView,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          }
        ]),
        rewardBlocks: expect.arrayContaining<RewardBlock>([
          {
            ...customRewardBlockBoard,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          },
          {
            ...customRewardBlockView,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          }
        ]),
        memberProperties: [
          {
            ...memberProperty,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            id: expect.any(String),
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            spaceId: targetSpace.id,
            permissions: [
              {
                id: expect.any(String),
                memberPropertyId: updatedTargetSpace.memberProperties[0].id,
                roleId: importResult.oldNewHashMaps.roles[firstSourceRole.id],
                memberPropertyPermissionLevel: 'view'
              }
            ]
          }
        ]
      },
      postCategories: expect.arrayContaining([
        { ...firstSourcePostCategory, spaceId: targetSpace.id, id: expect.any(String) }
      ]),
      roles: expect.arrayContaining([
        {
          ...firstSourceRole,
          createdAt: expect.any(Date),
          createdBy: targetSpace.createdBy,
          id: expect.not.stringContaining(firstSourceRole.id),
          spaceId: targetSpace.id
        },
        {
          ...secondSourceRole,
          createdAt: expect.any(Date),
          createdBy: targetSpace.createdBy,
          id: expect.not.stringContaining(secondSourceRole.id),
          spaceId: targetSpace.id
        }
      ]),
      permissions: {
        postCategoryPermissions: expect.arrayContaining(
          postCategoryPermissions.map((p) => ({
            permissionLevel: p.permissionLevel,
            id: expect.any(String),
            postCategoryId: expect.any(String),
            assignee: {
              group: p.assignee.group,
              id: p.assignee.group === 'space' ? targetSpace.id : expect.any(String)
            } as TargetPermissionGroup<'role' | 'space'>
          }))
        ),
        spacePermissions: expect.arrayContaining<AssignedSpacePermission>(
          spacePermissions.map((p) => ({
            operations: p.operations,
            assignee: {
              group: p.assignee.group,
              id: p.assignee.group === 'space' ? targetSpace.id : expect.any(String)
            }
          }))
        )
      },
      pages: expect.arrayContaining(
        [firstSourceProposalPage, secondSourceProposalPage, firstSourcePage].map((p) =>
          expect.objectContaining<Partial<PageMeta>>({
            title: p.title,
            type: p.type,
            id: expect.any(String),
            path: expect.any(String),
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        )
      ),
      oldNewHashMaps: {
        pages: {
          [firstSourceProposalPage.id]: expect.any(String),
          [secondSourceProposalPage.id]: expect.any(String),
          [firstSourcePage.id]: expect.any(String)
        },
        postCategories: {
          [firstSourcePostCategory.id]: expect.any(String)
        },
        roles: {
          [firstSourceRole.id]: expect.any(String),
          [secondSourceRole.id]: expect.any(String)
        },
        posts: {
          [posts[0].id]: expect.any(String),
          [posts[1].id]: expect.any(String),
          [posts[2].id]: expect.any(String)
        }
      }
    });
  });

  it('should correctly import space data from a static file', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const importResult = await importSpaceData({
      targetSpaceIdOrDomain: targetSpace.id,
      exportName: fileExportName
    });

    const updatedTargetSpace = await prisma.space.findUniqueOrThrow({
      where: {
        id: targetSpace.id
      },
      include: {
        memberProperties: {
          include: {
            permissions: true
          }
        }
      }
    });

    expect(importResult).toMatchObject<SpaceDataImportResult>({
      posts: expect.arrayContaining(
        posts.map((post) => ({
          ...post,
          id: expect.any(String),
          path: expect.any(String),
          spaceId: targetSpace.id,
          createdBy: targetSpace.createdBy,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          categoryId: expect.any(String)
        }))
      ),
      space: {
        notificationToggles: sourceSpace.notificationToggles,
        features: sourceSpace.features,
        memberProfiles: sourceSpace.memberProfiles,
        defaultPagePermissionGroup: sourceSpace.defaultPagePermissionGroup,
        defaultPublicPages: sourceSpace.defaultPublicPages,
        hiddenFeatures: sourceSpace.hiddenFeatures,
        publicBountyBoard: sourceSpace.publicBountyBoard,
        publicProposals: sourceSpace.publicProposals,
        requireProposalTemplate: sourceSpace.requireProposalTemplate,
        proposalWorkflows: [],
        proposalBlocks: expect.arrayContaining<ProposalBlock>([
          {
            ...customProposalBlockBoard,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          },
          {
            ...customProposalBlockView,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          }
        ]),
        rewardBlocks: expect.arrayContaining<RewardBlock>([
          {
            ...customRewardBlockBoard,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          },
          {
            ...customRewardBlockView,
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          }
        ]),
        memberProperties: [
          {
            ...memberProperty,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            id: expect.any(String),
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            spaceId: targetSpace.id,
            permissions: [
              {
                id: expect.any(String),
                memberPropertyId: updatedTargetSpace.memberProperties[0].id,
                roleId: importResult.oldNewHashMaps.roles[firstSourceRole.id],
                memberPropertyPermissionLevel: 'view'
              }
            ]
          }
        ]
      },
      postCategories: expect.arrayContaining([
        { ...firstSourcePostCategory, spaceId: targetSpace.id, id: expect.any(String) }
      ]),
      roles: expect.arrayContaining([
        {
          ...firstSourceRole,
          createdAt: expect.any(Date),
          createdBy: targetSpace.createdBy,
          id: expect.not.stringContaining(firstSourceRole.id),
          spaceId: targetSpace.id
        },
        {
          ...secondSourceRole,
          createdAt: expect.any(Date),
          createdBy: targetSpace.createdBy,
          id: expect.not.stringContaining(secondSourceRole.id),
          spaceId: targetSpace.id
        }
      ]),
      permissions: {
        postCategoryPermissions: expect.arrayContaining(
          postCategoryPermissions.map((p) => ({
            permissionLevel: p.permissionLevel,
            id: expect.any(String),
            postCategoryId: expect.any(String),
            assignee: {
              group: p.assignee.group,
              id: p.assignee.group === 'space' ? targetSpace.id : expect.any(String)
            } as TargetPermissionGroup<'role' | 'space'>
          }))
        ),
        spacePermissions: expect.arrayContaining<AssignedSpacePermission>(
          spacePermissions.map((p) => ({
            operations: p.operations,
            assignee: {
              group: p.assignee.group,
              id: p.assignee.group === 'space' ? targetSpace.id : expect.any(String)
            }
          }))
        )
      },
      pages: expect.arrayContaining(
        [firstSourceProposalPage, secondSourceProposalPage, firstSourcePage].map((p) =>
          expect.objectContaining<Partial<PageMeta>>({
            title: p.title,
            type: p.type,
            id: expect.any(String),
            path: expect.any(String),
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        )
      ),
      oldNewHashMaps: {
        pages: {
          [firstSourceProposalPage.id]: expect.any(String),
          [secondSourceProposalPage.id]: expect.any(String),
          [firstSourcePage.id]: expect.any(String)
        },
        postCategories: {
          [firstSourcePostCategory.id]: expect.any(String)
        },
        roles: {
          [firstSourceRole.id]: expect.any(String),
          [secondSourceRole.id]: expect.any(String)
        },
        posts: {
          [posts[0].id]: expect.any(String),
          [posts[1].id]: expect.any(String),
          [posts[2].id]: expect.any(String)
        }
      }
    });
  });

  it('should throw InvalidInputError if targetSpaceIdOrDomain is missing', async () => {
    await expect(importSpaceData({ exportData: exportedData } as any)).rejects.toThrow(InvalidInputError);
  });

  it('should throw NotFoundError for a non-existent target space', async () => {
    const nonExistentDomain = 'nonexistentdomain.com';
    await expect(
      importSpaceData({
        targetSpaceIdOrDomain: nonExistentDomain,
        exportData: exportedData
      })
    ).rejects.toThrowError();
  });

  it('should perform a no-op if no import data is provided', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();
    await expect(
      importSpacePermissions({
        targetSpaceIdOrDomain: targetSpace.id,
        exportData: {} as any // Invalid data for testing
      })
    ).resolves.toMatchObject<ImportedPermissions>({
      postCategoryPermissions: [],
      roles: [],
      spacePermissions: []
    });
  });

  afterAll(async () => {
    const exportDir = path.resolve(`lib/templates/exports/`);

    const files = await fs.readdir(exportDir);

    for (const fileName of files) {
      if (fileName.startsWith('jest-test-import-')) {
        await fs.unlink(path.join(exportDir, fileName));
      }
    }
  });
});
