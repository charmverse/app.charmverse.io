export function roundNumberInRange({ num, min, max }: { num: number; min: number; max: number }): number {
  const numberOrMinimum = Math.max(min, Math.round(num));

  return Math.min(max, numberOrMinimum);
}

export function bigIntToString(input: bigint) {
  return `${input.toString()}n`;
}

export const ceilToPrecision = (value: number, precision: number) => {
  const multiplier = 10 ** precision;
  return Math.ceil(value * multiplier) / multiplier;
};
