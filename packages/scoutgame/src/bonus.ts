export const bonusPartnersRecord: Record<string, { repos: string[]; icon: string }> = {
  optimism: {
    repos: ['optimism-labs/optimism'],
    icon: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png'
  },
  polygon: {
    repos: ['polygon-edge/polygon-edge'],
    icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
  }
};

export function getBonusPartner(repo: string): string | null {
  for (const partner in bonusPartnersRecord) {
    if (bonusPartnersRecord[partner].repos.includes(repo)) {
      return partner;
    }
  }
  return null;
}
