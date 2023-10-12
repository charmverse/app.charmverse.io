import type { NextApiRequest, NextApiResponse } from 'next';

import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';
import { apiHandler } from 'lib/public-api/handler';

const handler = apiHandler();

handler.get(getDatabase);

/**
 * @swagger
 * /databases/{databaseIdOrPath}:
 *   get:
 *     summary: Find database by ID or page path
 *     description: Use the ID of the Database Page, or its path ie. 'getting-started'. <br /> <br />  The board object contains the schema for the custom properties assigned to pages inside it.
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - name: databaseIdOrPath
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *        description: ID or path of the database to retrieve
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/DatabasePage'
 */
async function getDatabase(req: NextApiRequest, res: NextApiResponse) {
  const result = await getDatabaseWithSchema({
    databaseId: req.query.id as string,
    spaceId: req.authorizedSpaceId
  });
  return res.status(200).json(result);
}

export default handler;
