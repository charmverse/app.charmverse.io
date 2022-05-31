/* eslint-disable */

// source: https://stackoverflow.com/questions/1685680/how-to-avoid-scientific-notation-for-large-numbers-in-javascript

/** ****************************************************************
 * Converts e-Notation Numbers to Plain Numbers
 ******************************************************************
 * @function eToNumber(number)
 * @version  1.00
 * @param   {e nottation Number} valid Number in exponent format.
 *          pass number as a string for very large 'e' numbers or with large fractions
 *          (none 'e' number returned as is).
 * @return  {string}  a decimal number string.
 * @author  Mohsen Alyafei
 * @date    17 Jan 2020
 * Note: No check is made for NaN or undefined input numbers.
 *
 **************************************************************** */
export function eToNumber (num: number | string): string {
  let sign = '';
  (num += '').charAt(0) == '-' && (num = num.toString().substring(1), sign = '-');
  const arr = num.toString().split(/[e]/ig);
  if (arr.length < 2) return sign + num;
  const dot = (0.1).toLocaleString().substr(1, 1); let n = arr[0]; const exp = +arr[1];
  let w: any = (n = n.replace(/^0+/, '')).replace(dot, '');
  const pos = n.split(dot)[1] ? n.indexOf(dot) + exp : w.length + exp;
  let L: any = pos - w.length; const
    s = `${BigInt(w)}`;
  w = exp >= 0 ? (L >= 0 ? s + '0'.repeat(L) : r()) : (pos <= 0 ? `0${dot}${'0'.repeat(Math.abs(pos))}${s}` : r());
  L = w.split(dot); if (L[0] == 0 && L[1] == 0 || (+w == 0 && +s == 0)) w = 0; //* * added 9/10/2021
  return sign + w;
  function r () {
    return w.replace(new RegExp(`^(.{${pos}})(.)`), `$1${dot}$2`);
  }
}

export type  PropertyValueCountSummary<K extends string> = Record<K, number> & {
  total: number
}

/**
 * Return amount of times a key has a specific value, for each given set of values
 */
export function countValueOccurrences<V extends string, T = any>(objectList: T [], key: keyof T): PropertyValueCountSummary<V> {
  const reduced: PropertyValueCountSummary<V> = objectList.reduce((summary: any, obj, index) => {
    const valueAsString = String(obj[key]) as keyof V;

    summary[valueAsString] = typeof summary[valueAsString] === 'number' ? summary[valueAsString] + 1 : 1

    return summary

  },{})
  reduced.total = objectList.length

  return reduced
}

