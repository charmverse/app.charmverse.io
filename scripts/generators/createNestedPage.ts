import { prisma } from '@charmverse/core/prisma-client';
import { createPage } from 'lib/pages/server/createPage';
import { v4 as uuid } from 'uuid';
import { _, jsonDoc } from 'lib/prosemirror/builders';

/**
 * Use this script to perform database searches.
 */

function getNodeIds(node: { content?: any[] }): string[] {
  return (node.content || [])
    ?.map((n) =>
      n.type === 'page' ? n.attrs.id : n.type === 'mention' && n.attrs.type === 'page' ? n.attrs.value : getNodeIds(n)
    )
    .flat()
    .filter(Boolean);
}

async function search() {
  const page = await prisma.page.findFirstOrThrow({
    where: { path: 'page-6664157761873415-restored-1713991069185' }
    //where: { id: 'fc6b0581-14ff-4f2a-b000-f7acdbcbc3b6' }
  });
  // console.log(JSON.stringify(page.content!.content, null, 2));
  // return;
  const existingPages = await prisma.page.findMany({ select: { id: true } });
  const childPageIds = ((page.content as any)!.content as any[])
    .map((node) => (node.type === 'page' ? node.attrs.id : getNodeIds(node)))
    .flat()
    .filter((id) => !!id);
  console.log('found ' + childPageIds.length + ' child nodes');
  const children = childPageIds
    .filter((id) => !existingPages.some((p) => p.id === id))
    .map((id, index) => ({
      id,
      title: 'Child page ' + (index + 1)
    }));
  console.log('creating ' + children.length + ' child pages');
  await Promise.all(
    children.map((child) => {
      return prisma.page.create({
        data: {
          id: child.id,
          spaceId: page.spaceId,
          createdBy: page.createdBy,
          title: child.title,
          parentId: page.id,
          type: 'page',
          updatedBy: page.createdBy,
          contentText: '',
          path: child.title.toLowerCase().replace(' ', '-'),
          permissions: {
            create: [
              {
                spaceId: page.spaceId,
                permissionLevel: 'full_access'
              }
            ]
          }
        }
      });
    })
  );

  // console.log('created page in ' + space.name + ' space');
}

// async function search() {
//   const space = await prisma.space.findFirstOrThrow({});
//   const children = [...new Array(200)].map((_, index) => ({
//     id: uuid(),
//     title: 'Child page ' + (index + 1)
//   }));
//   const nodes = children.map((child) => _.page({ id: child.id }));
//   const page = await prisma.page.create({
//     data: {
//       spaceId: space.id,
//       createdBy: space.createdBy,
//       title: 'Multi-children nested page',
//       type: 'page',
//       updatedBy: space.createdBy,
//       contentText: '',
//       path: 'multi-children-nested-page-' + Math.random().toString().split('.')[1],
//       content: jsonDoc(...nodes),
//       permissions: {
//         create: [
//           {
//             spaceId: space.id,
//             permissionLevel: 'full_access'
//           }
//         ]
//       }
//     }
//   });
//   await Promise.all(
//     children.map((child) => {
//       return prisma.page.create({
//         data: {
//           id: child.id,
//           spaceId: space.id,
//           createdBy: space.createdBy,
//           title: child.title,
//           parentId: page.id,
//           type: 'page',
//           updatedBy: space.createdBy,
//           contentText: '',
//           path: child.title.toLowerCase().replace(' ', '-'),
//           permissions: {
//             create: [
//               {
//                 spaceId: space.id,
//                 permissionLevel: 'full_access'
//               }
//             ]
//           }
//         }
//       });
//     })
//   );

//   console.log('created page in ' + space.name + ' space');
// }
search().then(() => console.log('Done'));
