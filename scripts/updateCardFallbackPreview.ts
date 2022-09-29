import { prisma } from 'db';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { getPreviewImageFromContent } from 'lib/pages/getPreviewImageFromContent';
import { PageContent } from 'models';

async function updateCardFallbackPreview () {
  const pages = await prisma.page.findMany({
    where: {
      type: 'card'
    },
    select: {
      id: true,
      content: true
    }
  });

  const pagesWithContent = pages.filter(p => !checkIsContentEmpty(p.content as PageContent))
  const cardsWithFallbackImage = pagesWithContent.map(p => ({ id: p.id, fallbackPreviewUrl: getPreviewImageFromContent(p.content as PageContent) }) )
    .filter(p => !!p.fallbackPreviewUrl)

  console.log('🔥 Count of cards with fallback url:', cardsWithFallbackImage.length);

  await prisma.$transaction(cardsWithFallbackImage.map(({ id, fallbackPreviewUrl }) => prisma.block.update({
    where: { id },
    data: { fallbackPreviewUrl }
  })))

  console.log('🔥 Updated fallbackPreviewUrl for all cards with image in content.');
}


updateCardFallbackPreview();
