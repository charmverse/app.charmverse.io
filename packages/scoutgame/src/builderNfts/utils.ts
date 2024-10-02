import { formatUnits } from 'viem';

export function convertCostToUsd(cost: bigint) {
  return `$${parseFloat(formatUnits(cost, 6)).toLocaleString()}`;
}

// 1 Point is $.10. So $1 is 10 points
export function convertCostToPoints(costWei: bigint) {
  const costInUsd = Number(formatUnits(costWei, 6));
  // 50% discount
  return Math.round(costInUsd * 10);
}

// 50% discount
export function convertCostToPointsWithDiscount(costWei: bigint) {
  return Math.round(convertCostToPoints(costWei) * 0.5);
}
