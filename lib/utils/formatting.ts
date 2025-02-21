import type { FiatCurrency } from '@packages/blockchain/connectors/chains';

export function formatMoney(amount: number, currency: FiatCurrency, userLocale: string): string {
  const minimumFractionDigits = amount < 1 && amount > -1 ? 4 : 2;

  const formatter = new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits
  });

  return formatter.format(amount);
}
