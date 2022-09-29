import { prisma } from 'db';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { getPreviewImageFromContent } from 'lib/pages/getPreviewImageFromContent';
import { PageContent } from 'models';

async function updatePageGalleryUrl () {
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
  const cardsWithFallbackImage = pagesWithContent.map(p => ({ id: p.id, galleryImg: getPreviewImageFromContent(p.content as PageContent) }) )
    .filter(p => !!p.galleryImg)

  console.log('🔥 Count of cards with gallery url:', cardsWithFallbackImage.length);

  await prisma.$transaction(cardsWithFallbackImage.map(({ id, galleryImg }) => prisma.page.update({
    where: { id },
    data: { galleryImg }
  })))

  console.log('🔥 Updated galleryUrl for all cards with image in content.');
}


updatePageGalleryUrl();
