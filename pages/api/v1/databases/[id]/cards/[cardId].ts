
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { CardFromBlock } from 'pages/api/v1/databases/card.class';
import { CardProperty } from 'pages/api/v1/databases/interfaces';

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

  const [board, card] = await Promise.all([
    prisma.block.findFirst({
      where: {
        // Parameter only added for documentation purposes. All cards linked to a root board
        type: 'board',
        id: id as string
      }
    }),
    prisma.block.findFirst({
      where: {
        type: 'card',
        id: cardId as string,
        rootId: id as string
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

export default handler;
