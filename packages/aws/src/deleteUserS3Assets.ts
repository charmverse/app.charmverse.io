import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { stringUtils } from '@packages/core/utilities';
import { awsS3Bucket } from '@packages/utils/constants';

import { getS3ClientConfig } from './getS3ClientConfig';
import { listS3BucketContents } from './listS3Assets';
import { getUserS3FilePrefix } from './uploadToS3Server';

export async function deleteUserS3Assets({ userId }: { userId: string }): Promise<void> {
  if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError('User id must be valid');
  }
  const folderPath = getUserS3FilePrefix({ userId });

  // List all objects in the subfolder
  const listedObjects = await listS3BucketContents({ prefix: folderPath });

  if (!listedObjects.Contents?.length) {
    return;
  }

  // Prepare a list of objects to be deleted
  const deleteParams = {
    Bucket: awsS3Bucket,
    Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) }
  };

  // Delete the objects
  const s3Client = new S3Client(getS3ClientConfig());
  await s3Client.send(new DeleteObjectsCommand(deleteParams));

  // Recursively delete if there are more objects to be deleted
  if (listedObjects.IsTruncated) {
    log.info('Found additional objects to delete');
    return deleteUserS3Assets({ userId });
  }
}
