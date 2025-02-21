import type { FormField, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateBoard, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { prismaToBlock } from '@root/lib/databases/block';
import type { Board, IPropertyTemplate } from '@root/lib/databases/board';
import { generateProposalSourceDb } from '@root/lib/testing/proposals';

import { applyPropertiesToCard } from '../applyPropertiesToCards';
import { createMissingCards } from '../createMissingCards';
import { getCardPropertiesFromProposals } from '../getCardProperties';

describe('applyPropertiesToCard', () => {
  let user: User;
  let space: Space;
  let board: Board;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
    const generatedBoard = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      viewDataSource: 'proposals'
    });
    const boardBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: generatedBoard.id
      }
    });
    board = prismaToBlock(boardBlock) as Board;
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.page.deleteMany({
        where: {
          spaceId: space.id,
          id: {
            not: board.id
          }
        }
      }),
      prisma.proposal.deleteMany({
        where: {
          spaceId: space.id
        }
      })
    ]);
  });

  it(`should not include private form fields as card properties`, async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });

    const proposalTemplate = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      pageType: 'proposal_template',
      reviewers: [
        {
          group: 'user',
          id: proposalAuthor.id
        }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
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

    await prisma.page.update({
      where: {
        id: proposal.page.id
      },
      data: {
        sourceTemplateId: proposalTemplate.page.id
      }
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
            id: proposalTemplate.id
          }
        }
      },
      include: {
        formFields: true
      }
    });

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        form: {
          connect: {
            id: form.id
          }
        }
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

    await createMissingCards({ boardId: database1.id });

    const cards = await getCardPropertiesFromProposals({
      space: {
        credentialTemplates: [],
        features: testSpace.features,
        id: testSpace.id,
        useOnchainCredentials: false
      },
      cardProperties: database1.fields.cardProperties
    });

    const [proposalId, databaseCard] = Object.entries(cards)[0];
    const databaseCardBlock = await prisma.block.findFirstOrThrow({
      where: {
        page: {
          syncWithPageId: proposalId
        }
      }
    });

    const assembled = applyPropertiesToCard({
      boardProperties: database1.fields.cardProperties,
      block: databaseCardBlock as any,
      canViewPrivateFields: true,
      proposalProperties: databaseCard
    });

    const database1Properties = database1.fields.cardProperties;
    const shortText1Prop = database1Properties.find(
      (prop) => prop.formFieldId === shortTextFormField.id
    ) as IPropertyTemplate;
    const email1Prop = database1Properties.find((prop) => prop.formFieldId === emailFormField.id) as IPropertyTemplate;

    const cardProperties = assembled.fields.properties;
    expect(cardProperties[shortText1Prop.id]).toBe('Short Text Answer');
    expect(cardProperties[email1Prop.id]).toBe('john.doe@gmail.com');

    const assembled2 = applyPropertiesToCard({
      boardProperties: database1.fields.cardProperties,
      block: databaseCardBlock as any,
      canViewPrivateFields: false,
      proposalProperties: databaseCard
    });

    const card2Properties = assembled2.fields.properties;
    expect(card2Properties[shortText1Prop.id]).toBeUndefined();
    expect(card2Properties[email1Prop.id]).toBe('john.doe@gmail.com');
  });
});
