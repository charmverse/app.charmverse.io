
import { prisma } from 'db';
import { onError, onNoMatch, getSpaceFromApiKey, requireApiKey, requireKeys } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { CardFromBlock } from 'lib/blocks-api/card.class';
import { v4 } from 'uuid';
import { Card, CardProperty } from 'lib/blocks-api/interfaces';
import { mapProperties } from 'lib/blocks-api/mapProperties';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .use(requireKeys<Card>(['title', 'properties'], 'body'))
  .post(createCard);

/**
 * @swagger
 * /databases/{databaseId}/cards:
 *   post:
 *     summary: Create a new card in the database
 *     description: Create a new card with a title and any set of values from the custom properties in your database.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/CardQuery'
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Card'
 */
async function createCard (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const space = await getSpaceFromApiKey(req);

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string,
      spaceId: space.id
    }
  });

  if (!board) {
    return res.status(404).send({ error: 'Database not found' });
  }

  const { title, properties } = req.body;

  const boardSchema = (board.fields as any).cardProperties as CardProperty [];

  let propertiesToAdd: Record<string, string | number> = {};

  try {
    propertiesToAdd = mapProperties(properties, boardSchema);
  }
  catch (error) {
    return res.status(400).json(error);
  }

  const pageId = v4();

  const block = await prisma.block.create({
    data: {
      id: v4(),
      type: 'card',
      rootId: id as string,
      parentId: id as string,
      title,
      space: {
        connect: {
          id: board.spaceId
        }
      },
      schema: 1,
      fields: {
        contentOrder: [
          pageId
        ],
        headerImage: null,
        icon: '',
        isTemplate: false,
        properties: propertiesToAdd
      }

    }
  });

  const page = await prisma.block.create({
    data: {
      id: pageId,
      type: 'charm_text',
      rootId: id as string,
      parentId: block.id,
      title: '',
      space: {
        connect: {
          id: board.spaceId
        }
      },
      schema: 1,
      fields: {
      }

    }
  });

  const card = new CardFromBlock(block, (board.fields as any).cardProperties);

  return res.status(201).send(card);

}

export default handler;
