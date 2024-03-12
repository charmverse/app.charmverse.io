import { prisma } from '@charmverse/core/prisma-client';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { findChildren } from 'prosemirror-utils';
import { writeFileSync } from 'fs';
const hostName = 'https://app.charmverse.io';
//const hostName = 'http://localhost:3000';
const filename = 'unlinked-pages.csv';

async function getOrphans(domain: string) {
  const { pages } = await prisma.space.findFirstOrThrow({
    where: { domain },
    include: {
      pages: {
        select: {
          id: true,
          path: true,
          title: true,
          content: true,
          createdAt: true,
          createdBy: true,
          parentId: true,
          deletedAt: true,
          type: true
        }
      }
    }
  });

  const orphans = new Map<string, (typeof pages)[number]>();
  pages.forEach((page) => {
    if (page.type !== 'board' && page.type !== 'page') {
      return;
    }
    const reference = pages.find(({ content, id, deletedAt, type }) => {
      if (deletedAt || !content) {
        return;
      }
      try {
        const doc = getNodeFromJson(content);
        const linksToPage = findChildren(doc, (node) => {
          if (node.type.name === 'page') {
            if (node.attrs.id === page.id) {
              return true;
            }
          }
          const linkMark = node.marks.some((mark) => {
            return mark.type.name === 'link' && mark.attrs.href?.includes(page.path);
          });
          if (linkMark) {
            return true;
          }
          return false;
        });
        return linksToPage.length > 0;
      } catch (error) {
        console.error('could not read page', id, error);
        return false;
      }
    });

    if (!reference) {
      orphans.set(page.id, page);
    }
  });

  const results = [...orphans].map(([id, orphan]) => ({
    id,
    createdAt: orphan.createdAt,
    createdBy: orphan.createdBy,
    parentId: orphan.parentId,
    url: `${hostName}/${domain}/${orphan.path}`,
    title: orphan.title
  }));
  console.log('orphans', results);
  console.log('Orphan count:', results.length, 'of', pages.length, 'pages');

  let csv = 'Page Title, Page URL, Parent Page Title, Author, Created Date\n';

  const users = new Map<string, { username: string }>();
  const parents = new Map<string, { title: string }>();

  for (let page of results) {
    const parent = page.parentId
      ? parents.get(page.parentId) || (await prisma.page.findUnique({ where: { id: page.parentId } }))
      : null;
    const author =
      users.get(page.createdBy) ||
      (await prisma.user.findUniqueOrThrow({ where: { id: page.createdBy }, select: { username: true } }));

    if (parent && page.parentId) {
      parents.set(page.parentId, parent);
    }
    users.set(page.createdBy, author);
    // write to CSV file
    const columns = [
      safeStr(page.title),
      safeStr(page.url),
      safeStr(parent?.title || ''),
      safeStr(author.username),
      page.createdAt.toDateString()
    ];
    csv += columns.join(',') + '\n';
  }
  writeFileSync(`${process.cwd()}/${filename}`, csv);
  process.exit();
}

getOrphans('myosinxyz').catch((error) => {
  console.error(error);
  process.exit(1);
});

function safeStr(text: string) {
  return '"' + text.replaceAll('"', '').replaceAll(',', '') + '"';
}
