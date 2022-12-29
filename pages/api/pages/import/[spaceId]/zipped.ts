import type { Prisma } from '@prisma/client';
import jsZip from 'jszip';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import { parseMarkdown } from 'components/common/CharmEditor/components/markdownParser/parseMarkdown';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { getPagePath } from 'lib/pages';
import { pageMetaSelect } from 'lib/pages/server/getPageMeta';
import { withSessionRoute } from 'lib/session/withSession';
import { typedKeys } from 'lib/utilities/objects';

export const config = {
  api: {
    bodyParser: false // Disallow body parsing, consume as stream
  }
};

const unzip = jsZip();

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false }))
  .post(importZippedController);
async function importZippedController(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.query;
  const { id: userId } = req.session.user;

  req.on('data', async (chunk) => {
    const content = await unzip.loadAsync(chunk);

    const fileNames = typedKeys(content.files);

    const pagesToCreate: Prisma.PageCreateManyInput[] = [];

    for (const name of fileNames) {
      if (name.toString().match('.md')) {
        const file = content.files[name];

        const fileMarkdownContent = await file.async('string');

        try {
          const parsedContent = parseMarkdown(fileMarkdownContent);
          const pageToCreate: Prisma.PageCreateManyInput = {
            id: v4(),
            title: name.toString().replace('.md', ''),
            content: parsedContent,
            contentText: fileMarkdownContent,
            path: getPagePath(),
            type: 'page',
            updatedBy: userId,
            createdBy: userId,
            spaceId: spaceId as string
          };

          pagesToCreate.push(pageToCreate);
        } catch (err) {
          // Do nothing
        }
      }
    }

    await prisma.page.createMany({
      data: pagesToCreate
    });

    const createdPages =
      pagesToCreate.length > 0
        ? await prisma.page.findMany({
            where: {
              id: {
                in: pagesToCreate.map((page) => page.id as string)
              }
            },
            select: pageMetaSelect()
          })
        : [];

    res.status(200).send(createdPages);
  });
}

export default withSessionRoute(handler);
