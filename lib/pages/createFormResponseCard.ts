import { prisma } from '@charmverse/core';
import { v4 } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import { getDatabaseDetails } from 'lib/pages/getDatabaseDetails';
import type { FormResponseProperty } from 'lib/pages/interfaces';
import { createDatabaseCardPage } from 'lib/public-api/createDatabaseCardPage';
import { InvalidInputError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';
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
    cardProperties.filter((p: FormResponseProperty) => formResponses.some((f) => f.question === p.description)) || [];

  // Map properties, create new onses for non-existing questions
  const { newProperties, mappedProperties } = mapAndCreateProperties(formResponses, existingResponseProperties);

  if (newProperties.length) {
    // Save new question properties
    const updatedBoard = await prisma.block.update({
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

    const views = await prisma.block.findMany({
      where: {
        type: 'view',
        parentId: updatedBoard.id
      }
    });

    const updatedViewBlocks = await prisma.$transaction(
      views.map((block) => {
        return prisma.block.update({
          where: { id: block.id },
          data: {
            fields: {
              ...(block.fields as any),
              visiblePropertyIds: [
                ...new Set([...(block.fields as any).visiblePropertyIds, ...newProperties.map((p) => p.id)])
              ]
            },
            updatedAt: new Date(),
            updatedBy: userId
          }
        });
      })
    );

    relay.broadcast(
      {
        type: 'blocks_updated',
        payload: [prismaToBlock(updatedBoard), ...updatedViewBlocks.map(prismaToBlock)]
      },
      updatedBoard.spaceId
    );
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

function createNewFormProperty(description: string): FormResponseProperty {
  return {
    id: v4(),
    name: description,
    type: 'text',
    options: [],
    description
  };
}

function mapAndCreateProperties(formResponses: FormResponse[], existingResponseProperties: FormResponseProperty[]) {
  const newProperties: FormResponseProperty[] = [];
  const mappedProperties: Record<string, string> = {};

  formResponses.forEach((response) => {
    const description = response.question.trim();
    let property = existingResponseProperties.find((p) => p.description === description);

    if (!property) {
      property = createNewFormProperty(description);
      newProperties.push(property);
    }

    if (property) {
      mappedProperties[property.id] = response.answer;
    }
  });

  return { newProperties, mappedProperties };
}
