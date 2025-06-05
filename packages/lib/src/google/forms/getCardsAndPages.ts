import { copyAllPagePermissions } from '@charmverse/core/permissions';
import type { PagePermission, Prisma } from '@charmverse/core/prisma';
import type * as googlForms from '@googleapis/forms';
import { blockToPrisma } from '@packages/databases/block';
import type { PrismaBlockSortOf } from '@packages/databases/block';
import type { IPropertyOption, IPropertyTemplate } from '@packages/databases/board';
import { createCard } from '@packages/databases/card';
import { isTruthy } from '@packages/utils/types';

import { getPagePath } from 'lib/pages';

type GoogleForm = googlForms.forms_v1.Schema$Form;
type GoogleFormResponse = googlForms.forms_v1.Schema$FormResponse;
const userEmailProperty = 'user_email';
const responseLinkProperty = 'response_link';

type GoogleFormInput = {
  cardParentId: string;
  rootId: string;
  createdBy: string;
  form: GoogleForm;
  responses: GoogleFormResponse[];
  nextIndex: number;
  permissions: PagePermission[];
  spaceId: string;
};

type CharmVerseModelOutput = {
  cardProperties: IPropertyTemplate[];
  cards: PrismaBlockSortOf[];
  pages: Prisma.PageCreateInput[];
};

// map Google data model to CharmVerse models
export function getCardsAndPages(data: GoogleFormInput): CharmVerseModelOutput {
  const { cardParentId, rootId, createdBy, form, responses, permissions, spaceId } = data;
  const cardProperties = getCardProperties(form);

  const cardBlocks: PrismaBlockSortOf[] = [];
  const cardPages: Prisma.PageCreateInput[] = []; // for now, return a Prisma object so we can include permissions

  for (const response of responses) {
    const responseId = response.responseId;
    const createdAt = response.createTime ?? new Date().toISOString();
    const responseAnswers = getAnswersFromResponse({
      formId: form.formId as string,
      properties: cardProperties,
      response
    });
    const cardBlock = createCard({
      createdAt: new Date(createdAt).getTime(),
      createdBy,
      updatedBy: createdBy,
      parentId: cardParentId,
      rootId,
      spaceId,
      fields: {
        properties: responseAnswers,
        responseId
      }
    });
    const prismaBlock = blockToPrisma(cardBlock);
    cardBlocks.push(blockToPrisma(cardBlock));

    const initialPermissions = copyAllPagePermissions({
      permissions,
      inheritFrom: true,
      newPageId: cardBlock.id
    });

    // logic copied from blocks api
    initialPermissions.data = (initialPermissions.data as any[]).map((permission) => {
      delete permission.pageId;

      return {
        ...permission
      };
    });

    const cardPage: Prisma.PageCreateInput = {
      author: {
        connect: {
          id: cardBlock.createdBy
        }
      },
      updatedBy: cardBlock.updatedBy,
      id: cardBlock.id,
      space: {
        connect: {
          id: cardBlock.spaceId
        }
      },
      card: {
        connect: {
          id: cardBlock.id
        }
      },
      createdAt: prismaBlock.createdAt,
      hasContent: true,
      title: `Response`,
      type: 'card_synced',
      contentText: '',
      parent: {
        connect: {
          id: rootId // important to inherit permissions
        }
      },
      path: getPagePath(),
      updatedAt: prismaBlock.updatedAt,
      permissions: {
        createMany: initialPermissions
      }
    };
    cardPages.push(cardPage);
  }

  return { cardProperties, cards: cardBlocks, pages: cardPages };
}

// map Google Form questions into card properties
export function getCardProperties(form: GoogleForm): IPropertyTemplate[] {
  const properties: IPropertyTemplate[] = [
    // {
    //   id: userEmailProperty,
    //   name: 'Respondent Email',
    //   type: 'email',
    //   options: []
    // },
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
      const dateQuestion = item.questionItem?.question?.dateQuestion;
      const options = (choiceQuestion?.options ?? [])
        .map(
          (choice): IPropertyOption => ({
            id: choice.value ?? '', // use the value as id so that it is always the same
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

      if (!hasIsOther && (choiceQuestion?.type === 'RADIO' || (choiceQuestion?.type === 'DROP_DOWN' && !hasIsOther))) {
        prop.type = 'select';
      } else if (!hasIsOther && choiceQuestion?.type === 'CHECKBOX') {
        prop.type = 'multiSelect';
      } else if (dateQuestion?.includeYear) {
        // only work with date questions that include the year
        prop.type = 'date';
      }
      properties.push(prop);
    } else if (item.questionGroupItem && item.questionGroupItem.grid?.columns) {
      const hasIsOther = item.questionGroupItem.grid.columns.options?.some((option) => option.isOther);
      const formType = item.questionGroupItem.grid.columns.type as 'RADIO' | 'CHECKBOX';
      const propertyType = !hasIsOther ? (formType === 'RADIO' ? 'select' : 'multiSelect') : 'text';
      const options = item.questionGroupItem.grid.columns
        .options!.map(
          (choice): IPropertyOption => ({
            id: choice.value ?? '', // use the value as id so that it is always the same
            value: choice.value ?? '',
            color: ''
          })
        )
        // filter out options like { isOther: true }
        .filter((option) => option.id !== '');
      item.questionGroupItem.questions?.forEach((question) => {
        const _questionId = question.questionId!;
        const prop: IPropertyTemplate = {
          id: _questionId,
          name: `${item.title}: ${question.rowQuestion?.title ?? _questionId}`,
          type: propertyType,
          options
        };
        properties.push(prop);
      });
    }
  });

  return properties;
}

export function getAnswersFromResponse({
  formId,
  properties,
  response
}: {
  formId?: string;
  properties: IPropertyTemplate[];
  response: GoogleFormResponse;
}): Record<string, null | string | number | string[]> {
  const values: Record<string, null | string | number | string[]> = {};

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
      } else if (question.type === 'select') {
        values[propId] = (answer.textAnswers?.answers ?? [])
          .map((a) => getAnswerId(question.options, a.value))
          .filter(isTruthy)[0];
      } else if (question.type === 'multiSelect') {
        values[propId] = (answer.textAnswers?.answers ?? [])
          .map((a) => getAnswerId(question.options, a.value))
          .filter(isTruthy);
      } else if (question.type === 'text') {
        const fileName = answer.fileUploadAnswers?.answers?.[0]?.fileName;
        const textAnswer = answer.textAnswers?.answers?.[0]?.value;
        values[propId] = fileName ?? textAnswer ?? '';
      } else if (question.type === 'date') {
        // TODO: we should support dates that dont include time in focalboard
        const dateTime = answer.textAnswers?.answers?.[0]?.value
          ? new Date(answer.textAnswers?.answers?.[0]?.value).getTime()
          : null;
        values[propId] = dateTime;
      } else {
        // textAnswer is a fallback for all other types
        // https://developers.google.com/forms/api/reference/rest/v1/forms.responses#TextAnswer
        values[propId] = answer.textAnswers?.answers?.[0]?.value ?? '';
      }
    }
  });

  return values;
}

function getAnswerId(options: IPropertyOption[], value: string | null | undefined): string {
  const option = options.find((o) => o.value === value);
  return option?.id ?? '';
}
