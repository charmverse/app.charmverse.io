import type { Prisma, Space } from '@prisma/client';
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
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { DataConflictError } from 'lib/utilities/errors';

export const config = {
  api: {
    bodyParser: false // Disallow body parsing, consume as stream
  }
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false }))
  .post(importZippedController);
async function importZippedController(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.query;
  const { id: userId } = req.session.user;

  const chunks: Buffer[] = [];

  const { error } = await hasAccessToSpace({
    userId,
    adminOnly: true,
    spaceId: spaceId as string
  });

  if (error) {
    throw error;
  }

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

        const content = await jsZip().loadAsync(buf);

        const fileNames = Object.keys(content.files);

        const pagesToCreate: Prisma.PageCreateManyInput[] = [];

        const parentPageId: string | undefined = fileNames.length > 0 ? v4() : undefined;

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
                parentId: parentPageId,
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
          const parentPage = await prisma.page.create({
            data: {
              id: parentPageId,
              title: `Markdown import ${humanFriendlyDate(new Date(), { withTime: true, withYear: true })}`,
              content: { type: 'doc', content: [] },
              contentText: '',
              hasContent: false,
              path: getPagePath(),
              type: 'page',
              updatedBy: userId,
              author: {
                connect: {
                  id: userId
                }
              },
              space: {
                connect: {
                  id: spaceId as string
                }
              }
            },
            include: {
              permissions: true
            }
          });

          await prisma.page.createMany({
            data: pagesToCreate
          });
          const pageIds = [parentPageId as string, ...pagesToCreate.map((page) => page.id as string)];

          const space = (await prisma.space.findUnique({
            where: {
              id: spaceId as string
            }
          })) as Space;

          const basePermissions: Prisma.PagePermissionCreateManyInput[] = [];

          pageIds.forEach((pageId) => {
            basePermissions.push({
              pageId,
              permissionLevel: space.defaultPagePermissionGroup ?? 'full_access',
              spaceId: spaceId as string
            });

            basePermissions.push({
              pageId,
              permissionLevel: 'full_access',
              userId
            });
          });

          await prisma.pagePermission.createMany({
            data: basePermissions
          });

          const _createdPages = await prisma.page.findMany({
            where: {
              id: {
                in: pagesToCreate.map((page) => page.id as string)
              }
            },
            select: pageMetaSelect()
          });

          createdPages.push(parentPage);
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
