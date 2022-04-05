
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Card } from 'pages/api/v1/databases/interfaces';
import { convertPageContentToMarkdown } from 'lib/utilities/strings';
import { PageContent } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getCard);

/**
 * @swagger
 * /databases/{databaseId}:
 *   get:
 *     summary: Find database by ID
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/BoardPage'
 */
async function getCard (req: NextApiRequest, res: NextApiResponse) {

  const { cardId, id } = req.query;

  const card = await prisma.block.findFirst({
    where: {
      type: 'card',
      id: cardId as string,
      rootId: id as string
    }
  });

  if (!card) {
    return res.status(400).send({ error: 'Task not found' });
  }

  const cardContent = (await prisma.block.findFirst({
    where: {
      type: 'charm_text',
      parentId: card.id
    }
  })) ?? {};

  const markdown = '';

  // convertPageContentToMarkdown(cardContent as PageContent, card.title);

  const cardToReturn: Card = {
    id: card.id,
    databaseId: card.rootId,
    title: card.title,
    content: markdown,
    isTemplate: (card.fields as any).isTemplate === true,
    properties: (card.fields as any).properties
  };

  return res.status(200).json(cardToReturn);
}

export default handler;
