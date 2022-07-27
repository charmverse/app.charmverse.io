// import { PageWithChildren } from 'lib/pages';
// import { exportSpacePages } from 'lib/spaces/exportData/exportPages';
// import fs from 'node:fs/promises';
// import { prisma } from 'db';
// import { Block, Page } from '@prisma/client';

// type PageWithCard = Page & {card: Block}

// async function recursiveWrite ({ entryPoint, page }: {entryPoint: string, page: Omit<PageWithChildren, 'permissions'>}): Promise<true> {

//   const pageTitle = page.title?.trim() || 'Untitled';

//   // Create the folder
//   const folderPath = `${entryPoint}/${page.type}-${pageTitle}-${page.id}`;

//   await fs.mkdir(folderPath);

//   // Create the page file
//   const filePath = `${folderPath}/${page.type}-${pageTitle}.json`;

//   await fs.writeFile(filePath, JSON.stringify({ ...page, children: undefined }, null, 2));

//   if (page.type === 'board' || page.type === 'card') {
//     // Create the blocks folder
//     const blocksFolderPath = `${folderPath}/blocks`;
//     await fs.mkdir(blocksFolderPath);

//     // The board is not a formal prisma relationship, so we need to fetch it, as only the card is available inside the join
//     const blockToWrite = page.type === 'card' ? (page as any as PageWithCard).card : await prisma.block.findFirst({
//       where: {
//         type: 'board',
//         rootId: page.id
//       }
//     });

//     // Write out the board block
//     const boardBlockPath = `${blocksFolderPath}/${page.type}-block-${page.type === 'board' ? page.boardId : page.cardId}.json`;
//     await fs.writeFile(boardBlockPath, JSON.stringify(blockToWrite, null, 2));

//     // Create the data for focalboard
//     if (page.type === 'board') {

//       const boardViews = await prisma.block.findMany({
//         where: {
//           rootId: page.boardId as string,
//           type: 'view'
//         }
//       });

//       // Write the view data
//       await Promise.all(boardViews.map(async view => {
//         const viewBlockPath = `${blocksFolderPath}/view-block-${view.id}.json`;
//         return fs.writeFile(viewBlockPath, JSON.stringify(view, null, 2));
//       }));
//     }
//   }

//   if (page.children && page.children.length > 0) {
//     const childEntryPoint = `${folderPath}/children`;

//     await fs.mkdir(childEntryPoint);

//     await Promise.all(page.children.map(child => {
//       return recursiveWrite({
//         entryPoint: childEntryPoint,
//         page: child
//       });
//     }));
//   }

//   return true;

// }

// /**
//  * @returns The folder path of the export folder
//  */
// async function exportSpacePagesData (spaceId: string): Promise<string> {
//   const pages = await exportSpacePages({ spaceId });

//   const exportDirectory = `${__dirname}/exports`;

//   try {
//     // Checks for existence of the export directory
//     await fs.readdir(exportDirectory);
//   }
//   catch (err: any) {
//     if (err.code === 'ENOENT') {
//       await fs.mkdir(exportDirectory);
//       return exportSpacePagesData(spaceId);
//     }
//     else {
//       throw err;
//     }
//   }

//   const basePath = `${exportDirectory}/space-${spaceId}-pages-${Date.now()}`;

//   await fs.mkdir(basePath);

//   await pages.map(p => recursiveWrite({ entryPoint: basePath, page: p }));

//   return basePath;

// }

// Added to keep this script uncommented
export const placeholder = true;

// exportSpacePagesData('da74cab3-c2b6-40bb-8734-0de5375b0fce')
//   .then(basePath => {
//     // console.log('Export complete for ', basePath);
//   });

// fs.readdir(__dirname + '/exports').then(data => {
//   console.log(data)
// })
