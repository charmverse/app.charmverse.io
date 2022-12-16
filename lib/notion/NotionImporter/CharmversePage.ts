import { v4 } from 'uuid';

// import { createPrismaPage } from '../createPrismaPage';

// import type { NotionCache } from './NotionCache';
// import type { NotionPageFetcher } from './NotionPageFetcher';

// export class CharmversePageCreator {
//   createdCharmversePageIds: Set<string> = new Set();

//   cache: NotionCache;

//   fetcher: NotionPageFetcher;

//   constructor({ cache, fetcher }: { fetcher: NotionPageFetcher; cache: NotionCache }) {
//     this.cache = cache;
//     this.fetcher = fetcher;
//   }

//   async create({
//     spaceId,
//     userId,
//     workspaceIcon,
//     workspaceName
//   }: {
//     workspaceIcon: string;
//     spaceId: string;
//     workspaceName: string;
//     userId: string;
//   }) {
//     const workspacePage = await createPrismaPage({
//       id: v4(),
//       icon: workspaceIcon,
//       spaceId,
//       title: workspaceName,
//       createdBy: userId
//     });

//     const ungroupedPageInput = {
//       id: v4(),
//       icon: null,
//       spaceId,
//       title: 'Ungrouped',
//       createdBy: userId,
//       parentId: workspacePage.id
//     };

//     let totalUngroupedPages = 0;
//     const createdCharmversePageIds: Set<string> = new Set();

//     for (let index = 0; index < this.cache.notionPages.length; index++) {
//       const notionPage = this.cache.notionPages[index];
//       // check if we already created the page and skip
//       if (
//         (notionPage?.object === 'database' || notionPage?.object === 'page') &&
//         !createdCharmversePageIds.has(notionPage.id)
//       ) {
//         totalUngroupedPages += await this.createCharmversePageFromNotionPage(
//           workspacePage.id,
//           ungroupedPageInput.id,
//           notionPage
//         );
//       }
//     }

//     if (totalUngroupedPages > 0) {
//       await createPrismaPage(ungroupedPageInput);
//     }
//   }
// }
