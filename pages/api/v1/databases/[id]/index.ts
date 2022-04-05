
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { filterObjectKeys } from 'lib/utilities/objects';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { BoardPage } from '../interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getDatabase);

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
async function getDatabase (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const database = await prisma.page.findFirst({
    where: {
      type: 'board',
      boardId: id as string
    },
    include: {
      space: true
    }
  });

  if (!database) {
    return res.status(400).send({ error: 'Database not found' });
  }

  const filteredDatabaseObject = filterObjectKeys(database as any as BoardPage, 'include', ['id', 'createdAt', 'type', 'title', 'content', 'url']);

  const domain = process.env.DOMAIN;

  filteredDatabaseObject.url = `${domain}/${database.space?.domain}/${database.path}`;

  return res.status(200).json(filteredDatabaseObject);
}

export default handler;
