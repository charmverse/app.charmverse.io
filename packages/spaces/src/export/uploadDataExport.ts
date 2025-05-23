import { prisma } from '@charmverse/core/prisma-client';
import { getUserS3FilePath, uploadFileToS3 } from '@packages/aws/uploadToS3Server';

export async function uploadDataExport({
  compressed,
  spaceId,
  userId
}: {
  compressed: Buffer;
  spaceId: string;
  userId: string;
}) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      domain: true
    }
  });
  const filename = `space-export-${space.domain}-${new Date().toISOString().split('.')[0]}.zip`;
  const { fileUrl: url } = await uploadFileToS3({
    pathInS3: getUserS3FilePath({ userId, url: filename }),
    content: compressed,
    contentType: 'application/zip'
  });
  return url;
}
