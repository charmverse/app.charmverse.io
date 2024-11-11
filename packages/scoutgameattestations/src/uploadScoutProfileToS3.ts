import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { scoutGameUserProfileSchemaUid } from './constants';
import { getAttestationMetadataS3Path } from './getAttestationMetadataS3Path';

export type ScoutAttestionMetadata = {
  path: string;
  displayName: string;
};

export async function uploadScoutProfileToS3({
  metadata,
  scoutId
}: {
  metadata: ScoutAttestionMetadata;
  scoutId: string;
}) {
  const { relativePath, fullPathWithCdn } = getAttestationMetadataS3Path({
    userId: scoutId,
    metadataType: 'profile',
    schemaId: scoutGameUserProfileSchemaUid()
  });

  await uploadFileToS3({
    pathInS3: relativePath,
    content: Buffer.from(JSON.stringify(metadata, null, 2)),
    bucket: process.env.SCOUTGAME_S3_BUCKET ?? 'scoutgame.public'
  });

  return {
    metadataUrl: fullPathWithCdn,
    metadataS3Path: relativePath
  };
}
