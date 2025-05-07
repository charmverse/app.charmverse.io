import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import { prismaToBlock } from '@packages/databases/block';
import type { IPropertyTemplate } from '@packages/databases/board';
import { getDatabaseDetails } from 'lib/pages/getDatabaseDetails';
import { createDatabaseCardPage } from 'lib/public-api/createDatabaseCardPage';
import { relay } from 'lib/websockets/relay';
import type { AddFormResponseInput, FormResponse } from '@packages/lib/zapier/interfaces';
import { parseFormData } from '@packages/lib/zapier/parseFormData';
import { v4 } from 'uuid';

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

  const fields = (board.fields as any) || {};
  const cardProperties = fields?.cardProperties || [];
  const existingResponseProperties: IPropertyTemplate[] =
    cardProperties.filter((p: IPropertyTemplate) => formResponses.some((f) => f.question === p.description)) || [];

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

function createNewFormProperty(description: string): IPropertyTemplate {
  return {
    id: v4(),
    name: description,
    type: 'text',
    options: [],
    description
  };
}

function mapAndCreateProperties(formResponses: FormResponse[], existingResponseProperties: IPropertyTemplate[]) {
  const newProperties: IPropertyTemplate[] = [];
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
