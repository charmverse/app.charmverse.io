import { prisma } from 'db';
import { getPage } from 'lib/pages/server';
import { getMarkdownText } from 'lib/prosemirror/getMarkdownText';

import { PageNotFoundError } from './errors';

/**
 * @swagger
 * components:
 *  schemas:
 *    Page:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        content:
 *          type: object
 *          properties:
 *            text:
 *              type: string
 *            markdown:
 *              type: string
 *        title:
 *          type: string
 *          example: Exampel page title
 *        url:
 *          type: string
 *          example: https://app.charmverse.io/charmverse/page-1337
 *
 */
export type PublicApiPage = {
  id: string;
  createdAt: Date | string;
  content: {
    text: string;
    markdown: string;
  };
  title: string;
  url: string;
};

type Props = {
  pageIdOrPath: string;
  spaceId: string;
};

export async function getPageApi({ pageIdOrPath, spaceId }: Props): Promise<PublicApiPage> {
  const page = await getPage(pageIdOrPath, spaceId);
  const space = await prisma.space.findUnique({ where: { id: spaceId } });

  if (!page) {
    throw new PageNotFoundError(pageIdOrPath);
  }

  const markdown = await getMarkdownText(page.content);

  const apiPage: PublicApiPage = {
    id: page.id,
    createdAt: page.createdAt,
    content: {
      text: page.contentText ?? '',
      markdown
    },
    title: page.title ?? '',
    url: `${process.env.DOMAIN}/${space?.domain}/${page.path}`
  };

  return apiPage;
}
