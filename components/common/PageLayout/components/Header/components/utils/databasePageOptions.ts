import unionBy from 'lodash/unionBy';
import type { ParseResult } from 'papaparse';
import * as uuid from 'uuid';

import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Member } from 'lib/members/interfaces';
import { focalboardColorsMap } from 'theme/colors';

type MappedProperties = {
  id: string;
  options: Record<string, string>;
  name: string;
  type: PropertyType;
};

export const selectColors = Object.keys(focalboardColorsMap);

export const isDate = (dt: string) => {
  const date = new Date(dt);
  return !Number.isNaN(date.valueOf()) && date.getFullYear() > 1970;
};

export function isDateValid(strDate: string) {
  if (strDate.includes(' -> ')) {
    return strDate.split(' -> ').every(isDate);
  }
  return isDate(strDate);
}

export function createBoardPropertyOptions(arr: string[]): IPropertyTemplate['options'] {
  return arr
    .filter((value) => !!value)
    .map((value) => {
      // generate random color for multiSelect type
      const randomColor = selectColors[Math.floor(Math.random() * selectColors.length)];

      return {
        id: uuid.v4(),
        color: randomColor,
        value
      };
    });
}

export function isValidCsvResult(results: ParseResult<unknown>): results is ParseResult<Record<string, string>> {
  if (
    Array.isArray(results?.data) &&
    results.data.length > 0 &&
    typeof results.data[0] === 'object' &&
    results.data[0] !== null &&
    results.meta.fields
  ) {
    return true;
  }
  return false;
}

export function mapCardBoardProperties(cardProperties: IPropertyTemplate[]) {
  return cardProperties.reduce<{ [key: string]: MappedProperties }>(
    (acc, b) => ({
      ...acc,
      [b.name]: {
        id: b.id,
        type: b.type,
        name: b.name,
        options: b.options.reduce<Record<string, string>>(
          (_acc, option) => ({ ..._acc, ...{ [option.value]: option.id } }),
          {}
        )
      }
    }),
    {}
  );
}

export function createNewPropertiesForBoard(
  csvData: Record<string, string>[],
  prop: string,
  existingBoardProp?: MappedProperties
): IPropertyTemplate {
  const propValues = csvData.map((result) => result[prop]).filter((result) => !!result);
  const defaultProps = { id: uuid.v4(), name: prop, options: [] };
  const emailReg = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/;

  // If we already have a select or multiselect with the same property name, filter the duplicates out. The new values and the old values will be merged later.
  if (existingBoardProp && (existingBoardProp.type === 'select' || existingBoardProp.type === 'multiSelect')) {
    const newSelectValues = csvData
      .map((result) => result[prop])
      .filter((option) => !!option && !existingBoardProp.options[option]);

    const options = createBoardPropertyOptions(newSelectValues);

    return { ...defaultProps, options, type: existingBoardProp.type };
  }

  if (propValues.some((p) => p.includes('|'))) {
    const allMultiSelectValues = csvData.map((result) => result[prop].split('|')).flat();
    const uniqueMultiSelectValues = [...new Set(allMultiSelectValues)];
    const options = createBoardPropertyOptions(uniqueMultiSelectValues);

    return { ...defaultProps, options, type: 'multiSelect' };
  }
  if (propValues.every((p) => uuid.validate(p))) {
    return { ...defaultProps, type: 'person' };
  }
  if (propValues.every(isDateValid)) {
    return { ...defaultProps, type: 'date' };
  }
  if (propValues.every((p) => !Number.isNaN(+p))) {
    return { ...defaultProps, type: 'number' };
  }
  if (propValues.every((p) => p.startsWith('http') || p.startsWith('www.'))) {
    return { ...defaultProps, type: 'url' };
  }
  if (propValues.every((p) => emailReg.test(p))) {
    return { ...defaultProps, type: 'email' };
  }
  if (propValues.every((p) => p === 'true' || p === 'false')) {
    return { ...defaultProps, type: 'checkbox' };
  }

  return { ...defaultProps, type: 'text' };
}

export function createCardFieldProperties(
  csvRow: Record<string, string>,
  mappedBoardProperties: { [key: string]: MappedProperties },
  members: Member[]
) {
  return Object.entries(csvRow).reduce<Record<string, string | string[]>>((acc, [key, value]) => {
    // Exclude the name. That prop is used only for the card title
    if (key === 'Name') {
      return {
        ...acc
      };
    }
    const propId = mappedBoardProperties[key]?.id;

    // Verify that we have the person in the members array
    if (
      mappedBoardProperties[key]?.type === 'person' &&
      uuid.validate(value) &&
      !!members.find((member) => member.id === value)
    ) {
      return {
        ...acc,
        [propId]: value
      };
    }

    if (mappedBoardProperties[key]?.type === 'select') {
      const optionId: string = mappedBoardProperties[key].options[value];

      if (optionId && typeof optionId === 'string') {
        return {
          ...acc,
          [propId]: optionId
        };
      }
    }

    if (mappedBoardProperties[key]?.type === 'multiSelect') {
      const multiSelectValues = value.split('|');
      const optionIds = multiSelectValues.map((v) => mappedBoardProperties[key].options[v]);

      if (optionIds.length > 0) {
        return {
          ...acc,
          [propId]: optionIds
        };
      }
    }

    if (mappedBoardProperties[key]?.type === 'date') {
      const valuesArr = value.split(' -> ');

      if (valuesArr.length === 1) {
        const from = new Date(valuesArr[0]).getTime();
        const jsonValue: string = JSON.stringify({
          from
        });
        return {
          ...acc,
          [propId]: jsonValue
        };
      }

      if (valuesArr.length === 2) {
        const from = new Date(valuesArr[0]).getTime();
        const to = new Date(valuesArr[1]).getTime();
        const jsonValue: string = JSON.stringify({
          from,
          to
        });
        return {
          ...acc,
          [propId]: jsonValue
        };
      }

      return {
        ...acc
      };
    }

    if (
      mappedBoardProperties[key]?.type !== 'select' ||
      mappedBoardProperties[key]?.type !== 'multiSelect' ||
      mappedBoardProperties[key]?.type !== 'person'
    ) {
      return {
        ...acc,
        [propId]: value
      };
    }

    return {
      ...acc
    };
  }, {});
}

export function deepMergeArrays(arr1: IPropertyTemplate[], arr2: IPropertyTemplate[]): IPropertyTemplate[] {
  return [
    ...arr1
      .concat(arr2)
      .reduce<Map<string, IPropertyTemplate>>((acc, obj) => {
        const currentObj = acc.get(obj.name);

        if (currentObj) {
          return acc.set(
            obj.name,
            Object.assign(currentObj || {}, obj, { options: unionBy(currentObj.options, obj.options, 'value') })
          );
        }

        return acc.set(obj.name, Object.assign(currentObj || {}, obj));
      }, new Map())
      .values()
  ];
}
