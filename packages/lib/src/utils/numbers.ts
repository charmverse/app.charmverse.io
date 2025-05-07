/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-mixed-operators */
/* eslint-disable eqeqeq */

import { isTruthy } from '@packages/utils/types';

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
export function eToNumber(num: number | string): string {
  let sign = '';
  (num += '').charAt(0) == '-' && ((num = num.toString().substring(1)), (sign = '-'));
  const arr = num.toString().split(/[e]/gi);
  if (arr.length < 2) return sign + num;
  const dot = (0.1).toLocaleString().substr(1, 1);
  let n = arr[0];
  const exp = +arr[1];
  let w: any = (n = n.replace(/^0+/, '')).replace(dot, '');
  const pos = n.split(dot)[1] ? n.indexOf(dot) + exp : w.length + exp;
  let L: any = pos - w.length;
  const s = `${BigInt(w)}`;
  w = exp >= 0 ? (L >= 0 ? s + '0'.repeat(L) : r()) : pos <= 0 ? `0${dot}${'0'.repeat(Math.abs(pos))}${s}` : r();
  L = w.split(dot);
  if ((L[0] == 0 && L[1] == 0) || (+w == 0 && +s == 0)) w = 0; //* * added 9/10/2021
  return sign + w;
  function r() {
    return w.replace(new RegExp(`^(.{${pos}})(.)`), `$1${dot}$2`);
  }
}

export type PropertyValueCountSummary<K extends string> = Record<K, number> & {
  total: number;
};

/**
 * Return amount of times a key has a specific value, for each given set of values
 */
export function countValueOccurrences<V extends string, T = any>(
  objectList: T[],
  key: keyof T
): PropertyValueCountSummary<V> {
  const reduced: PropertyValueCountSummary<V> = objectList.reduce((summary: any, obj, index) => {
    const valueAsString = String(obj[key]) as keyof V;

    summary[valueAsString] = typeof summary[valueAsString] === 'number' ? summary[valueAsString] + 1 : 1;

    return summary;
  }, {});
  reduced.total = objectList.length;

  return reduced;
}

/**
 * Use this for converting numbers between 0 and 1 to a prefixed number
 * @abstract Only works up to atto (10^-18)
 * @param number
 * @param spaceUnit Whether to add spacing for the target unit. Defaults to false
 */
export function nanofy({ number, spaceUnit = false }: { number: string | number; spaceUnit?: boolean }): string {
  const parsedAsNum = parseFloat(number.toString());

  if (parsedAsNum >= 1 || parsedAsNum <= -1) {
    return parsedAsNum.toString();
  } else if (!isTruthy(parsedAsNum)) {
    return '0';
  }

  // This prevents scientific notation being used
  // See https://stackoverflow.com/a/1685917 for more information
  const numberAsString = parsedAsNum.toFixed(20);

  // milli (3), micro (6), nano (9), pico (12), femto (15), atto (18)
  const units = ['m', 'µ', 'n', 'p', 'f', 'a'];

  const splitted = numberAsString
    .split('')
    // Remove the decimal dot
    .slice(2);

  let rebuiltString = '';
  let currentUnit = '';

  for (let i = 0; i < splitted.length; i++) {
    if (i % 3 === 0 && rebuiltString === '') {
      currentUnit = units[units.indexOf(currentUnit) + 1];
    } else if (i % 3 === 0 && rebuiltString !== '') {
      rebuiltString += '.';
    }

    const currentCharacter = splitted[i];

    // Ensure the leading character is not 0
    if (currentCharacter !== '0' || rebuiltString.length >= 1) {
      rebuiltString += currentCharacter;
    }

    if ((rebuiltString.length === 3 && !rebuiltString.match('.')) || rebuiltString.length >= 4) {
      break;
    }
  }

  // Prevent last character being a dot or a bunch of zeros
  if (rebuiltString[rebuiltString.length - 1] === '.') {
    rebuiltString = rebuiltString.slice(0, rebuiltString.length - 1);
    // Drop decimals if there are only zeros
  } else if (parseInt(rebuiltString.split('.')[1] ?? '0') === 0) {
    rebuiltString = rebuiltString.split('.')[0];
    // If there are 3 significant digits before the decimal, drop the decimal
  } else if (rebuiltString.match('.') !== null && rebuiltString.split('.')[0].length === 3) {
    rebuiltString = rebuiltString.split('.')[0];
  }

  return `${rebuiltString}${spaceUnit ? ' ' : ''}${currentUnit}`;
}

interface PercentCalculation {
  value: number;
  total: number;
  significantDigits?: number;
}

/**
 * Returns a string representation of a percentage
 */
export function percent({ total, value, significantDigits }: PercentCalculation): string {
  significantDigits = Math.abs(significantDigits ?? 0);

  const percentage = value === 0 ? 0 : (value / total) * 100;

  return `${percentage.toFixed(significantDigits)}%`;
}

export function isNumber(number: any) {
  return !Number.isNaN(number) && typeof number === 'number';
}

export function getNumberFromString(strValue: string): number | null {
  const parsedString = parseInt(strValue, 10);
  return parsedString || parsedString === 0 ? parsedString : null;
}

export function roundNumber(num: number | undefined | null): string | undefined {
  return num?.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function roundNumberInRange({ num, min, max }: { num: number; min: number; max: number }): number {
  const numberOrMinimum = Math.max(min, Math.round(num));

  return Math.min(max, numberOrMinimum);
}

export function isBigInt(value: string) {
  try {
    return typeof BigInt(value) === 'bigint';
  } catch (e) {
    return false;
  }
}
