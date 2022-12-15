import { v4 } from 'uuid';

import { prisma } from 'db';
import type { FormResponseProperty } from 'lib/pages/interfaces';
import { createDatabaseCardPage } from 'lib/public-api/createDatabaseCardPage';
import { InvalidInputError } from 'lib/utilities/errors';
import type { AddFormResponseInput, FormResponse } from 'lib/zapier/interfaces';
import { parseFormData } from 'lib/zapier/parseFormData';

export async function createFormResposnseCard({
  spaceId,
  databaseId,
  userId,
  data
}: {
  spaceId: string;
  databaseId: string;
  userId: string;
  data: AddFormResponseInput;
}) {
  const formResponses = parseFormData(data);
  if (!formResponses.length) {
    throw new InvalidInputError('There are no form responses to create');
  }

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: databaseId,
      spaceId
    }
  });

  if (!board) {
    throw new InvalidInputError('Database not found');
  }

  const fields = (board.fields as any) || {};
  const cardProperties = fields?.cardProperties || [];
  const existingResponseProperties: FormResponseProperty[] =
    cardProperties.filter((p: FormResponseProperty) => p.isQuestion) || [];

  const { newProperties, mappedProperties } = mapAndCreateProperties(formResponses, existingResponseProperties);

  if (newProperties.length) {
    // Save new question properties
    await prisma.block.update({
      where: {
        id: databaseId
      },
      data: {
        fields: {
          ...fields,
          cardProperties: [...cardProperties, ...newProperties]
        }
      }
    });
  }

  const card = await createDatabaseCardPage({
    title: 'Form Response',
    properties: mappedProperties,
    boardId: databaseId,
    spaceId,
    createdBy: userId
  });

  return card;
}

function creteNewFormProperty(description: string, index: number = 0): FormResponseProperty {
  return {
    id: v4(),
    name: `Question ${index + 1}`,
    type: 'text',
    options: [],
    description,
    isQuestion: true
  };
}

function mapAndCreateProperties(formResponses: FormResponse[], existingResponseProperties: FormResponseProperty[]) {
  const newProperties: FormResponseProperty[] = [];
  const mappedProperties: Record<string, string> = {};

  formResponses.forEach((response) => {
    let property = existingResponseProperties.find((p) => p.description === response.question);
    if (!property) {
      const propertyIndex = existingResponseProperties.length + newProperties.length;
      property = creteNewFormProperty(response.question, propertyIndex);
      newProperties.push(property);
    }

    if (property) {
      mappedProperties[property.id] = response.answer;
    }
  });

  return { newProperties, mappedProperties };
}
