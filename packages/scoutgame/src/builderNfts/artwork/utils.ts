// something to differentiate between different deployments of a contract
const contractName = process.env.SCOUTGAME_CONTRACT_NAME || 'dev';

export function getNftTokenUrlPath({
  season,
  tokenId,
  filename
}: {
  season: string;
  filename: 'artwork.png' | 'metadata.json';
  tokenId: number;
}) {
  return `seasons/${season}/${contractName}/${tokenId}/${filename}`;
}

export function getNftCongratsPath({ season, tokenId }: { season: string; tokenId: number }) {
  return `seasons/${season}/${contractName}/${tokenId}/congrats.png`;
}

export const imageDomain = 'https://nft.scoutgame.xyz';
