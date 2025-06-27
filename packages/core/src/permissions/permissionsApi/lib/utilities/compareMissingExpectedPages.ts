import { prisma } from '@charmverse/core/prisma-client';

// Utility function to help with debugging visible vs invisible pages
export async function compareMissingExpectedPages({
  expected,
  received
}: {
  expected: string[];
  received: string[];
}): Promise<void> {
  // eslint-disable-next-line no-console
  console.log({ expected, received });

  // Fetch all pages that are either expected or received
  const allPages = await prisma.page.findMany({
    where: {
      id: {
        in: [...new Set([...expected, ...received])]
      }
    },
    select: {
      id: true,
      title: true
    }
  });

  // Map the fetched pages for easy lookup
  const pageMap = new Map(allPages.map((page) => [page.id, page]));

  // Identify missing pages (expected but not received)
  const missingPages = expected
    .filter((pageId) => !received.includes(pageId))
    .map((missingPageId) => ({ id: missingPageId, title: pageMap.get(missingPageId)?.title ?? 'Page not found' }));

  // eslint-disable-next-line no-console
  console.log('MISSING PAGES', missingPages);

  // Identify unexpected pages (received but not expected)
  const unexpectedPages = received
    .filter((pageId) => !expected.includes(pageId))
    .map((unexpectedPageId) => pageMap.get(unexpectedPageId));

  // eslint-disable-next-line no-console
  console.log('UNEXPECTED PAGES', unexpectedPages);
}
