import { SCOUTGAME_METADATA_PATH_PREFIX } from './constants';

const SCOUTGAME_S3_BUCKET = process.env.SCOUTGAME_S3_BUCKET ?? 'scoutgame.public';

export function replaceS3Domain<T extends string | undefined | null>(url: T) {
  if (!url) return url;
  return url.replace('https://s3.amazonaws.com/scoutgame.public/', 'https://nft.scoutgame.xyz/');
}

export function getAttestationMetadataS3Path({
  userId,
  schemaId,
  key = '',
  metadataType
}: {
  userId: string;
  schemaId: string;
  key?: string;
  metadataType: 'profile' | 'github_contribution';
}) {
  const relativePath = `attestations/${SCOUTGAME_METADATA_PATH_PREFIX}/${userId}/${schemaId}-${metadataType}/${key}metadata.json`;

  const fullPath = `https://s3.amazonaws.com/${SCOUTGAME_S3_BUCKET}/${relativePath}`;

  return {
    relativePath,
    fullPath,
    fullPathWithCdn: replaceS3Domain(fullPath)
  };
}
