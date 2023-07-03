import { InvalidInputError } from '@charmverse/core/errors';

import { InvalidCustomPropertyKeyError, InvalidCustomPropertyValueError } from './errors';
import type { BoardPropertyValue, PageProperty } from './interfaces';

/**
 * Used for mapping human-friendly values to focalboard representation
 * @param props
 * @param cardPropertySchema Custom properties for cards are defined in a parent board
 */
export function mapPropertiesToSystemFormat(
  properties: Record<string, BoardPropertyValue>,
  cardPropertySchema: PageProperty[]
): Record<string, BoardPropertyValue> {
  if (!properties) {
    return {};
  }

  const keysToMap = Object.keys(properties);

  const mappedValueToReturn: Record<string, BoardPropertyValue> = {};

  for (const property of keysToMap) {
    const propertySchema = cardPropertySchema.find((cardProp) => cardProp.name === property);

    if (!propertySchema) {
      throw new InvalidCustomPropertyKeyError({ key: property, boardSchema: cardPropertySchema });
    }

    let value = properties[property];

    if (propertySchema.type === 'select' || propertySchema.type === 'multiSelect') {
      if (propertySchema.type === 'select' && typeof value !== 'string') {
        throw new InvalidInputError(`Invalid value type for property ${property}. Must be a string`);
      } else if (propertySchema.type === 'multiSelect' && !(value instanceof Array)) {
        throw new InvalidInputError(`Invalid value type for property ${property}. Must be an array`);
      }

      if (value instanceof Array) {
        const assignedValues = [];
        for (const valueItem of value) {
          const matchedOption = propertySchema.options?.find((option) => option.value === valueItem);

          if (!matchedOption) {
            throw new InvalidCustomPropertyValueError({
              key: property,
              value: valueItem,
              boardSchema: cardPropertySchema
            });
          } else {
            assignedValues.push(matchedOption.id);
          }
        }
        value = assignedValues;
      } else {
        const matchedOption = propertySchema.options?.find((option) => option.value === value);

        if (!matchedOption) {
          throw new InvalidCustomPropertyValueError({ key: property, value, boardSchema: cardPropertySchema });
        } else {
          value = matchedOption.id;
        }
      }
    }

    mappedValueToReturn[propertySchema.id] = value;
  }

  return mappedValueToReturn;
}
