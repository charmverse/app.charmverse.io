import type { NextApiRequest, NextApiResponse } from 'next';

import { createFormResponseCard } from 'lib/pages/createFormResponseCard';
import { apiHandler } from 'lib/public-api/handler';
import type { AddFormResponseInput } from 'lib/zapier/interfaces';
import { validateFormRequestInput } from 'lib/zapier/validateFormRequestInput';

const handler = apiHandler();

handler.post(createFormResponse);

/**
 * @swagger
 * /databases/{databaseId}/form:
 *   post:
 *     summary: Create a new form response in the database.
 *     description: Create a new form response with array of questions and answers.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *               oneOf:
 *                  - type: object
 *                    properties:
 *                       all_responses:
 *                          type: string
 *                  - type: string
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
export async function createFormResponse(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const spaceId = req.authorizedSpaceId;
  const body: AddFormResponseInput = req.body;

  await validateFormRequestInput({ spaceId, databaseIdOrPath: id as string, data: body });
  const card = await createFormResponseCard({
    spaceId,
    databaseIdorPath: id as string,
    data: body,
    userId: req.botUser.id
  });

  return res.status(201).json(card);
}

export default handler;
