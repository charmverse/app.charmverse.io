import { getFilePath, uploadUrlToS3 } from '@packages/aws/uploadToS3Server';
import { log } from '@packages/core/log';

// if image is stored in notion s3, it will expire so we need to re-upload it to our s3
export function getPersistentImageUrl({ image, spaceId }: { image: any; spaceId: string }): Promise<string | null> {
  const url = image.type === 'external' ? image.external.url : image.type === 'file' ? image.file.url : null;
  const isNotionS3 = url?.includes('amazonaws.com/secure.notion-static.com');
  if (url && isNotionS3) {
    const pathInS3 = getFilePath({ url, spaceId });
    return uploadUrlToS3({ pathInS3, url })
      .then((r) => r.url)
      .catch((error) => {
        log.warn('could not upload image to s3', { error });
        return url;
      });
  } else {
    return Promise.resolve(url);
  }
}
