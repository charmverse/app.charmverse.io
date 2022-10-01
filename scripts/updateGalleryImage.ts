import { prisma } from 'db';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { PageContent } from 'models';
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getUserS3FilePath, uploadFileToS3 } from 'lib/aws/uploadToS3Server';
import { v4 as uuid } from 'uuid';

async function updatePageHasContent () {
  const pages = await prisma.page.findMany({
    where: {
      galleryImage: {
        not: null
      }
    },
    select: {
      createdBy: true,
      id: true,
      galleryImage: true
    }
  });

  const pagesToUpdate = pages.filter(p => p.galleryImage?.includes('data:image')) as { createdBy: string, id: string, galleryImage: string }[];

  console.log('🔥 Count of pages to update:', pagesToUpdate.length, 'of', pages.length);

  for (let page of pagesToUpdate) {
    try {
      const imageFile = getImageFromBinary(page.galleryImage);
      const pathInS3 = getUserS3FilePath({ userId: page.createdBy, url: imageFile.path });
      const { fileUrl } = await uploadFileToS3({ pathInS3, content: imageFile.content });

      await prisma.page.update({
        where: { id: page.id },
        data:  { galleryImage: fileUrl }
      });

      console.log(`🔥 Updated gallery image: ${fileUrl}`);
    }
    catch (e) {
      const imageFile = getImageFromBinary(page.galleryImage);
      const pathInS3 = getUserS3FilePath({ userId: page.createdBy, url: imageFile.path });
      console.error('Could not upload or set gallery image:', { imageFile, pathInS3 });
      throw e;
    }
  }
}

function getImageFromBinary (imageSource: string) {

  const fileExtension = imageSource.split('image/')[1].split(';')[0];
  const fileName = `${uuid()}.${fileExtension}`;

  const rawFileContent = imageSource.split(';base64,')[1];

  const fileContent = Buffer.from(rawFileContent, 'base64');

  return { path: fileName, content: fileContent };
}


updatePageHasContent();
