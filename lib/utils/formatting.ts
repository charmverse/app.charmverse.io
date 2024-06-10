import type { FiatCurrency } from 'connectors/chains';

export function formatMoney(amount: number, currency: FiatCurrency, userLocale: string): string {
  const minimumFractionDigits = amount < 1 && amount > -1 ? 4 : 2;

  const formatter = new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits
  });

  return formatter.format(amount);
}

export function formatDecimal(amount: number, userLocale: string): string {
  const formatter = new Intl.NumberFormat(userLocale, {
    style: 'decimal',
    notation: 'standard'
  });

  return formatter.format(amount);
}
