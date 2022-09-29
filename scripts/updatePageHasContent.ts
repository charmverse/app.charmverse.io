import { prisma } from 'db';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { PageContent } from 'models';

async function updatePageHasContent () {
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      content: true
    }
  });

  const pagesWithContent = pages.filter(p => !checkIsContentEmpty(p.content as PageContent))

  console.log('🔥 Count of pages with content:', pagesWithContent.length);

  const updated = await prisma.page.updateMany({
    where: { id: { in: pagesWithContent.map(p => p.id) } },
    data:  { hasContent: true }
  })

  console.log(`🔥 Updated hasContent for ${updated.count} pages with content.`);
}


updatePageHasContent();
