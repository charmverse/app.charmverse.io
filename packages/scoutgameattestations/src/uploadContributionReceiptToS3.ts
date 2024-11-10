import { uploadFileToS3 } from '@packages/aws/uploadToS3Server';

import { scoutGameUserProfileSchemaUid } from './constants';
import { getAttestationMetadataS3Path } from './getAttestationMetadataS3Path';

export type ContributionReceiptMetadata = {
  description: string;
};

export async function uploadContributionReceiptToS3({
  metadata,
  scoutId,
  gemReceiptId
}: {
  metadata: ContributionReceiptMetadata;
  scoutId: string;
  gemReceiptId: string;
}) {
  const { relativePath, fullPath } = getAttestationMetadataS3Path({
    userId: scoutId,
    metadataType: 'github_contribution',
    schemaId: scoutGameUserProfileSchemaUid(),
    key: gemReceiptId
  });

  await uploadFileToS3({
    pathInS3: relativePath,
    content: Buffer.from(JSON.stringify(metadata, null, 2)),
    bucket: process.env.SCOUTGAME_S3_BUCKET ?? 'scoutgame.public'
  });

  return {
    metadataUrl: fullPath,
    metadataS3Path: relativePath
  };
}
