import { prisma } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import { requireKeys } from 'lib/middleware';
import { getDatabaseDetails } from 'lib/pages/getDatabaseDetails';
import { createDatabaseCardPage } from 'lib/public-api';
import { defaultHandler } from 'lib/public-api/handler';
import { updateDatabaseBlocks } from 'lib/public-api/updateDatabaseBlocks';
import type { BodyFormResponse, TypeformResponse } from 'lib/typeform/interfaces';
import { simplifyTypeformResponse } from 'lib/typeform/simplifyTypeformResponse';
import { transformWebhookBodyFormResponse } from 'lib/typeform/transformWebhookBodyFormResponse';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';

const handler = defaultHandler();

handler.use(requireKeys(['key'], 'query')).post(createFormResponse);

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
  const key = req.query.key as string;

  const apiPageKeyWithSpaceId = await prisma.apiPageKey.findUnique({
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

  let body: BodyFormResponse = [];

  if (apiPageKeyWithSpaceId.type === 'typeform' && req.body.form_response) {
    const payload = req.body.form_response as TypeformResponse;
    body = simplifyTypeformResponse(payload);
  }

  const spaceId = apiPageKeyWithSpaceId.page.spaceId;
  const databaseIdorPath = apiPageKeyWithSpaceId.pageId;
  const board = await getDatabaseDetails({ spaceId, idOrPath: databaseIdorPath });

  if (!board) {
    throw new InvalidInputError('Database not found');
  }

  const fields = (board.fields as any) || {};
  const cardProperties: IPropertyTemplate[] = fields?.cardProperties || [];

  // Transform body questions and answers into card properties
  const { updatedBody, allProperties } = transformWebhookBodyFormResponse(body, cardProperties);

  if (body.length !== cardProperties.length) {
    await updateDatabaseBlocks(board, allProperties);
  }

  const mappedCardProperties = updatedBody.reduce<Record<string, string | string[]>>((acc, val) => {
    acc[val.question.id] = val.answer || '';
    return acc;
  }, {});

  const card = await createDatabaseCardPage({
    title: 'Form Response',
    properties: mappedCardProperties,
    boardId: board.id,
    spaceId,
    createdBy: apiPageKeyWithSpaceId.createdBy
  });

  return res.status(201).json(card);
}

export default handler;
