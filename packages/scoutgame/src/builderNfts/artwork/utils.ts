// something to differentiate between different deployments of a contract
const contractName = process.env.SCOUTGAME_CONTRACT_NAME || 'dev';

export function getNftTokenUrlPath({
  season,
  tokenId,
  filename
}: {
  season: string;
  filename: `${'starter-pack-' | ''}${'artwork.png' | 'metadata.json'}`;
  tokenId: number;
}) {
  return `seasons/${season}/${contractName}/${tokenId}/${filename}`;
}

export function getNftCongratsPath({
  season,
  tokenId,
  starterPack
}: {
  season: string;
  tokenId: number;
  starterPack?: boolean;
}) {
  return `seasons/${season}/${contractName}/${tokenId}/${starterPack ? 'starter-pack-' : ''}${'congrats.png'}`;
}

export const imageDomain = 'https://nft.scoutgame.xyz';
