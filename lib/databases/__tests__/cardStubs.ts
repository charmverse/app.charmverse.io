import { v4 as uuid } from 'uuid';

const propertyIdStep = '__step';

const filterId1 = uuid();
const filterId2 = uuid();
const cardId1 = uuid();
const cardId2 = uuid();
const cardId3 = uuid();
const cardCreatedBy = uuid();
const spaceId = uuid();
const parentId = uuid();
const rootId = uuid();
const reviewerRoleId = uuid();
const boardId = uuid();
const boardCreatedBy = uuid();
const viewToExportId = uuid();
const viewToExportCreatedBy = uuid();

export const inputs = {
  filterGroup: {
    operation: 'or',
    filters: [
      {
        propertyId: propertyIdStep,
        condition: 'is',
        values: ['Rewards'],
        filterId: filterId1
      },
      {
        propertyId: propertyIdStep,
        condition: 'is',
        values: ['Credentials'],
        filterId: filterId2
      }
    ]
  },
  cards: [
    {
      id: cardId1,
      deletedAt: 0,
      createdAt: 1718546526199,
      createdBy: cardCreatedBy,
      updatedAt: 1720722241206,
      updatedBy: cardCreatedBy,
      spaceId,
      parentId,
      rootId,
      schema: 1,
      type: 'card',
      title: 'EcoProject Alpha Application',
      fields: {
        icon: '',
        isTemplate: false,
        properties: {
          [uuid()]: 'ecoproject-alpha-application-9824426817281955',
          __status: 'in_progress',
          [uuid()]: 'rubric',
          __step: 'Rubric evaluation',
          __reviewers: [
            {
              userId: null,
              roleId: reviewerRoleId,
              systemRole: null
            }
          ],
          __project_name: 'EcoProject Alpha',
          __project_excerpt: 'Developing sustainable solutions for local communities',
          __project_description:
            'EcoProject Alpha focuses on creating sustainable agricultural practices in rural areas, integrating modern technology to enhance productivity and environmental stewardship.',
          __project_twitter: 'https://x.com/EcoProjectAlpha',
          __project_website: 'ecoprojectalpha.com',
          __project_github: 'https://github.com/ecoprojectalpha',
          __project_blog: '',
          __project_demoUrl: 'https://demo.ecoprojectalpha.com',
          __project_communityUrl: 'https://t.me/EcoProjectAlpha',
          __project_otherUrl: '',
          __project_walletAddress: '',
          __projectMembers_name: ['John Doe'],
          __projectMembers_walletAddress: [],
          __projectMembers_email: ['johndoe@example.com'],
          __projectMembers_twitter: ['https://x.com/johndoe'],
          __projectMembers_warpcast: [],
          __projectMembers_github: [],
          __projectMembers_linkedin: [],
          __projectMembers_telegram: ['@johndoe'],
          __projectMembers_otherUrl: [],
          __projectMembers_previousProjects: ['Green Initiative']
        },
        headerImage: null,
        contentOrder: []
      },
      pageId: cardId1,
      syncWithPageId: uuid(),
      hasContent: false,
      pageType: 'card',
      isLocked: false
    },
    {
      id: cardId2,
      deletedAt: 0,
      createdAt: 1718627585005,
      createdBy: cardCreatedBy,
      updatedAt: 1720722241207,
      updatedBy: cardCreatedBy,
      spaceId,
      parentId,
      rootId,
      schema: 1,
      type: 'card',
      title: 'Demo',
      fields: {
        icon: '',
        isTemplate: false,
        properties: {
          [uuid()]: 'demo-9428199094523',
          __status: 'in_progress',
          [uuid()]: 'rubric',
          __step: 'Rubric evaluation',
          __reviewers: [
            {
              userId: null,
              roleId: reviewerRoleId,
              systemRole: null
            }
          ],
          __project_name: 'Demo project',
          __project_excerpt: 'We run a p2p investing marketplace',
          __project_description: 'Our tech allows users to invest in projects they care about.',
          __project_twitter: 'https://x.com/com',
          __project_website: 'www.example.com',
          __project_github: '',
          __project_blog: '',
          __project_demoUrl: 'https://play.google.com/store/apps/details?id=com.company.demo&pcampaignid=web_share',
          __project_communityUrl: '',
          __project_otherUrl: '',
          __project_walletAddress: '',
          __projectMembers_name: ['Demo S'],
          __projectMembers_walletAddress: [],
          __projectMembers_email: ['demo@example.com'],
          __projectMembers_twitter: ['@example'],
          __projectMembers_warpcast: [],
          __projectMembers_github: [],
          __projectMembers_linkedin: [],
          __projectMembers_telegram: [],
          __projectMembers_otherUrl: [],
          __projectMembers_previousProjects: []
        },
        headerImage: null,
        contentOrder: []
      },
      pageId: cardId2,
      syncWithPageId: uuid(),
      hasContent: false,
      pageType: 'card',
      isLocked: false
    },
    {
      id: cardId3,
      deletedAt: 0,
      createdAt: 1718655135781,
      createdBy: cardCreatedBy,
      updatedAt: 1720722241207,
      updatedBy: cardCreatedBy,
      spaceId,
      parentId,
      rootId,
      schema: 1,
      type: 'card',
      title: 'Green Horizon Initiative',
      fields: {
        icon: '',
        isTemplate: false,
        properties: {
          [uuid()]: 'green-horizon-initiative-8594324990979427',
          __status: 'in_progress',
          [uuid()]: 'rubric',
          __step: 'Initial Evaluation',
          __reviewers: [
            {
              userId: null,
              roleId: reviewerRoleId,
              systemRole: null
            }
          ],
          __project_name: 'Green Horizon: Training farmers & communities on sustainable practices',
          __project_excerpt:
            'Green Horizon Initiative focuses on environment and social development, emphasizing sustainable agriculture and climate resilience.',
          __project_description:
            'Green Horizon Initiative is a community-led project in rural areas, training farmers on sustainable agricultural methods, promoting agroforestry, and enhancing climate resilience through education and practical support.',
          __project_twitter: 'https://www.x.com/@greenhorizon',
          __project_website: 'https://www.greenhorizon.org',
          __project_github: 'GreenHorizon',
          __project_blog: 'https://greenhorizon.org/blog',
          __project_demoUrl: 'https://www.greenhorizon.org/demo',
          __project_communityUrl: 'https://www.instagram.com/greenhorizon',
          __project_otherUrl: 'https://www.youtube.com/GreenHorizon',
          __project_walletAddress: '',
          __projectMembers_name: ['Alice Johnson', 'Bob Smith'],
          __projectMembers_walletAddress: [],
          __projectMembers_email: ['alice@greenhorizon.org', 'bob@greenhorizon.org'],
          __projectMembers_twitter: ['https://www.x.com/@alice_johnson', 'https://www.x.com/@bob_smith'],
          __projectMembers_warpcast: ['https://warpcast.com/~/invite-page/233344?id=abc123'],
          __projectMembers_github: ['https://www.github.com/GreenHorizon'],
          __projectMembers_linkedin: [
            'https://www.linkedin.com/in/alice-johnson',
            'https://www.linkedin.com/in/bob-smith'
          ],
          __projectMembers_telegram: ['@alicejohnson', '@bobsmith'],
          __projectMembers_otherUrl: [],
          __projectMembers_previousProjects: ['https://explorer.gitcoin.co/#/round/29/12/04']
        },
        headerImage: null,
        contentOrder: []
      },
      pageId: cardId3,
      syncWithPageId: uuid(),
      hasContent: false,
      pageType: 'card',
      isLocked: false
    }
  ],
  board: {
    id: boardId,
    deletedAt: 0,
    createdAt: 1720722226427,
    createdBy: boardCreatedBy,
    updatedAt: 1721066146021,
    updatedBy: boardCreatedBy,
    spaceId,
    parentId: '',
    rootId,
    schema: 1,
    type: 'board',
    title: 'Winning Projects',
    fields: {
      icon: '',
      viewIds: [],
      isTemplate: false,
      sourceType: 'proposals',
      description: '',
      headerImage: null,
      cardProperties: [
        {
          id: '__status',
          name: 'Proposal Status',
          type: 'proposalStatus',
          options: [
            {
              id: 'declined',
              color: 'red',
              value: 'declined'
            },
            {
              id: 'in_progress',
              color: 'yellow',
              value: 'in_progress'
            },
            {
              id: 'passed',
              color: 'green',
              value: 'passed'
            },
            {
              id: 'unpublished',
              color: 'gray',
              value: 'unpublished'
            },
            {
              id: 'archived',
              color: 'gray',
              value: 'archived'
            }
          ],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: uuid(),
          name: 'Proposal Url',
          type: 'proposalUrl',
          options: [],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: uuid(),
          name: 'Proposal Type',
          type: 'proposalEvaluationType',
          options: [],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: '__step',
          name: 'Proposal Step',
          type: 'proposalStep',
          options: [
            {
              id: 'Draft',
              color: 'propColorGray',
              value: 'Draft'
            },
            {
              id: 'Intake Filter',
              color: 'propColorGray',
              value: 'Intake Filter'
            },
            {
              id: 'Initial Evaluation',
              color: 'propColorGray',
              value: 'Initial Evaluation'
            },
            {
              id: 'Rubric evaluation',
              color: 'propColorGray',
              value: 'Rubric evaluation'
            },
            {
              id: 'Final Review',
              color: 'propColorGray',
              value: 'Final Review'
            },
            {
              id: 'Rewards',
              color: 'propColorGray',
              value: 'Rewards'
            },
            {
              id: 'Credentials',
              color: 'propColorGray',
              value: 'Credentials'
            }
          ],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: '__projectMembers_email',
          name: 'Project Member Emails',
          type: 'multiSelect',
          options: [],
          readOnly: true,
          dynamicOptions: true,
          readOnlyValues: true
        },
        {
          id: uuid(),
          name: 'Reviewer Notes',
          type: 'proposalReviewerNotes',
          options: [],
          readOnly: true,
          readOnlyValues: true
        }
      ],
      showDescription: false,
      columnCalculations: []
    },
    pageId: boardId,
    icon: '🏆',
    hasContent: false,
    pageType: 'board',
    isLocked: false
  },
  viewToExport: {
    id: viewToExportId,
    deletedAt: 0,
    createdAt: 1720722240401,
    createdBy: viewToExportCreatedBy,
    updatedAt: 1721066205000,
    updatedBy: viewToExportCreatedBy,
    spaceId,
    parentId: boardId,
    rootId,
    schema: 1,
    type: 'view',
    title: '',
    fields: {
      filter: {
        operation: 'or',
        filters: [
          {
            propertyId: propertyIdStep,
            condition: 'is',
            values: ['Rewards'],
            filterId: filterId1
          },
          {
            propertyId: propertyIdStep,
            condition: 'is',
            values: ['Credentials'],
            filterId: filterId2
          }
        ]
      },
      viewType: 'table',
      cardOrder: [],
      openPageIn: 'center_peek',
      sourceType: 'proposals',
      sortOptions: [],
      columnWidths: {
        __step: 211,
        __title: 280,
        __projectMembers_email: 268,
        [uuid()]: 485
      },
      hiddenOptionIds: [],
      columnWrappedIds: [],
      visibleOptionIds: [],
      defaultTemplateId: '',
      columnCalculations: {},
      kanbanCalculations: {},
      visiblePropertyIds: ['__title', uuid(), '__reviewers']
    }
  }
};
