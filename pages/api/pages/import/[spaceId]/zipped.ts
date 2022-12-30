import type { Prisma } from '@prisma/client';
import jsZip from 'jszip';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import { parseMarkdown } from 'components/common/CharmEditor/components/markdownParser/parseMarkdown';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import type { PageMeta } from 'lib/pages';
import { getPagePath } from 'lib/pages';
import { pageMetaSelect } from 'lib/pages/server/getPageMeta';
import { withSessionRoute } from 'lib/session/withSession';
import { DataConflictError } from 'lib/utilities/errors';

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

  const chunks: Buffer[] = [];

  req
    .on('readable', () => {
      // read every incoming chunk. Every chunk is 64Kb data of Buffer
      const chunk = req.read();
      if (chunk) {
        chunks.push(chunk);
      }
    })
    .on('end', async () => {
      try {
        const buf = Buffer.concat(chunks);
        const content = await unzip.loadAsync(buf);

        const fileNames = Object.keys(content.files);

        const pagesToCreate: Prisma.PageCreateManyInput[] = [];

        for (const name of fileNames) {
          // include Markdown but exclude MACOSX files
          const filename = name.split('/').pop() ?? '';
          if (filename.endsWith('.md') && !filename.startsWith('.')) {
            const file = content.files[name];

            const fileMarkdownContent = await file.async('string');

            try {
              const parsedContent = parseMarkdown(fileMarkdownContent);
              const pageToCreate: Prisma.PageCreateManyInput = {
                id: v4(),
                title: filename.replace('.md', ''),
                content: parsedContent,
                contentText: fileMarkdownContent,
                hasContent: fileMarkdownContent.length > 0,
                path: getPagePath(),
                type: 'page',
                updatedBy: userId,
                createdBy: userId,
                spaceId: spaceId as string
              };

              pagesToCreate.push(pageToCreate);
            } catch (err) {
              log.error('Unable to parse markdown file', { content: fileMarkdownContent, error: err, userId, spaceId });
              // Do nothing
            }
          }
        }

        const createdPages: PageMeta[] = [];

        if (pagesToCreate.length > 0) {
          await prisma.page.createMany({
            data: pagesToCreate
          });
          const _createdPages = await prisma.page.findMany({
            where: {
              id: {
                in: pagesToCreate.map((page) => page.id as string)
              }
            },
            select: pageMetaSelect()
          });

          createdPages.push(..._createdPages);
        }
        res.status(201).send(createdPages);
      } catch (err) {
        log.error('Unable to import pages', { error: err, userId, spaceId });
        if (!res.headersSent) {
          res.status(406).send(new DataConflictError('Unable to import pages'));
        }
      }
    });
}

export default withSessionRoute(handler);
