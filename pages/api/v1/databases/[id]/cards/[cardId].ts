
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Card } from 'pages/api/v1/databases/interfaces';
import { convertPageContentToMarkdown } from 'components/common/CharmEditor/CharmEditor';
import { PageContent } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getCard);

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

  const card = await prisma.block.findFirst({
    where: {
      type: 'card',
      id: cardId as string,
      rootId: id as string
    }
  });

  if (!card) {
    return res.status(404).send({ error: 'Card not found' });
  }

  const [board, cardPageContent] = await Promise.all([
    prisma.block.findFirst({
      where: {
        // Parameter only added for documentation purposes. All cards linked to a root board
        type: 'board',
        id: card.rootId
      }
    }),
    prisma.block.findFirst({
      where: {
        type: 'charm_text',
        parentId: card.id
      }
    }) as any
  ]);

  const markdown = '';
  // convertPageContentToMarkdown(cardPageContent, card.title);

  const cardToReturn: Card = {
    id: card.id,
    createdAt: new Date(card.createdAt).toISOString(),
    updatedAt: new Date(card.updatedAt).toISOString(),
    databaseId: card.rootId,
    title: card.title,
    content: markdown,
    isTemplate: (card.fields as any).isTemplate === true,
    cardProperties: (card.fields as any).properties
  };

  return res.status(200).json(cardToReturn);
}

export default handler;
