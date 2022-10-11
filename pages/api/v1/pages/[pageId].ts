
import type { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey, SpaceAccessDeniedError } from 'lib/middleware';
import { generateMarkdown } from 'lib/pages';
import type { Page, PageProperty } from 'lib/public-api';
import { getPageInBoard, mapProperties, PageFromBlock, validateUpdateData } from 'lib/public-api';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getPage)
  .patch(updatePage);

/**
 * @swagger
 * /pages/{pageId}:
 *   get:
 *     summary: Find page by ID
 *     responses:
 *       200:
 *         description: Page with content and properties
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
export async function getPage (req: NextApiRequest, res: NextApiResponse) {

  const { pageId } = req.query;

  const page = await getPageInBoard(pageId as string);

  const spaceId = req.authorizedSpaceId;

  if (spaceId !== page.spaceId) {
    throw new SpaceAccessDeniedError();
  }

  return res.status(200).json(page);
}

/**
 * @swagger
 * /pages/{pageId}:
 *   patch:
 *     summary: Update an existing page in the database
 *     description: Update a page's title and / or its custom properties.
 *     requestBody:
 *       content:
 *          application/json:
 *                schema:
 *                  $ref: '#/components/schemas/PageQuery'
 *     responses:
 *       200:
 *         description: Returns the updated page
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
async function updatePage (req: NextApiRequest, res: NextApiResponse) {

  const { pageId } = req.query;

  const spaceId = req.authorizedSpaceId;

  const card = await prisma.block.findFirst({
    where: {
      type: 'card',
      id: pageId as string,
      spaceId
    }
  });

  if (!card) {
    return res.status(404).send({ error: 'Page not found' });
  }
  const board = await prisma.block.findFirst({
    where: {
      // Parameter only added for documentation purposes. All cards linked to a root board
      type: 'board',
      id: card.rootId,
      spaceId
    }
  });

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }

  const boardSchema: PageProperty [] = (board.fields as any).cardProperties;

  const requestBodyUpdate = req.body as Pick<Page, 'properties' | 'title'>;

  try {
    validateUpdateData(requestBodyUpdate);
  }
  catch (error) {
    return res.status(400).json(error);
  }

  const updateContent: Prisma.BlockUpdateInput = {};

  if (requestBodyUpdate.title) {
    updateContent.title = requestBodyUpdate.title;
  }

  if (requestBodyUpdate.properties) {
    try {

      const mappedProperties = mapProperties(requestBodyUpdate.properties, boardSchema);

      const newPropertySet = {
        ...(card.fields as any).properties,
        ...mappedProperties
      };

      const newFields = {
        ...(card.fields as any),
        properties: newPropertySet
      };

      updateContent.fields = newFields;

    }
    catch (error) {
      return res.status(400).json(error);
    }
  }
  updateContent.updatedBy = req.botUser.id;
  updateContent.updatedAt = new Date().toISOString();

  const updatedPage = await prisma.block.update({
    where: {
      id: pageId as string
    },
    data: updateContent
  });

  if (updateContent.title) {
    // Update the page associated with the card block
    await prisma.page.update({
      where: {
        id: card.id
      },
      data: {
        title: requestBodyUpdate.title
      }
    });
  }

  const cardPage = await prisma.page.findUnique({
    where: {
      id: card.id
    }
  });

  const cardToReturn = new PageFromBlock(updatedPage, boardSchema);
  if (cardPage) {
    cardToReturn.content.markdown = await generateMarkdown(cardPage, true);
  }

  return res.status(200).json(cardToReturn);
}

export default handler;
