import type { NextApiRequest, NextApiResponse } from 'next';

import type { CardPageQuery, PaginatedQuery } from 'lib/public-api';
import { apiHandler } from 'lib/public-api/handler';
import { searchDatabase } from 'lib/public-api/searchDatabase';

const handler = apiHandler();

handler.post(searchDatabaseController);

/**
 * @swagger
 * /databases/{databaseIdOrPath}/search:
 *   post:
 *     summary: Search cards in a database
 *     description: Get the available field names from the schema in the board. You can then query using its values.<br/><br/>The example properties below are only for illustrative purposes.<br/><br/>You can return up to 100 records per query
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - name: databaseIdOrPath
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *        description: ID or path of the database to search
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/PaginatedCardPageQuery'
 *
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  hasNext:
 *                    type: boolean
 *                    example: true
 *                  cursor:
 *                    type: string
 *                    example: bb6b7e20-680a-4202-8e2a-49570aba02fa
 *                  data:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Page'
 */
async function searchDatabaseController(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const searchResults = await searchDatabase({
    databaseId: id as string,
    spaceId,
    paginatedQuery: req.body as PaginatedQuery<CardPageQuery>
  });

  return res.status(200).send(searchResults);
}
export default handler;
