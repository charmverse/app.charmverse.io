import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { getMarkdownText } from 'lib/prosemirror/getMarkdownText';

import { PageNotFoundError } from './errors';
import { getDatabaseWithSchema } from './getDatabaseWithSchema';
import { handleMappedPropertyEdgeCases } from './handleMappedPropertyEdgeCases';
import type { CardPageUpdateData } from './interfaces';
import { mapPropertiesFromApiToSystem } from './mapPropertiesFromApiToSystemFormat';
import { PageFromBlock } from './pageFromBlock.class';
import { validateUpdateData } from './validateBody';

type CardPageUpdate = {
  cardId: string;
  spaceId: string;
  updatedBy: string;
  update: CardPageUpdateData;
};

export async function updateDatabaseCardPage({
  cardId,
  spaceId,
  updatedBy,
  update
}: CardPageUpdate): Promise<PageFromBlock> {
  if (!stringUtils.isUUID(updatedBy)) {
    throw new InvalidInputError(`Invalid user ID: ${updatedBy}`);
  }

  const cardPage = await prisma.page.findFirst({
    where: {
      type: 'card',
      ...generatePageQuery({
        pageIdOrPath: cardId,
        spaceIdOrDomain: spaceId
      })
    }
  });
  if (!cardPage) {
    throw new PageNotFoundError(cardId);
  }

  const card = await prisma.block.findFirst({
    where: {
      type: 'card',
      id: cardPage.id,
      spaceId
    }
  });

  if (!card) {
    throw new PageNotFoundError(cardId);
  }

  validateUpdateData(update);

  const databaseSchema = await getDatabaseWithSchema({
    databaseId: card.rootId,
    spaceId
  });
  const mappedProperties = update.properties
    ? await mapPropertiesFromApiToSystem({
        properties: update.properties ?? {},
        databaseIdOrSchema: databaseSchema.schema
      })
    : {};

  const newProperties = { ...((card.fields as any)?.properties ?? {}), ...mappedProperties };

  const validatedProperties = handleMappedPropertyEdgeCases({
    mapped: newProperties,
    schema: databaseSchema.schema
  });

  const updatedData = await prisma.$transaction(async (tx) => {
    const updatedAt = new Date();

    const updatedPage = await tx.page.update({
      where: {
        id: cardPage.id as string
      },
      data: {
        title: update.title,
        updatedAt,
        updatedBy
      }
    });

    const updatedBlock = await tx.block.update({
      where: {
        id: card.id
      },
      data: {
        updatedAt,
        updatedBy,
        fields: {
          ...(card.fields ?? ({} as any)),
          properties: validatedProperties
        }
      }
    });

    return {
      updatedPage,
      updatedBlock
    };
  });
  const cardToReturn = new PageFromBlock(
    { ...updatedData.updatedBlock, title: updatedData.updatedPage.title },
    databaseSchema.schema
  );

  if (cardPage) {
    cardToReturn.content.markdown = await getMarkdownText({
      content: cardPage.content
    });
  }

  return cardToReturn;
}
