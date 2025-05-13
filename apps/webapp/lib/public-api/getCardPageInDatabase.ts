import { prisma } from '@charmverse/core/prisma-client';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
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
  const cardPage = await prisma.page.findFirst({
    where: {
      type: {
        in: ['card', 'card_synced']
      },
      ...generatePageQuery({
        pageIdOrPath: cardId,
        spaceIdOrDomain: spaceId
      })
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
