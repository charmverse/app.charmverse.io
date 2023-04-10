import type { Typeform } from '@typeform/api-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { simplifyTypeformResponse } from 'lib/apiPageKey/utilities';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { createFormResponseCard } from 'lib/pages/createFormResponseCard';
import { DataNotFoundError } from 'lib/utilities/errors';
import type { AddFormResponseInput } from 'lib/zapier/interfaces';
import { validateFormRequestInput } from 'lib/zapier/validateFormRequestInput';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['id', 'key'], 'query')).post(createFormResponse);

/**
 * @swagger
 * /databases/{databaseId}/{key}:
 *   post:
 *     summary: Create a new form response in the database from an external service.
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
  const pageId = req.query.id as string;
  const key = req.query.key as string;

  const apiPageKeyWithSpaceId = await prisma.apiPageKeys.findUnique({
    where: { apiKey: key },
    select: {
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      pageId: true,
      apiKey: true,
      type: true,
      page: {
        select: { spaceId: true }
      }
    }
  });

  if (!apiPageKeyWithSpaceId) {
    throw new DataNotFoundError('Api key could not be found');
  }

  let body: AddFormResponseInput = [];

  if (apiPageKeyWithSpaceId.type === 'typeform' && req.body.form_response) {
    const payload = req.body.form_response as Typeform.Response;
    body = simplifyTypeformResponse(payload);
  }

  await validateFormRequestInput({
    spaceId: apiPageKeyWithSpaceId.page.spaceId,
    databaseIdOrPath: apiPageKeyWithSpaceId.pageId,
    data: body
  });

  const card = await createFormResponseCard({
    spaceId: apiPageKeyWithSpaceId.page.spaceId,
    databaseIdorPath: pageId,
    data: body,
    userId: apiPageKeyWithSpaceId.createdBy
  });

  return res.status(201).json(card);
}

export default handler;
