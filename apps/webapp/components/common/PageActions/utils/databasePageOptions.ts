import { chunk } from 'lodash';
import unionBy from 'lodash/unionBy';
import type { ParseResult } from 'papaparse';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import charmClient from 'charmClient';
import type { Board, IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import { createCard } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import type { Member } from '@packages/lib/members/interfaces';
import { focalboardColorsMap } from 'theme/colors';

export type MappedProperties = {
  id: string;
  options: Record<string, string>;
  name: string;
  type: PropertyType;
};

export const titleColumnName = 'Title' as const;

export const selectColors = Object.keys(focalboardColorsMap);

export const isNumber = (n: string) => !Number.isNaN(+n);

export const validDate = (dt: string) => {
  const date = new Date(isNumber(dt) ? +dt : dt);

  if (!Number.isNaN(date.valueOf()) && date.getFullYear() > 2001) {
    return date;
  }
  return null;
};

export function validateAllBlockDates(strDate: string) {
  return strDate.split(' -> ').every((dt) => !!validDate(dt));
}

export function createBoardPropertyOptions(arr: string[]): IPropertyTemplate['options'] {
  return arr
    .filter((value) => !!value)
    .map((value) => {
      // generate random color for multiSelect type
      const randomColor = selectColors[Math.floor(Math.random() * selectColors.length)];

      return {
        id: uuidv4(),
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
        ...b,
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
  const defaultProps = { id: uuidv4(), name: prop, options: [], description: prop };
  const emailReg = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/;

  // If we already have a select or multiselect with the same property name, filter the duplicates out. The new values and the old values will be merged later.
  if (existingBoardProp && (existingBoardProp.type === 'select' || existingBoardProp.type === 'multiSelect')) {
    const newSelectValues = csvData
      .map((result) => result[prop].split('|'))
      .flat()
      .filter((option) => !!option && !existingBoardProp.options[option]);

    const uniqueValues = [...new Set(newSelectValues)];

    const options = createBoardPropertyOptions(uniqueValues);

    return { ...defaultProps, options, type: existingBoardProp.type };
  }

  const possibleMultiSelect = propValues.filter((p) => p.includes('|'));

  // if more than a third of the values are multiSelect, create a multiSelect property
  if (possibleMultiSelect.length > propValues.length / 3) {
    const allMultiSelectValues = csvData.map((result) => result[prop].split('|')).flat();
    const uniqueMultiSelectValues = [...new Set(allMultiSelectValues)];
    const options = createBoardPropertyOptions(uniqueMultiSelectValues);

    return { ...defaultProps, options, type: 'multiSelect' };
  }

  if (propValues.length === 0) {
    return { ...defaultProps, type: 'text' };
  }

  if (propValues.every(validateAllBlockDates)) {
    return { ...defaultProps, type: 'date' };
  }
  if (propValues.every(isNumber)) {
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

  if (prop === titleColumnName) {
    return { ...defaultProps, id: Constants.titleColumnId, type: 'text' };
  }

  return { ...defaultProps, type: 'text' };
}

export function createCardFieldProperties(
  csvRow: Record<string, string>,
  mappedBoardProperties: { [key: string]: MappedProperties },
  members: Record<string, Member>
) {
  return Object.entries(csvRow).reduce<Record<string, string | string[]>>((acc, [key, value]) => {
    // Exclude the name. That prop is used only for the card title
    if (key === titleColumnName) {
      return {
        ...acc
      };
    }
    const propId = mappedBoardProperties[key]?.id;

    // Verify that we have the person in the members array
    if (mappedBoardProperties[key]?.type === 'person' && uuidValidate(value) && !!members[value]) {
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
        const from = validDate(valuesArr[0])?.getTime();

        if (from) {
          const jsonValue: string = JSON.stringify({
            from
          });
          return {
            ...acc,
            [propId]: jsonValue
          };
        }
      }

      if (valuesArr.length === 2) {
        const fromDateString = valuesArr[0];
        const toDateString = valuesArr[1];
        const from = validDate(fromDateString)?.getTime();
        const to = validDate(toDateString)?.getTime();

        if (from && to) {
          const jsonValue: string = JSON.stringify({
            from,
            to
          });

          if (from < to) {
            return {
              ...acc,
              [propId]: jsonValue
            };
          }
        }
      }

      return {
        ...acc
      };
    }

    if (
      (mappedBoardProperties[key]?.type !== 'select' ||
        mappedBoardProperties[key]?.type !== 'multiSelect' ||
        mappedBoardProperties[key]?.type !== 'person') &&
      propId
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

export function transformApiPageKeysCsvData(
  csvData: Record<string, string>[],
  headers: string[],
  boardCardProperties: IPropertyTemplate[]
) {
  const toBeDeleted: string[] = [];

  for (const row of csvData) {
    for (const [k, v] of Object.entries(row)) {
      const cardPropertyOptionSameWithValue = boardCardProperties.find(
        (prop) => prop.type === 'multiSelect' && !!prop.options.find((o) => o.value === k)
      );
      if (
        csvData.every((_row) => _row[k] === v || !_row[k]) &&
        !boardCardProperties.find((b) => (b.description || b.name) === k) &&
        cardPropertyOptionSameWithValue
      ) {
        if (v) {
          // Add the option in the question where it belongs to
          const questionName = cardPropertyOptionSameWithValue.description || cardPropertyOptionSameWithValue.name;
          row[questionName] = row[questionName] && !row[questionName].includes(v) ? `${row[questionName]}|${v}` : v;
        }
        toBeDeleted.push(k);
      }
    }
  }

  const uniqueOrfanProps = [...new Set(toBeDeleted)];
  for (const _prop of uniqueOrfanProps) {
    csvData.forEach((_row) => {
      delete _row[_prop];
    });
    if (headers.find((h) => h === _prop)) {
      headers.splice(headers.indexOf(_prop), 1);
    }
  }
}

export function transformCsvResults(results: ParseResult<Record<string, string>>, customTitle?: string) {
  const csvData = results.data.map((csvRow) => {
    const [key, value] = Object.entries(csvRow)[0];
    if (key !== titleColumnName) {
      csvRow[titleColumnName] = customTitle || value;
      delete csvRow[key];
    }
    return csvRow;
  });
  const headers = results.meta.fields || [];
  headers[0] = titleColumnName;
  return { csvData, headers };
}

export async function addNewCards({
  board,
  boardPageId,
  views,
  results,
  spaceId,
  userId,
  members
}: {
  board: Board;
  boardPageId: string;
  views: BoardView[] | null;
  results: ParseResult<Record<string, string>>;
  spaceId: string;
  userId: string;
  members: Record<string, Member>;
}) {
  const apiPageKeys = await charmClient.getApiPageKeys({ pageId: boardPageId });
  // We assume that the first column is the title so we rename it accordingly
  const { csvData, headers } = transformCsvResults(results, apiPageKeys?.length ? 'Form Response' : undefined);

  const containsTitleProperty = board.fields.cardProperties.find(
    (cardProperty) => cardProperty.id === Constants.titleColumnId
  );

  const boardCardProperties: IPropertyTemplate[] = containsTitleProperty
    ? board.fields.cardProperties
    : [
        ...board.fields.cardProperties,
        { id: Constants.titleColumnId, name: titleColumnName, type: 'text', options: [] }
      ];
  const mappedInitialBoardProperties = mapCardBoardProperties(boardCardProperties);

  if (apiPageKeys && apiPageKeys.length > 0) {
    // For every csv row, we check if the value and keys are the same, if the value is empty, we don't have it as an initial prop from the board and if the value is an option of an existing board property with the type multiSelect
    // If true -> Add the value and create the property
    transformApiPageKeysCsvData(csvData, headers, boardCardProperties);
  }

  // Create card properties for the board
  const newBoardProperties = headers.map((prop) =>
    createNewPropertiesForBoard(csvData, prop, mappedInitialBoardProperties[prop])
  );

  /**
   * Merge the fields of both boards.
   * The order is important here. The old board should be last so it can overwrite the important properties.
   */
  const mergedFields = deepMergeArrays(newBoardProperties, boardCardProperties);

  // Create the new board and update the db
  const newBoardBlock: Board = {
    ...board,
    fields: {
      ...board.fields,
      cardProperties: mergedFields
    }
  };

  // Update board with new cardProperties
  await charmClient.updateBlock(newBoardBlock);

  // Update the view of the table to make all the cards visible
  const allTableViews = (views || [])
    .filter((_view) => _view.type === 'view' && _view.fields.viewType === 'table')
    .map(async (_view) => {
      const allCardPropertyIds = newBoardBlock.fields.cardProperties.map((prop) => prop.id);
      const newViewBlock: BoardView = {
        ..._view,
        fields: {
          ..._view.fields,
          visiblePropertyIds: allCardPropertyIds
        }
      };
      return charmClient.updateBlock(newViewBlock);
    });

  await Promise.all(allTableViews);

  // Create the new mapped board properties to know what are the ids of each property and option
  const mappedBoardProperties = mapCardBoardProperties(mergedFields);

  // Create the new card blocks from the csv data
  const blocks = csvData
    .map((csvRow) => {
      const fieldProperties = createCardFieldProperties(csvRow, mappedBoardProperties, members);

      const card = createCard({
        parentId: board.id,
        rootId: board.id,
        createdBy: userId,
        updatedBy: userId,
        spaceId,
        title: csvRow[titleColumnName],
        fields: {
          properties: fieldProperties
        }
      });

      return card;
    })
    .flat();

  // Add new cards, chunked to avoid hitting 1mb POST limit
  const cardChunks = chunk(blocks, 100);
  for (const cards of cardChunks) {
    await charmClient.insertBlocks(cards, () => null);
  }
}
