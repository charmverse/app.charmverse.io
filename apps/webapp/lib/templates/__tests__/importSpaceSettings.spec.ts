import type {
  MemberProperty,
  MemberPropertyPermission,
  ProposalBlock,
  ProposalWorkflow,
  RewardBlock,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import type { BoardFields } from '@packages/databases/board';
import type { BoardViewFields } from '@packages/databases/boardView';
import { v4 as uuid } from 'uuid';

import type { SpaceDataExport } from '../exportSpaceData';
import type { SpaceSettingsExport } from '../exportSpaceSettings';
import { importRoles } from '../importRoles';
import { importSpaceSettings } from '../importSpaceSettings';

describe('importSpaceSettings', () => {
  let user: User;
  let sourceSpace: Space;
  let role: Role;
  let memberProperty: MemberProperty & { permissions: MemberPropertyPermission[] };

  let dataToImport: Pick<SpaceDataExport, 'roles' | 'space'>;
  let customProposalBlockBoard: ProposalBlock;
  let customProposalBlockView: ProposalBlock;

  let customRewardBlockBoard: RewardBlock;
  let customRewardBlockView: RewardBlock;

  let proposalWorkflow: ProposalWorkflowTyped;

  beforeAll(async () => {
    ({ user, space: sourceSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: sourceSpace.id
    });

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
        createdBy: user.id,
        name: 'Test Member Property',
        type: 'text',
        updatedBy: user.id,
        space: { connect: { id: sourceSpace.id } },
        permissions: {
          create: {
            memberPropertyPermissionLevel: 'view',
            roleId: role.id
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
              columnWidths: { __title: 400, __status: 150, __authors: 150, __category: 200, __reviewers: 150 },
              hiddenOptionIds: [],
              columnWrappedIds: [],
              visibleOptionIds: [],
              defaultTemplateId: '',
              columnCalculations: {},
              kanbanCalculations: {},
              visiblePropertyIds: ['__category', '__status', '__evaluationType', '__authors', '__reviewers']
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

    proposalWorkflow = {
      createdAt: new Date(),
      privateEvaluations: false,
      id: uuid(),
      index: 0,
      spaceId: sourceSpace.id,
      title: `Unique - ${uuid()}`,
      archived: false,
      evaluations: [
        {
          title: 'Community',
          id: uuid(),
          type: 'feedback',
          permissions: [
            { operation: 'comment', roleId: role.id },
            { operation: 'view', userId: user.id },
            { operation: 'archive', systemRole: 'author' }
          ]
        },
        {
          title: 'Rubric',
          id: uuid(),
          type: 'rubric',
          permissions: [
            { operation: 'comment', roleId: role.id },
            { operation: 'view', userId: user.id },
            { operation: 'archive', systemRole: 'author' }
          ]
        }
      ],
      draftReminder: false
    };

    dataToImport = {
      roles: [role],
      space: {
        ...sourceSpace,
        proposalBlocks: [customProposalBlockBoard, customProposalBlockView],
        proposalWorkflows: [proposalWorkflow as ProposalWorkflow],
        rewardBlocks: [customRewardBlockBoard, customRewardBlockView],
        memberProperties: [memberProperty]
      }
    };
  });

  it('should import space settings correctly', async () => {
    // Simulate export data
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const { oldNewRecordIdHashMap: oldNewRoleIdHashMap } = await importRoles({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: dataToImport
    });

    const updatedSpace = await importSpaceSettings({
      oldNewRoleIdHashMap,
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: dataToImport
    });

    const targetSpaceRoles = await prisma.role.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    expect(updatedSpace).toMatchObject(
      expect.objectContaining<SpaceSettingsExport>({
        notificationToggles: sourceSpace.notificationToggles,
        features: sourceSpace.features,
        memberProfiles: sourceSpace.memberProfiles,
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
                memberPropertyId: updatedSpace.memberProperties[0].id,
                roleId: targetSpaceRoles[0].id,
                memberPropertyPermissionLevel: 'view'
              }
            ]
          }
        ],
        // This is tested in a sepearate test
        proposalWorkflows: expect.anything()
      })
    );
  });

  it('should merge custom block settings settings correctly', async () => {
    // Simulate export data
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const customPropertyUuid = uuid();
    const customViewUuid = uuid();

    const [
      customTargetSpaceProposalBlockBoard,
      customTargetSpaceProposalBlockView,
      customTargetSpaceRewardBlockBoard,
      customTargetSpaceRewardBlockView
    ] = await Promise.all([
      prisma.proposalBlock.create({
        data: {
          id: '__defaultBoard',
          title: '',
          parentId: '',
          rootId: targetSpace.id,
          spaceId: targetSpace.id,
          type: 'board',
          schema: 1,
          createdBy: targetSpace.createdBy,
          updatedBy: targetSpace.createdBy,
          fields: {
            icon: '',
            viewIds: [customViewUuid],
            isTemplate: false,
            description: '',
            headerImage: null,
            cardProperties: [{ id: customPropertyUuid, name: 'Person', type: 'person', options: [] }],
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
          rootId: targetSpace.id,
          spaceId: targetSpace.id,
          type: 'view',
          schema: 1,
          createdBy: targetSpace.createdBy,
          updatedBy: targetSpace.createdBy,
          fields: {
            filter: { filters: [], operation: 'and' },
            viewType: 'table',
            cardOrder: [],
            openPageIn: 'center_peek',
            sortOptions: [{ reversed: false, propertyId: customPropertyUuid }],
            columnWidths: {
              [customPropertyUuid]: 200
            },
            hiddenOptionIds: [],
            columnWrappedIds: [],
            visibleOptionIds: [],
            defaultTemplateId: '',
            columnCalculations: {},
            kanbanCalculations: {},
            visiblePropertyIds: [
              '__category',
              '__status',
              '__evaluationType',
              '__authors',
              '__reviewers',
              customPropertyUuid
            ]
          }
        }
      }),
      prisma.rewardBlock.create({
        data: {
          id: '__defaultBoard',
          title: '',
          parentId: '',
          rootId: targetSpace.id,
          spaceId: targetSpace.id,
          type: 'board',
          schema: 1,
          createdBy: targetSpace.createdBy,
          updatedBy: targetSpace.createdBy,
          fields: {
            icon: '',
            viewIds: [customViewUuid],
            isTemplate: false,
            description: '',
            headerImage: null,
            cardProperties: [{ id: customPropertyUuid, name: 'Person', type: 'person', options: [] }],
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
          rootId: targetSpace.id,
          spaceId: targetSpace.id,
          type: 'view',
          schema: 1,
          createdBy: targetSpace.createdBy,
          updatedBy: targetSpace.createdBy,
          fields: {
            filter: { filters: [], operation: 'and' },
            viewType: 'table',
            cardOrder: [],
            openPageIn: 'center_peek',
            sortOptions: [{ reversed: false, propertyId: '__title' }],
            columnWidths: {
              [customPropertyUuid]: 300
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
              '__rewardCustomValue',
              customPropertyUuid
            ]
          }
        }
      })
    ]);

    const { oldNewRecordIdHashMap: oldNewRoleIdHashMap } = await importRoles({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: dataToImport
    });

    const updatedSpace = await importSpaceSettings({
      oldNewRoleIdHashMap,
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: dataToImport
    });

    const targetSpaceRoles = await prisma.role.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    expect(updatedSpace).toMatchObject(
      expect.objectContaining<SpaceSettingsExport>({
        notificationToggles: sourceSpace.notificationToggles,
        features: sourceSpace.features,
        memberProfiles: sourceSpace.memberProfiles,
        defaultPagePermissionGroup: sourceSpace.defaultPagePermissionGroup,
        defaultPublicPages: sourceSpace.defaultPublicPages,
        hiddenFeatures: sourceSpace.hiddenFeatures,
        publicBountyBoard: sourceSpace.publicBountyBoard,
        publicProposals: sourceSpace.publicProposals,
        requireProposalTemplate: sourceSpace.requireProposalTemplate,
        proposalBlocks: expect.arrayContaining<ProposalBlock>([
          {
            ...customProposalBlockBoard,
            fields: {
              ...(customProposalBlockBoard.fields as any),
              cardProperties: expect.arrayContaining([
                ...(customProposalBlockBoard.fields as any as BoardFields).cardProperties,
                ...(customTargetSpaceProposalBlockBoard.fields as any as BoardFields).cardProperties
              ]),
              viewIds: [customViewUuid]
            },
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          },
          {
            ...customProposalBlockView,
            fields: {
              ...(customProposalBlockView.fields as any),
              sortOptions: expect.arrayContaining([
                ...(customProposalBlockView.fields as any as BoardViewFields).sortOptions,
                ...(customTargetSpaceProposalBlockView.fields as any as BoardViewFields).sortOptions
              ]),
              columnWidths: {
                ...(customProposalBlockView.fields as any as BoardViewFields).columnWidths,
                ...(customTargetSpaceProposalBlockView.fields as any as BoardViewFields).columnWidths
              },
              visiblePropertyIds: expect.arrayContaining([
                ...(customProposalBlockView.fields as any as BoardViewFields).visiblePropertyIds,
                ...(customTargetSpaceProposalBlockView.fields as any as BoardViewFields).visiblePropertyIds
              ])
            },
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          }
        ]),
        // This is tested in a sepearate test
        proposalWorkflows: expect.anything(),
        rewardBlocks: expect.arrayContaining<RewardBlock>([
          {
            ...customRewardBlockBoard,
            fields: {
              ...(customRewardBlockBoard.fields as any),
              cardProperties: expect.arrayContaining([
                ...(customRewardBlockBoard.fields as any as BoardFields).cardProperties,
                ...(customTargetSpaceRewardBlockBoard.fields as any as BoardFields).cardProperties
              ]),
              viewIds: [customViewUuid]
            },
            rootId: targetSpace.id,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          },
          {
            ...customRewardBlockView,
            fields: {
              ...(customRewardBlockView.fields as any),
              sortOptions: expect.arrayContaining([
                ...(customRewardBlockView.fields as any as BoardViewFields).sortOptions,
                ...(customTargetSpaceRewardBlockView.fields as any as BoardViewFields).sortOptions
              ]),
              columnWidths: {
                ...(customRewardBlockView.fields as any as BoardViewFields).columnWidths,
                ...(customTargetSpaceRewardBlockView.fields as any as BoardViewFields).columnWidths
              },
              visiblePropertyIds: expect.arrayContaining([
                ...(customRewardBlockView.fields as any as BoardViewFields).visiblePropertyIds,
                ...(customTargetSpaceRewardBlockView.fields as any as BoardViewFields).visiblePropertyIds
              ])
            },
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
                memberPropertyId: updatedSpace.memberProperties[0].id,
                roleId: targetSpaceRoles[0].id,
                memberPropertyPermissionLevel: 'view'
              }
            ]
          }
        ]
      })
    );
  });

  it('should import proposal workflows, and replace roleIds for permissions, and dropping permissions with userIds', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const existingProposalWorkflow = await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        title: 'Existing workflow',
        evaluations: [{ id: uuid(), permissions: [], title: 'Feedback', type: 'feedback' }] as WorkflowEvaluationJson[],
        space: { connect: { id: targetSpace.id } }
      }
    });
    const targetSpaceRoles = await prisma.role.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    const { oldNewRecordIdHashMap } = await importRoles({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: dataToImport
    });

    const updatedSpace = await importSpaceSettings({
      oldNewRoleIdHashMap: oldNewRecordIdHashMap,
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: dataToImport
    });

    expect(updatedSpace.oldNewProposalWorkflowIds).toMatchObject({
      [proposalWorkflow.id]: expect.any(String)
    });

    expect(updatedSpace.proposalWorkflows).toMatchObject(
      expect.arrayContaining<ProposalWorkflowTyped>([
        {
          id: expect.not.stringMatching(proposalWorkflow.id),
          index: proposalWorkflow.index,
          title: proposalWorkflow.title,
          spaceId: targetSpace.id,
          privateEvaluations: proposalWorkflow.privateEvaluations,
          // id: expect.stringMatching(existingProposalWorkflow.id),
          createdAt: expect.any(Date),
          evaluations: [
            {
              title: proposalWorkflow.evaluations[0].title,
              id: expect.any(String),
              type: proposalWorkflow.evaluations[0].type,
              permissions: [
                {
                  operation: 'comment',
                  roleId: expect.not.stringContaining(role.id)
                  // roleId: expect((val) => targetSpaceRoles.some((r) => r.id === val))
                },
                { operation: 'archive', systemRole: 'author' }
              ]
            },
            {
              title: proposalWorkflow.evaluations[1].title,
              id: expect.any(String),
              type: proposalWorkflow.evaluations[1].type,
              permissions: [
                { operation: 'comment', roleId: expect.not.stringContaining(role.id) },
                { operation: 'archive', systemRole: 'author' }
              ]
            }
          ],
          draftReminder: false,
          archived: false
        },
        {
          ...existingProposalWorkflow
        } as ProposalWorkflowTyped
      ])
    );
  });

  it('should throw an error for missing space in import data', async () => {
    await expect(
      importSpaceSettings({ oldNewRoleIdHashMap: {}, targetSpaceIdOrDomain: null as any, exportData: {} })
    ).rejects.toThrow();
  });
});
