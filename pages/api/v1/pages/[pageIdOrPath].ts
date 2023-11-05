import type { NextApiRequest, NextApiResponse } from 'next';

import type { PublicApiPage } from 'lib/public-api/getPageApi';
import { getPageApi } from 'lib/public-api/getPageApi';
import { apiHandler } from 'lib/public-api/handler';

const handler = apiHandler();

handler.get(getPageHandler);

/**
 * @swagger
 * /pages/{pageIdOrPath}:
 *   get:
 *     summary: Find page by ID or path
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - name: pageIdOrPath
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *        description: ID or path of the page to retrieve
 *     responses:
 *       200:
 *         description: Page with content and markdown
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
export async function getPageHandler(req: NextApiRequest, res: NextApiResponse<PublicApiPage>) {
  const { pageIdOrPath } = req.query as { pageIdOrPath: string };
  const spaceId = req.authorizedSpaceId;

  const page = await getPageApi({ pageIdOrPath, spaceId });

  return res.status(200).json(page);
}

export default handler;
