import { log } from '@charmverse/core/log';
import type { Prisma, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { getRequestLanguage } from '@packages/lib/middleware/getRequestLanguage';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { formatDateTime } from '@packages/lib/utils/dates';
import { pageMetaSelect } from '@packages/pages/pageMetaSelect';
import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { DataConflictError } from '@packages/utils/errors';
import jsZip from 'jszip';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import { getPagePath } from 'lib/pages';
import { generateFirstDiff } from 'lib/pages/server/generateFirstDiff';
import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';

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

        if (pagesToCreate.length > 0) {
          const parentPage = await prisma.page.create({
            data: {
              id: parentPageId,
              title: `Markdown import ${formatDateTime(new Date(), getRequestLanguage(req))}`,
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

          const pageDiffs: Prisma.PageDiffCreateManyInput[] = pagesToCreate
            .filter((p) => !!p.content)
            .map((p) => {
              const diff = generateFirstDiff({
                createdBy: p.createdBy,
                content: p.content
              });
              return {
                ...diff,
                pageId: p.id
              } as Prisma.PageDiffCreateManyInput;
            });

          await prisma.$transaction([
            prisma.page.createMany({
              data: pagesToCreate
            }),
            prisma.pageDiff.createMany({
              data: pageDiffs
            })
          ]);
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

          const createdPages = await prisma.page.findMany({
            where: {
              id: {
                in: pageIds
              }
            },
            select: pageMetaSelect()
          });
          res.status(201).send(createdPages);
        } else {
          res.status(200).send([]);
        }
      } catch (err) {
        log.error('Unable to import pages', { error: err, userId, spaceId });
        if (!res.headersSent) {
          res.status(406).send(new DataConflictError('Unable to import pages'));
        }
      }
    });
}

export default withSessionRoute(handler);
