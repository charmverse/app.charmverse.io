const SCOUTGAME_S3_BUCKET = process.env.SCOUTGAME_S3_BUCKET ?? 'scoutgame.public';

export function replaceS3Domain<T extends string | undefined | null>(url: T) {
  if (!url) return url;
  return url.replace('https://s3.amazonaws.com/scoutgame.public/', 'https://attestations.scoutgame.xyz/');
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
  const formattedKey = key && !key.endsWith('-') ? `${key}-` : key;

  const relativePath = `attestations/${schemaId}-${metadataType}/${userId}-${formattedKey}metadata.json`;

  const fullPath = `https://s3.amazonaws.com/${SCOUTGAME_S3_BUCKET}/${relativePath}`;

  return {
    relativePath,
    fullPath,
    fullPathWithCdn: replaceS3Domain(fullPath)
  };
}
