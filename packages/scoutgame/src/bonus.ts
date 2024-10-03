export const bonusPartnersRecord: Record<string, { repos: string[]; icon: string; name: string }> = {
  optimism: {
    name: 'Optimism',
    repos: ['optimism-labs/optimism'],
    icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  },
  polygon: {
    name: 'Polygon',
    repos: ['polygon-edge/polygon-edge'],
    icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
  },
  charmverse: {
    name: 'Charmverse',
    repos: ['charmverse/test-repo'],
    icon: 'https://app.charmverse.io/images/logo_black_lightgrey.png'
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
      'hypercerts-org'
    ],
    icon: 'https://cryptologos.cc/logos/celo-celo-logo.png'
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
