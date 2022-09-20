import { InvalidCustomPropertyKeyError, InvalidCustomPropertyValueError } from './errors';
import type { PageProperty } from './interfaces';

/**
 * Used for mapping human-friendly values to focalboard representation
 * @param props
 * @param cardPropertySchema Custom properties for cards are defined in a parent board
 */
export function mapProperties (properties: Record<string, string | number>, cardPropertySchema: PageProperty []): Record<string, string | number> {

  if (!properties) {
    return {};
  }

  const keysToMap = Object.keys(properties);

  const mappedValueToReturn: Record<string, string | number> = {};

  for (const property of keysToMap) {
    const propertySchema = cardPropertySchema.find(cardProp => cardProp.name === property);

    if (!propertySchema) {
      throw new InvalidCustomPropertyKeyError({ key: property, boardSchema: cardPropertySchema });
    }

    let value = properties[property];

    if (propertySchema.type === 'select' || propertySchema.type === 'multiSelect') {
      const matchedOption = propertySchema.options.find(option => option.value === value);

      if (!matchedOption) {
        throw new InvalidCustomPropertyValueError({ key: property, value, boardSchema: cardPropertySchema });
      }
      else {
        value = matchedOption.id;
      }
    }

    mappedValueToReturn[propertySchema.id] = value;
  }

  return mappedValueToReturn;

}
