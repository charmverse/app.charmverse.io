export function getNftTokenUrlPath({
  season,
  tokenId,
  filename,
  contractName
}: {
  season: string;
  filename: `${'starter-pack-' | ''}${'artwork.png' | 'metadata.json'}`;
  tokenId: number;
  contractName: string;
}) {
  return `seasons/${season}/${contractName}/${tokenId}/${filename}`;
}

export function getNftCongratsPath({
  season,
  tokenId,
  starterPack,
  contractName
}: {
  season: string;
  tokenId: number;
  starterPack?: boolean;
  contractName: string;
}) {
  return `seasons/${season}/${contractName}/${tokenId}/${starterPack ? 'starter-pack-' : ''}${'congrats.png'}`;
}

export function getShareImagePath({
  season,
  tokenId,
  contractName
}: {
  season: string;
  tokenId: number;
  contractName: string;
}) {
  return `seasons/${season}/${contractName}/${tokenId}/congrats.png`;
}

export const imageDomain = 'https://nft.scoutgame.xyz';
