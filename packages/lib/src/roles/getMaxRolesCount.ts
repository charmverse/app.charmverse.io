// Get max roles based on tier
export function getMaxRolesCount(tier: string | null): number {
  switch (tier) {
    case 'bronze':
      return 1;
    case 'silver':
      return 3;
    case 'gold':
    case 'grant':
      return Infinity;
    default:
      return 0; // public tier
  }
}
