
import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { CardFromBlock } from 'lib/blocks-api/card.class';
import { Card, CardProperty } from 'lib/blocks-api/interfaces';
import { mapProperties } from 'lib/blocks-api/mapProperties';
import { getSpaceFromApiKey, onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getCard)
  .patch(updateCard);

/**
 * @swagger
 * /databases/{databaseId}/card/{cardId}:
 *   get:
 *     summary: Find card by ID
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Card'
 */
async function getCard (req: NextApiRequest, res: NextApiResponse) {

  const { cardId, id } = req.query;

  const space = await getSpaceFromApiKey(req);

  const [board, card] = await Promise.all([
    prisma.block.findFirst({
      where: {
        // Parameter only added for documentation purposes. All cards linked to a root board
        type: 'board',
        id: id as string,
        spaceId: space.id
      }
    }),
    prisma.block.findFirst({
      where: {
        type: 'card',
        id: cardId as string,
        rootId: id as string,
        spaceId: space.id
      }
    })
  ]);

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }
  if (!card) {
    return res.status(404).send({ error: 'Card not found' });
  }

  const cardPageContent = await prisma.block.findFirst({
    where: {
      type: 'charm_text',
      parentId: card.id
    }
  });

  const boardSchema = (board.fields as any).cardProperties as CardProperty[];

  const cardToReturn = new CardFromBlock(card, boardSchema, (cardPageContent?.fields as any)?.content);

  return res.status(200).json(cardToReturn);
}

/**
 * @swagger
 * /databases/{databaseId}/cards:
 *   patch:
 *     summary: Update an existing card in the database
 *     description: Update a card's title and / or its custom properties.
 *     requestBody:
 *       content:
 *          application/json:
 *                schema:
 *                  $ref: '#/components/schemas/CardQuery'
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Card'
 */
async function updateCard (req: NextApiRequest, res: NextApiResponse) {

  const { cardId, id } = req.query;

  const space = await getSpaceFromApiKey(req);

  const [board, card] = await Promise.all([
    prisma.block.findFirst({
      where: {
        // Parameter only added for documentation purposes. All cards linked to a root board
        type: 'board',
        id: id as string,
        spaceId: space.id
      }
    }),
    prisma.block.findFirst({
      where: {
        type: 'card',
        id: cardId as string,
        rootId: id as string,
        spaceId: space.id
      }
    })
  ]);

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }
  if (!card) {
    return res.status(404).send({ error: 'Card not found' });
  }

  const boardSchema: CardProperty [] = (board.fields as any).cardProperties;

  const requestBodyUpdate = req.body as Pick<Card, 'cardProperties' | 'title'>;

  const updateContent: Prisma.BlockUpdateInput = {
  };

  if (requestBodyUpdate.title) {
    updateContent.title = requestBodyUpdate.title;
  }

  if (requestBodyUpdate.cardProperties) {
    try {

      const mappedProperties = mapProperties(requestBodyUpdate.cardProperties, boardSchema);

      const newPropertySet = {
        ...(card.fields as any).properties,
        ...mappedProperties
      };

      const newFields = {
        ...(card.fields as any),
        properties: newPropertySet
      };

      updateContent.fields = newFields;

    }
    catch (error) {
      return res.status(400).json(error);
    }
  }

  const updatedCard = await prisma.block.update({
    where: {
      id: cardId as string
    },
    data: updateContent
  });

  const cardPageContent = await prisma.block.findFirst({
    where: {
      type: 'charm_text',
      parentId: card.id
    }
  });

  const cardToReturn = new CardFromBlock(updatedCard, boardSchema, (cardPageContent?.fields as any)?.content);

  return res.status(200).json(cardToReturn);
}

export default handler;
