
import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { PageFromBlock, Page, PageProperty, mapProperties, validateUpdateData } from 'lib/public-api';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getPage)
  .patch(updatePage);

/**
 * @swagger
 * /databases/{databaseId}/pages/{pageId}:
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
async function getPage (req: NextApiRequest, res: NextApiResponse) {

  const { pageId, id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const [board, card] = await Promise.all([
    prisma.block.findFirst({
      where: {
        // Parameter only added for documentation purposes. All cards linked to a root board
        type: 'board',
        id: id as string,
        spaceId
      }
    }),
    prisma.block.findFirst({
      where: {
        type: 'card',
        id: pageId as string,
        rootId: id as string,
        spaceId
      }
    })
  ]);

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }
  if (!card) {
    return res.status(404).send({ error: 'Page not found' });
  }

  const cardPageContent = await prisma.block.findFirst({
    where: {
      type: 'charm_text',
      parentId: card.id
    }
  });

  const boardSchema = (board.fields as any).cardProperties as PageProperty[];

  const cardToReturn = new PageFromBlock(card, boardSchema, (cardPageContent?.fields as any)?.content);

  return res.status(200).json(cardToReturn);
}

/**
 * @swagger
 * /databases/{databaseId}/pages:
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

  const { pageId, id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const [board, card] = await Promise.all([
    prisma.block.findFirst({
      where: {
        // Parameter only added for documentation purposes. All cards linked to a root board
        type: 'board',
        id: id as string,
        spaceId
      }
    }),
    prisma.block.findFirst({
      where: {
        type: 'card',
        id: pageId as string,
        rootId: id as string,
        spaceId
      }
    })
  ]);

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }
  if (!card) {
    return res.status(404).send({ error: 'Page not found' });
  }

  const boardSchema: PageProperty [] = (board.fields as any).cardProperties;

  const requestBodyUpdate = req.body as Pick<Page, 'properties' | 'title'>;

  try {
    validateUpdateData(requestBodyUpdate);
  }
  catch (error) {
    return res.status(400).json(error);
  }

  const updateContent: Prisma.BlockUpdateInput = {
  };

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

  const updatedPage = await prisma.block.update({
    where: {
      id: pageId as string
    },
    data: updateContent
  });

  const cardPageContent = await prisma.block.findFirst({
    where: {
      type: 'charm_text',
      parentId: card.id
    }
  });

  const cardToReturn = new PageFromBlock(updatedPage, boardSchema, (cardPageContent?.fields as any)?.content);

  return res.status(200).json(cardToReturn);
}

export default handler;
