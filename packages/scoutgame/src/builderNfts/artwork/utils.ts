const prefix = process.env.NFT_ARTWORK_S3_PATH || 'dev-nft-artwork';

export function getNftFilePath({
  season,
  tokenId,
  type
}: {
  season: string;
  type: 'artwork.png' | 'metadata.json';
  tokenId: number;
}) {
  return `seasons/${season}/${prefix}/${tokenId}/${type}`;
}

export function getNftCongratsFilePath({ season, tokenId }: { season: string; tokenId: number }) {
  return `seasons/${season}/nft-congrats/${tokenId}/congrats.png`;
}

export const imageDomain = 'https://nft.scoutgame.xyz';
