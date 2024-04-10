/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Block, FormField, Page, Space, User, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsProposals } from '@charmverse/core/test';
import request from 'supertest';
import { v4 } from 'uuid';

import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { prismaToBlock } from 'lib/databases/block';
import type { BlockWithDetails } from 'lib/databases/block';
import type { Board, BoardFields, IPropertyTemplate } from 'lib/databases/board';
import type { BoardViewFields } from 'lib/databases/boardView';
import type { CardFields } from 'lib/databases/card';
import {
  getCardPropertyTemplates,
  getCardPropertiesFromProposals
} from 'lib/databases/proposalsSource/getCardProperties';
import { updateBoardProperties } from 'lib/databases/proposalsSource/updateBoardProperties';
import { updateViews } from 'lib/databases/proposalsSource/updateViews';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBoard, generateProposal, generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

let adminSpace: Space;

let adminUser: User;

let database: Block;
let databaseCards: Block[];
let databaseViews: Block[];

const sourceDatabaseViewsCount = 3;
const sourceDatabaseCardsCount = 5;

// 1 refers to the database definition block
const totalSourceBlocks = 1 + sourceDatabaseCardsCount + sourceDatabaseViewsCount;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  adminSpace = generated.space;
  adminUser = generated.user;

  const generatedDatabase = await generateBoard({
    createdBy: adminUser.id,
    spaceId: adminSpace.id,
    views: sourceDatabaseViewsCount,
    cardCount: sourceDatabaseCardsCount
  });

  const generatedDatabaseBlocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: generatedDatabase.id
        },
        {
          rootId: generatedDatabase.id
        }
      ]
    }
  });

  database = generatedDatabaseBlocks.find((b) => b.id === generatedDatabase.id) as Block;

  databaseCards = generatedDatabaseBlocks.filter((b) => b.type === 'card');

  databaseViews = generatedDatabaseBlocks.filter((b) => b.type === 'view');

  expect(database).toBeDefined();
  expect(databaseCards.length).toEqual(sourceDatabaseCardsCount);
  expect(databaseViews.length).toBe(sourceDatabaseViewsCount);
});

