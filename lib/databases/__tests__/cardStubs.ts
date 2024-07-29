import { v4 as uuid } from 'uuid';

const inProgressProposalCard = {
  id: 'ee188725-f74b-44c6-b67a-cb8e8aa89937',
  deletedAt: 0,
  createdAt: 1722253407862,
  createdBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
  updatedAt: 1722253548412,
  updatedBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
  spaceId: '0398c52a-829b-454f-b899-d9bb79b09229',
  parentId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
  rootId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
  schema: 1,
  type: 'card',
  title: 'Getting Started',
  fields: {
    icon: '',
    isTemplate: false,
    properties: {
      '680e0e93-5ba5-4c24-b3aa-61e579aafa93': 'getting-started-8198984395372089',
      __status: 'in_progress',
      'b3387401-6b08-4a46-a255-86d6964bdf27': 'feedback',
      __step: 'Feedback',
      __authors: ['572edd48-f255-4fd9-9dd5-ce97dc4595d9'],
      __publishedAt: '',
      __reviewers: [
        {
          userId: null,
          roleId: null,
          systemRole: 'author'
        }
      ]
    },
    headerImage: null,
    contentOrder: []
  }
};

const completedProposalCard = {
  id: 'd7469a94-a04c-433a-920c-e60f10381dc7',
  deletedAt: 0,
  createdAt: 1722253469222,
  createdBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
  updatedAt: 1722253548412,
  updatedBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
  spaceId: '0398c52a-829b-454f-b899-d9bb79b09229',
  parentId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
  rootId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
  schema: 1,
  type: 'card',
  title: 'Proposal 0',
  fields: {
    icon: '',
    isTemplate: false,
    properties: {
      '680e0e93-5ba5-4c24-b3aa-61e579aafa93': 'path-c202bb90-4720-486f-9841-f8ce98a38a56',
      __status: 'pass',
      'b3387401-6b08-4a46-a255-86d6964bdf27': 'rubric',
      __step: 'rubric',
      __authors: ['572edd48-f255-4fd9-9dd5-ce97dc4595d9'],
      __publishedAt: '',
      __reviewers: [
        {
          userId: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
          roleId: null,
          systemRole: null
        }
      ]
    },
    headerImage: null,
    contentOrder: []
  },
  pageId: 'd7469a94-a04c-433a-920c-e60f10381dc7',
  syncWithPageId: 'f2bd9412-69b0-4c12-8c27-f25584bd603d',
  hasContent: false,
  pageType: 'card',
  isLocked: false
};

export const generateTableArrayInput = {
  board: {
    id: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
    deletedAt: 0,
    createdAt: 1722253526097,
    createdBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
    updatedAt: 1722253557385,
    updatedBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
    spaceId: '0398c52a-829b-454f-b899-d9bb79b09229',
    parentId: '',
    rootId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
    schema: 1,
    type: 'board',
    title: 'Proposals db',
    fields: {
      icon: '',
      viewIds: [],
      isTemplate: false,
      sourceType: 'proposals',
      description: '',
      headerImage: null,
      cardProperties: [
        {
          id: 'fad43664-955a-4be1-a69d-3982c0348858',
          name: 'Reviewer Notes',
          type: 'proposalReviewerNotes',
          options: [],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: '__authors',
          name: 'Proposal Authors',
          type: 'proposalAuthor',
          options: [],
          readOnly: true,
          readOnlyValues: true
        },
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
          id: '__publishedAt',
          name: 'Publish Date',
          type: 'proposalPublishedAt',
          options: [],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: '680e0e93-5ba5-4c24-b3aa-61e579aafa93',
          name: 'Proposal Url',
          type: 'proposalUrl',
          options: [],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: 'b3387401-6b08-4a46-a255-86d6964bdf27',
          name: 'Proposal Type',
          type: 'proposalEvaluationType',
          options: [],
          readOnly: true,
          readOnlyValues: true
        },
        {
          id: '__reviewers',
          name: 'Proposal Reviewers',
          type: 'proposalReviewer',
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
              id: 'rubric',
              color: 'propColorGray',
              value: 'rubric'
            },
            {
              id: 'Feedback',
              color: 'propColorGray',
              value: 'Feedback'
            },
            {
              id: 'Review',
              color: 'propColorGray',
              value: 'Review'
            },
            {
              id: 'Community vote',
              color: 'propColorGray',
              value: 'Community vote'
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
        }
      ],
      showDescription: false,
      columnCalculations: []
    },
    pageId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
    hasContent: false,
    pageType: 'board',
    isLocked: false
  },
  view: {
    id: '0bc2fdaf-91ed-42be-b536-0f16814deedd',
    deletedAt: 0,
    createdAt: 1722253544664,
    createdBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
    updatedAt: 1722253651495,
    updatedBy: '572edd48-f255-4fd9-9dd5-ce97dc4595d9',
    spaceId: '0398c52a-829b-454f-b899-d9bb79b09229',
    parentId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
    rootId: 'de8eb9f9-d327-4738-ad07-7fca153f25d7',
    schema: 1,
    type: 'view',
    title: '',
    fields: {
      filter: {
        operation: 'and',
        filters: [
          {
            propertyId: '__step',
            condition: 'is',
            values: ['Feedback'],
            filterId: '8657a459-024f-4988-97f7-da94c41c1d2f'
          }
        ]
      },
      viewType: 'table',
      cardOrder: [],
      openPageIn: 'center_peek',
      sourceType: 'proposals',
      sortOptions: [],
      columnWidths: {
        __title: 280
      },
      hiddenOptionIds: [],
      columnWrappedIds: [],
      visibleOptionIds: [],
      defaultTemplateId: '',
      columnCalculations: {},
      kanbanCalculations: {},
      visiblePropertyIds: [
        '__title',
        'fad43664-955a-4be1-a69d-3982c0348858',
        '__authors',
        '__status',
        '__publishedAt',
        '680e0e93-5ba5-4c24-b3aa-61e579aafa93',
        '__reviewers'
      ]
    }
  },
  cards: [inProgressProposalCard, completedProposalCard],
  formatters: {},
  context: {
    users: {
      '572edd48-f255-4fd9-9dd5-ce97dc4595d9': {
        username: 'test'
      }
    },
    spaceDomain: 'demo-space-domain'
  },
  cardMap: {
    [inProgressProposalCard.id]: {
      title: [inProgressProposalCard.title]
    },
    [completedProposalCard.id]: {
      title: [completedProposalCard.title]
    }
  }
};
