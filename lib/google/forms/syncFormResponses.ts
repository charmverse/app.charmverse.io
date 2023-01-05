import * as googlForms from '@googleapis/forms';
import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { blockToPrisma } from 'lib/focalboard/block';
import type { Block } from 'lib/focalboard/block';
import { createBoard } from 'lib/focalboard/board';
import type { IPropertyOption, IPropertyTemplate } from 'lib/focalboard/board';
import type { GoogleFormSourceData } from 'lib/focalboard/boardView';
import { createCard } from 'lib/focalboard/card';
import { isTruthy } from 'lib/utilities/types';

import { getClient } from '../authorization/authClient';
import { getCredential } from '../authorization/credentials';

type GoogleForm = googlForms.forms_v1.Schema$Form;
type GoogleFormResponse = googlForms.forms_v1.Schema$FormResponse;

// Requires 'https://www.googleapis.com/auth/forms.responses.readonly' scope
export async function syncFormResponses({ sourceData }: { sourceData: GoogleFormSourceData }) {
  const { formId } = sourceData;
  const credential = await getCredential({ credentialId: sourceData.credentialId });
  const forms = _getFormsClient(credential.refreshToken);

  const { data: form } = await forms.forms.get({
    formId
  });

  const res = await forms.forms.responses.list({
    formId
  });
  const { responses } = res.data;
  const boardBlock = sourceData.boardId ? await prisma.block.findUnique({ where: { id: sourceData.boardId } }) : null;
  const board = (boardBlock ?? createBoard()) as Block;

  const cardProperties = getCardProperties(form);
  board.fields.cardProperties = cardProperties;

  const cardBlocks: Prisma.BlockUncheckedCreateInput[] = [];

  if (responses) {
    for (const response of responses) {
      const responseId = response.responseId;
      const createdAt = response.createTime ?? new Date().toISOString();
      const properties = getValuesFromResponse({ formId, properties: cardProperties, response });
      const cardBlock = createCard({
        createdAt: new Date(createdAt).getTime(),
        parentId: board.id,
        rootId: board.id,
        fields: {
          properties,
          responseId
        }
      });
      cardBlocks.push(blockToPrisma(cardBlock));
    }
  }

  const boardCreateOrUpdate = prisma.block.upsert({
    where: {
      id: board.id
    },
    create: blockToPrisma(board),
    update: {
      fields: board.fields
    }
  });
  const deleteCards = prisma.block.deleteMany({
    where: {
      rootId: board.id
    }
  });
  const createCards = prisma.block.createMany({ data: cardBlocks });

  await prisma.$transaction([boardCreateOrUpdate, deleteCards, createCards]);
}

const userEmailProperty = 'user_email';
const responseLinkProperty = 'response_link';

function getCardProperties(form: GoogleForm): IPropertyTemplate[] {
  const properties: IPropertyTemplate[] = [
    {
      id: userEmailProperty,
      name: 'Respondent Email',
      type: 'email',
      options: []
    },
    {
      id: responseLinkProperty,
      name: 'Link to response',
      type: 'url',
      options: []
    }
  ];

  form.items?.forEach((item) => {
    const questionId = item?.questionItem?.question?.questionId;

    if (questionId) {
      const choiceQuestion = item.questionItem?.question?.choiceQuestion;
      const options = (choiceQuestion?.options ?? [])
        .map(
          (choice): IPropertyOption => ({
            id: choice.value ?? '',
            value: choice.value ?? '',
            color: ''
          })
        )
        // filter out options like { isOther: true }
        .filter((option) => option.id !== '');

      const hasIsOther = choiceQuestion?.options?.some((option) => option.isOther);
      const prop: IPropertyTemplate = {
        id: questionId,
        name: item.title ?? questionId,
        type: 'text',
        options
      };

      if (choiceQuestion?.type === 'RADIO' || (choiceQuestion?.type === 'DROP_DOWN' && !hasIsOther)) {
        prop.type = 'select';
      } else if (choiceQuestion?.type === 'CHECKBOX') {
        prop.type = 'multiSelect';
      }
      properties.push(prop);
    }
  });

  return properties;
}

function getValuesFromResponse({
  formId,
  properties,
  response
}: {
  formId?: string;
  properties: IPropertyTemplate[];
  response: GoogleFormResponse;
}): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};

  if (response.respondentEmail) {
    values[userEmailProperty] = response.respondentEmail;
  }

  // add the URL to view the response
  values[responseLinkProperty] = `https://docs.google.com/forms/d/${formId}/edit#response=${response.responseId}`;

  Object.values(response.answers ?? {}).forEach((answer) => {
    const question = properties.find((prop) => prop.id === answer.questionId);
    if (question) {
      const propId = question.id;
      if (question.type === 'number' && answer.grade) {
        if (answer.grade.score) {
          values[propId] = answer.grade.score?.toString() ?? '';
        } else {
          values[propId] = answer.grade.correct ? 'Correct' : 'Incorrect';
        }
      } else if (question.type === 'select' || question.type === 'multiSelect') {
        values[propId] = (answer.textAnswers?.answers ?? []).map((a) => a.value).filter(isTruthy);
      } else if (question.type === 'text') {
        values[propId] = answer.textAnswers?.answers?.[0]?.value ?? '';
      } else {
        // textAnswer is a fallback for all other types
        // https://developers.google.com/forms/api/reference/rest/v1/forms.responses#TextAnswer
        values[propId] = answer.textAnswers?.answers?.[0]?.value ?? '';
      }
    }
  });

  return values;
}

function _getFormsClient(refreshToken: string) {
  const auth = getClient();
  auth.setCredentials({
    refresh_token: refreshToken
  });
  return googlForms.forms({
    version: 'v1',
    auth
  });
}
