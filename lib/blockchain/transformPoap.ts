import type { Collectable, ExtendedPoap } from './interfaces';

export function transformPoap(poap: ExtendedPoap): Collectable {
  return {
    type: 'poap',
    date: poap.created as string,
    id: poap.id,
    image: poap.imageURL,
    title: poap.name,
    link: `https://app.poap.xyz/token/${poap.tokenId}`,
    isHidden: poap.isHidden,
    walletId: poap.walletId
  };
}
