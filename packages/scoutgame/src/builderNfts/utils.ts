import { formatUnits } from 'viem';

export function convertCostToUsdDisplay(cost: bigint, locale?: string) {
  return `$${parseFloat(formatUnits(cost, 6)).toLocaleString(locale)}`;
}

// 1 Point is $.10. So $1 is 10 points
export function convertCostToPoints(costWei: bigint) {
  const costInUsd = Number(formatUnits(costWei, 6));
  return Math.floor(costInUsd * 10);
}
