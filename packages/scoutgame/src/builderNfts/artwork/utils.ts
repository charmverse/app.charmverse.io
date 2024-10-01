export function getNftFilePath({
  season,
  tokenId,
  type
}: {
  season: string;
  type: 'artwork.png' | 'metadata.json';
  tokenId: number;
}) {
  return `seasons/${season}/beta/${tokenId}/${type}`;
}

export const imageDomain = 'https://nft.scoutgame.xyz';
