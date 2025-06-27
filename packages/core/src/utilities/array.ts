/**
 * Sort an array of objects by a property. Include an optional valuesOrder for looking up the order of a certain value
 */
export function sortArrayByObjectProperty<T = any>(data: T[], propertyKey: keyof T, valuesOrder?: any[]): T[] {
  const sortedData = data.sort((first, second) => {
    let firstPropertyValueIndex = valuesOrder ? valuesOrder.indexOf(first[propertyKey]) : first[propertyKey];
    if (firstPropertyValueIndex === -1) {
      firstPropertyValueIndex = valuesOrder ? valuesOrder.length : data.length;
    }

    let secondPropertyValueIndex = valuesOrder ? valuesOrder.indexOf(second[propertyKey]) : second[propertyKey];
    if (secondPropertyValueIndex === -1) {
      secondPropertyValueIndex = valuesOrder ? valuesOrder.length : data.length;
    }

    // Handle
    if (firstPropertyValueIndex < secondPropertyValueIndex) {
      return -1;
    } else if (firstPropertyValueIndex > secondPropertyValueIndex) {
      return 1;
    } else {
      return 0;
    }
  });

  return sortedData;
}

export function uniqueValues<T = any>(values: T[]): T[] {
  return Array.from(new Set(values));
}

// Flattens an object with list of arrays to a single list
export function flatArrayMap<T>(obj: { [key: string]: T[] }): T[] {
  return Object.keys(obj).reduce((list, key) => {
    list.push(...(obj[key] as any));
    return list;
  }, [] as T[]);
}
// usage: await asyncSeries([1,2,3], num => Promise.resolve(num));
export function asyncSeries<T, U>(
  values: U[],
  asyncIterator: (val: U) => Promise<T>,
  index = 0,
  results: T[] = []
): Promise<T[]> {
  if (index >= values.length) return Promise.resolve(results);
  return asyncIterator(values[index]).then((r) => {
    results.push(r);
    return asyncSeries(values, asyncIterator, index + 1, results);
  });
}

/**
 * Given an array of objects, extract their ids.
 *
 * Useful for example when you have an array of pages, but just want the list of page ids as strings
 */
export function extractUuids<T extends { id: string }>(items: T[]): string[] {
  return items.map((item) => item.id);
}

// sortBy, where key is a string or an array of strings
export function sortBy<T>(array: T[], key: keyof T | (keyof T)[]): T[] {
  const keys = Array.isArray(key) ? key : [key];
  return array.sort((a, b) => {
    // Handle array of keys by comparing each in order
    for (const k of keys) {
      const aVal = a[k];
      const bVal = b[k];

      if (aVal === bVal) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }

      if (aVal instanceof Date && bVal instanceof Date) {
        return aVal.getTime() - bVal.getTime();
      }

      return String(aVal).localeCompare(String(bVal));
    }
    return 0;
  });
}

// based off lodash/chunk
export function chunk<T>(array: T[], size: number): T[][] {
  return array.reduce((acc, _, i) => {
    if (i % size === 0) acc.push([]);
    acc[acc.length - 1].push(array[i]);
    return acc;
  }, [] as T[][]);
}
