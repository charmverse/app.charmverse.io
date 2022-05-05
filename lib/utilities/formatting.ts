import { FiatCurrency } from '../../models/Currency';

export function formatMoney (amount: number, currency: FiatCurrency, userLocale: string): string {

  const formatter = new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency,
    ...(amount < 1 && {
      minimumFractionDigits: 4
    })
  });

  return formatter.format(amount);
}
