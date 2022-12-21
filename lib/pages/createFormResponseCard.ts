import { v4 } from 'uuid';

import { prisma } from 'db';
import { getDatabaseDetails } from 'lib/pages/getDatabaseDetails';
import type { FormResponseProperty } from 'lib/pages/interfaces';
import { createDatabaseCardPage } from 'lib/public-api/createDatabaseCardPage';
import { InvalidInputError } from 'lib/utilities/errors';
import type { AddFormResponseInput, FormResponse } from 'lib/zapier/interfaces';
import { parseFormData } from 'lib/zapier/parseFormData';

export async function createFormResponseCard({
  spaceId,
  databaseIdorPath,
  userId,
  data
}: {
  spaceId: string;
  databaseIdorPath: string;
  userId: string;
  data: AddFormResponseInput;
}) {
  // Parse qnswer / question pairs
  const formResponses = parseFormData(data);
  if (!formResponses.length) {
    throw new InvalidInputError('There are no form responses to create');
  }

  const board = await getDatabaseDetails({ spaceId, idOrPath: databaseIdorPath });

  if (!board) {
    throw new InvalidInputError('Database not found');
  }

  const fields = (board.fields as any) || {};
  const cardProperties = fields?.cardProperties || [];
  const existingResponseProperties: FormResponseProperty[] =
    cardProperties.filter((p: FormResponseProperty) => p.isQuestion) || [];

  // Map properties, create new onses for non-existing questions
  const { newProperties, mappedProperties } = mapAndCreateProperties(formResponses, existingResponseProperties);

  if (newProperties.length) {
    // Save new question properties
    await prisma.block.update({
      where: {
        id: board.id
      },
      data: {
        fields: {
          ...fields,
          cardProperties: [...cardProperties, ...newProperties]
        }
      }
    });
  }

  // Create card with form response entry
  const card = await createDatabaseCardPage({
    title: 'Form Response',
    properties: mappedProperties,
    boardId: board.id,
    spaceId,
    createdBy: userId
  });

  return card;
}

function createNewFormProperty(description: string, index: number = 0): FormResponseProperty {
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
      property = createNewFormProperty(response.question, propertyIndex);
      newProperties.push(property);
    }

    if (property) {
      mappedProperties[property.id] = response.answer;
    }
  });

  return { newProperties, mappedProperties };
}
