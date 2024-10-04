export const bonusPartnersRecord: Record<string, { repos: string[]; icon: string; name: string }> = {
  optimism: {
    name: 'Optimism',
    repos: ['optimism-labs/optimism'],
    icon: '/images/crypto/op64.png'
  },
  polygon: {
    name: 'Polygon',
    repos: ['polygon-edge/polygon-edge'],
    icon: '/images/crypto/polygon_logo.png'
  },
  charmverse: {
    name: 'Charmverse',
    repos: ['charmverse/test-repo'],
    icon: '/images/logos/charmverse_logo.png'
  },
  celo: {
    name: 'Celo',
    repos: [
      'mento-protocol/mento-web',
      'mento-protocol/reserve-site',
      'mento-protocol/mento-sdk',
      'mento-protocol/mento-web',
      'celo-org/celo-composer',
      'valora-inc/hooks',
      'Glo-Foundation/glo-wallet',
      'Ubeswap/ubeswap-interface-v3',
      'gitcoinco/grants-stack',
      'GoodDollar',
      'Ubeswap',
      'hypercerts-org'
    ],
    icon: '/images/crypto/celo_logo.png'
  },
  game7: {
    name: 'Game7',
    repos: ['G7DAO/protocol', 'G7DAO/safes', 'G7DAO/seer', 'PermissionlessGames/degen-casino'],
    icon: '/images/logos/game7_logo.svg'
  }
};

export function getBonusPartner(repo: string): string | null {
  for (const partner of Object.keys(bonusPartnersRecord)) {
    const [usernameOrOrg] = repo.split('/');
    if (
      bonusPartnersRecord[partner].repos.includes(repo) ||
      bonusPartnersRecord[partner].repos.includes(usernameOrOrg)
    ) {
      return partner;
    }
  }
  return null;
}
