export const bonusPartnersRecord = {
  // optimism: {
  //   name: 'Optimism',
  //   // repos: ['optimism-labs/optimism', 'optimism-labs/optimism-monorepo'],
  //   icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  // },
  // polygon: {
  //   name: 'Polygon',
  //   // repos: ['polygon-edge/polygon-edge'],
  //   icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
  // },
  celo: {
    name: 'Celo',
    icon: 'https://cryptologos.cc/logos/celo-celo-logo.png'
  },
  game7: {
    name: 'Game7',
    icon: 'https://yt3.googleusercontent.com/KHNdF-AtNsZDH0efEdZnVA4O4BjLKAkgeszsZ11mTUgjtbmc0EYfp23Y5MnIK9-tQ94M7Lu4nQ=s160-c-k-c0x00ffffff-no-rj'
  },
  'op-supersim': {
    name: 'OP Supersim',
    icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  }
} as const;

export type BonusPartner = keyof typeof bonusPartnersRecord;
