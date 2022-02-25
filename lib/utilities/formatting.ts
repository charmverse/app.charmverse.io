import { FiatCurrency } from '../../models/Currency';

export function formatMoney (amount: number, currency: FiatCurrency): string {

  const userLocale = window.navigator.language;

  const formatter = new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency
  });

  return formatter.format(amount);

}
