import type {
  MemberProperty,
  MemberPropertyPermission,
  Prisma,
  ProposalBlock,
  ProposalWorkflow,
  RewardBlock,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsMembers } from '@charmverse/core/test';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { v4 as uuid } from 'uuid';

import type { SpaceSettingsExport } from '../exportSpaceSettings';
import { exportSpaceSettings } from '../exportSpaceSettings';

describe('exportSpaceSettings', () => {
  let user: User;
  let space: Space;
  let role: Role;
  let memberProperty: MemberProperty & { permissions: MemberPropertyPermission[] };

  let customProposalBlockBoard: ProposalBlock;
  let customProposalBlockView: ProposalBlock;

  let customRewardBlockBoard: RewardBlock;
  let customRewardBlockView: RewardBlock;

  let proposalWorkflow: ProposalWorkflowTyped;

  beforeAll(async () => {
    ({ user, space } = await generateUserAndSpace({ isAdmin: true }));
    role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

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
    proposalWorkflow = (await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        title: 'Default',
        space: { connect: { id: space.id } },
        evaluations: [{ id: uuid(), permissions: [], title: 'Example', type: 'feedback' }] as WorkflowEvaluationJson[]
      }
    })) as ProposalWorkflowTyped;
  });

  it('should export space settings correctly', async () => {
    const exportedSettings = await exportSpaceSettings({ spaceIdOrDomain: space.id });

    expect(exportedSettings).toMatchObject<{ space: SpaceSettingsExport }>({
      space: {
        proposalBlocks: expect.arrayContaining<ProposalBlock>([customProposalBlockBoard, customProposalBlockView]),
        proposalWorkflows: [proposalWorkflow as ProposalWorkflow],
        rewardBlocks: expect.arrayContaining<RewardBlock>([customRewardBlockBoard, customRewardBlockView]),
        notificationToggles: space.notificationToggles,
        features: space.features,
        memberProfiles: space.memberProfiles,
        defaultPagePermissionGroup: space.defaultPagePermissionGroup,
        defaultPublicPages: space.defaultPublicPages,
        hiddenFeatures: space.hiddenFeatures,
        publicBountyBoard: space.publicBountyBoard,
        publicProposals: space.publicProposals,
        requireProposalTemplate: space.requireProposalTemplate,
        memberProperties: [
          {
            ...memberProperty,
            permissions: memberProperty.permissions
          }
        ]
      }
    });
  });

  it('should throw an error for invalid spaceIdOrDomain', async () => {
    await expect(exportSpaceSettings({ spaceIdOrDomain: 'invalid-id' })).rejects.toThrow();
    await expect(exportSpaceSettings({ spaceIdOrDomain: undefined as any })).rejects.toThrow();
  });
});