describe('POST /api/pages/[id]/proposal-source', () => {
  it('Should get all board, view and cards blocks for a database if a user can access the database, responding 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).post(`/api/pages/${database.id}/proposal-source`).set('Cookie', adminCookie).expect(200);
  });

  it('Should not return a deleted card block', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const cardToDelete = await prisma.page.update({
      where: {
        id: databaseCards[0].id
      },
      data: {
        deletedAt: new Date()
      }
    });
    await request(baseUrl).post(`/api/pages/${database.id}/proposal-source`).set('Cookie', adminCookie).expect(200);

    expect(databaseBlocks).toHaveLength(totalSourceBlocks - 1);

    expect(databaseBlocks).toEqual(
      expect.arrayContaining(
        [database, ...databaseViews, ...databaseCards]
          .filter((c) => c.id !== cardToDelete.id)
          .map((block) => expect.objectContaining({ id: block.id }))
      )
    );
  });

  it('Should fail if the user cannot access the database, responding 404', async () => {
    const outsideUser = await testUtilsUser.generateUser();
    const outsideUserCookie = await loginUser(outsideUser.id);
    await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', outsideUserCookie).expect(404);
  });

  it(`should add custom proposal properties as card properties and add them to visible properties for all views as an admin`, async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });

    const proposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      reviewers: [
        {
          group: 'user',
          id: proposalAuthor.id
        }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const defaultBoard = getDefaultBoard({
      evaluationStepTitles: []
    });

    const customProperties: IPropertyTemplate[] = [
      {
        id: v4(),
        name: 'Text',
        type: 'text',
        options: []
      },
      {
        id: v4(),
        name: 'Select',
        type: 'select',
        options: [
          {
            id: v4(),
            value: 'Option 1',
            color: 'propColorGray'
          },
          {
            id: v4(),
            value: 'Option 2',
            color: 'propColorGray'
          }
        ]
      }
    ];

    await prisma.proposalBlock.create({
      data: {
        fields: {
          ...defaultBoard.fields,
          cardProperties: [
            ...defaultBoard.fields.cardProperties,
            ...customProperties
          ] as unknown as Prisma.InputJsonArray
        },
        id: defaultBoard.id,
        spaceId: testSpace.id,
        createdBy: proposalAuthor.id,
        rootId: testSpace.id,
        updatedBy: proposalAuthor.id,
        type: 'board',
        title: 'Proposals',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        parentId: testSpace.id,
        schema: 1
      }
    });

    const proposalFields = (proposal.fields as ProposalFields) ?? {};

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        fields: {
          ...proposalFields,
          properties: {
            ...proposalFields.properties,
            [customProperties[0].id]: 'Text',
            [customProperties[1].id]: customProperties[1].options[0].id
          }
        }
      }
    });

    const databaseBoard = await generateBoard({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    const cards = await getCardPropertiesFromProposals({
      spaceId: board.spaceId,
      cardProperties: board.fields.cardProperties
    });
    const cardBlock = Object.values(cards)[0];

    const cardBlockFields = cardBlock?.fields;

    const databaseBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: databaseBoard.boardId!
      },
      select: {
        fields: true
      }
    });

    const boardCardProperties = (databaseBlock?.fields as unknown as BoardFields)?.cardProperties ?? [];

    const textProperty = boardCardProperties.find(
      (prop) => prop.id === customProperties[0].id && prop.proposalFieldId === customProperties[0].id
    );
    const selectProperty = boardCardProperties.find(
      (prop) => prop.id === customProperties[1].id && prop.proposalFieldId === customProperties[1].id
    );

    expect(textProperty).toBeDefined();
    expect(selectProperty).toBeDefined();

    expect(cardBlockFields.properties[customProperties[0].id]).toBe('Text');
    expect(cardBlockFields.properties[customProperties[1].id]).toBe(customProperties[1].options[0].id);

    const views = await prisma.block.findMany({
      where: {
        parentId: databaseBoard.id,
        type: 'view'
      },
      select: {
        fields: true
      }
    });

    const viewFields = views[0]?.fields as unknown as BoardViewFields;
    expect(viewFields.visiblePropertyIds.includes(customProperties[0].id)).toBe(true);
    expect(viewFields.visiblePropertyIds.includes(customProperties[1].id)).toBe(true);
  });

  it(`should add proposal form fields as card properties and add them to visible properties for all views as an admin`, async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });
    const spaceMember = await generateUser();
    await addUserToSpace({
      spaceId: testSpace.id,
      userId: spaceMember.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      reviewers: [
        {
          group: 'user',
          id: proposalAuthor.id
        }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const form = await prisma.form.create({
      data: {
        formFields: {
          createMany: {
            data: [
              {
                name: 'Short Text',
                type: 'short_text',
                private: true
              },
              {
                name: 'Email',
                type: 'email'
              }
            ]
          }
        },
        proposal: {
          connect: {
            id: proposal.id
          }
        }
      },
      include: {
        formFields: true
      }
    });

    const formFields = form.formFields;
    const shortTextFormField = formFields.find((field) => field.type === 'short_text') as FormField;
    const emailFormField = formFields.find((field) => field.type === 'email') as FormField;

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          fieldId: shortTextFormField.id,
          proposalId: proposal.id,
          value: 'Short Text Answer',
          type: shortTextFormField.type
        },
        {
          fieldId: emailFormField.id,
          proposalId: proposal.id,
          value: 'john.doe@gmail.com',
          type: emailFormField.type
        }
      ]
    });

    const database1 = await generateProposalSourceDb({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id
    });

    const cards = await getCardPropertiesFromProposals({
      spaceId: board.spaceId,
      cardProperties: board.fields.cardProperties
    });
    const databaseCard = Object.values(cards)[0];

    const database1Properties = database1.fields.cardProperties;
    const shortText1Prop = database1Properties.find(
      (prop) => prop.formFieldId === shortTextFormField.id
    ) as IPropertyTemplate;
    const email1Prop = database1Properties.find((prop) => prop.formFieldId === emailFormField.id) as IPropertyTemplate;

    const cardProperties = (databaseCard?.fields as unknown as CardFields).properties;
    expect(cardProperties[shortText1Prop.id]).toBe('Short Text Answer');
    expect(cardProperties[email1Prop.id]).toBe('john.doe@gmail.com');

    // Testing with a regular space member to check if private fields are transferred to card properties or not
    const database2 = await generateBoard({
      createdBy: spaceMember.id,
      spaceId: testSpace.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    const cards2 = await getCardPropertiesFromProposals({
      spaceId: board.spaceId,
      cardProperties: board.fields.cardProperties
    });
    const databaseCard2 = Object.values(cards2)[0];

    const database2Block = await prisma.block.findUnique({
      where: {
        id: database2.boardId!
      },
      select: {
        fields: true
      }
    });

    const database2Properties = (database2Block?.fields as unknown as BoardFields).cardProperties;
    const shortText2Prop = database2Properties.find(
      (prop) => prop.formFieldId === shortTextFormField.id
    ) as IPropertyTemplate;
    const email2Prop = database2Properties.find((prop) => prop.formFieldId === emailFormField.id) as IPropertyTemplate;

    const card2Properties = (databaseCard2?.fields as unknown as CardFields).properties;
    expect(card2Properties[shortText2Prop.id]).toBeUndefined();
    expect(card2Properties[email2Prop.id]).toBe('john.doe@gmail.com');
  });
});
