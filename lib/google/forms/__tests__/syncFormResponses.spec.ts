import type { Block, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type * as googlForms from '@googleapis/forms';
import { boardWithCardsArgs } from '@packages/testing/generateBoardStub';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import type { BoardViewFields } from '@root/lib/databases/boardView';

import { syncFormResponses } from '../syncFormResponses';

type GoogleForm = googlForms.forms_v1.Schema$Form;
type GoogleFormResponse = googlForms.forms_v1.Schema$FormResponse;

const form: GoogleForm = { items: [] };
let responses: GoogleFormResponse[] = [];

jest.mock('../getFormAndResponses', () => {
  return {
    getFormAndResponses: () => Promise.resolve({ form, responses })
  };
});

afterAll(async () => {
  jest.resetModules();
});

async function getTestData() {
  const { user, space } = await generateUserAndSpace();
  const testData = boardWithCardsArgs({ cardCount: 0, createdBy: user.id, spaceId: space.id });
  const blocks = testData.blockArgs.data as Prisma.BlockCreateManyInput[];
  const view = blocks.find((b) => b.type === 'view') as Block;

  const fields = view.fields as BoardViewFields;
  fields.sourceType = 'google_form';
  fields.sourceData = {
    formId: 'formId',
    formName: 'Test form',
    formUrl: 'https://',
    credentialId: 'credentialId'
  };
  const docs = await prisma.$transaction([
    ...testData.pageArgs.map((arg) => prisma.page.create(arg)),
    ...blocks.map((data) => prisma.block.create({ data }))
  ]);
  const viewResult = docs[docs.length - 1] as Block;

  return { view: viewResult, user };
}

describe('syncFormResponses()', () => {
  it('creates a board and cards based on google form and responses', async () => {
    const { user, view } = await getTestData();

    form.items = [
      {
        itemId: '5967183b',
        title: 'Best pizza topping?',
        questionItem: {
          question: {
            questionId: 'question1',
            textQuestion: {}
          }
        }
      }
    ];

    responses = [
      {
        responseId: '001',
        answers: {
          question1: {
            questionId: 'question1',
            textAnswers: { answers: [{ value: 'pineapple' }] }
          }
        }
      },
      {
        responseId: '002',
        answers: {
          question1: {
            questionId: 'question1',
            textAnswers: { answers: [{ value: 'sardines' }] }
          }
        }
      }
    ];

    const res = await syncFormResponses({
      createdBy: user.id,
      view
    });
    expect(res).toBeDefined();
    expect(res!.board).toBeDefined();
    expect(res!.board.fields.cardProperties).toHaveLength(2);
    expect(res!.cards).toHaveLength(2);

    const updatedView = await prisma.block.findUniqueOrThrow({ where: { id: view.id } });
    expect((updatedView.fields as any)?.sourceData?.boardId).toEqual(res!.board.id);
  });

  it('should not refresh immediately after being called', async () => {
    const { user, view } = await getTestData();

    form.items = [];

    responses = [];

    const res = await syncFormResponses({
      createdBy: user.id,
      view
    });
    expect(res).toBeDefined();

    const updatedView = await prisma.block.findUniqueOrThrow({ where: { id: view.id } });

    const res2 = await syncFormResponses({
      createdBy: user.id,
      view: updatedView
    });
    expect(res2).toBeUndefined();
  });
});
