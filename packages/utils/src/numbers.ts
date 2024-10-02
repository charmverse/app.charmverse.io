export function roundNumberInRange({ num, min, max }: { num: number; min: number; max: number }): number {
  const numberOrMinimum = Math.max(min, Math.round(num));

  return Math.min(max, numberOrMinimum);
}
