import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { getMarkdownText } from 'lib/prosemirror/getMarkdownText';

import { PageNotFoundError } from './errors';
import { getDatabaseWithSchema } from './getDatabaseWithSchema';
import type { CardPage } from './interfaces';
import { PageFromBlock } from './pageFromBlock.class';

type CardPageRequest = {
  spaceId: string;
  cardId: string;
};

export async function getCardPageInDatabase({ cardId, spaceId }: CardPageRequest): Promise<CardPage> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid space ID: ${spaceId}`);
  } else if (!cardId || typeof cardId !== 'string') {
    throw new InvalidInputError(`Please provide a valid card ID or page path`);
  }
  const cardIdIsUuid = stringUtils.isUUID(cardId);

  const cardPage = await prisma.page.findFirst({
    where: {
      spaceId,
      type: {
        in: ['card', 'card_synced']
      },
      id: cardIdIsUuid ? cardId : undefined,
      path: !cardIdIsUuid ? cardId : undefined
    }
  });

  if (!cardPage) {
    throw new PageNotFoundError(cardId);
  }

  const cardBlock = await prisma.block.findFirst({
    where: {
      id: cardPage.id,
      type: 'card'
    }
  });

  if (!cardBlock) {
    throw new PageNotFoundError(cardId);
  }

  const databaseWithSchema = await getDatabaseWithSchema({
    databaseId: cardBlock.rootId,
    spaceId
  });

  const cardToReturn = new PageFromBlock({ ...cardBlock, title: cardPage.title }, databaseWithSchema.schema);

  cardToReturn.content.markdown = await getMarkdownText({
    content: cardPage.content
  });

  return cardToReturn;
}
