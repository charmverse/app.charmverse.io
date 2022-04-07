import { PageProperty } from './interfaces';

/**
 * Used for mapping human-friendly values to focalboard representation
 * @param props
 * @param cardPropertySchema Custom properties for cards are defined in a parent board
 */
export function mapProperties (properties: Record<string, string | number>, cardPropertySchema: PageProperty []): Record<string, string | number> {

  const keysToMap = Object.keys(properties);

  const mappedValueToReturn: Record<string, string | number> = {};

  for (const property of keysToMap) {
    const propertySchema = cardPropertySchema.find(cardProp => cardProp.name === property);

    if (!propertySchema) {
      throw {
        error: `Field '${property}' does not exist on this database`
      };
    }

    let value = properties[property];

    if (propertySchema.type === 'select' || propertySchema.type === 'multiSelect') {
      const matchedOption = propertySchema.options.find(option => option.value === value);

      if (!matchedOption) {
        throw {
          error: `Value '${value}' is not a valid option for field ${propertySchema.name}`,
          options: propertySchema.options.map(option => option.value)

        };
      }
      else {
        value = matchedOption.id;
      }
    }

    mappedValueToReturn[propertySchema.id] = value;
  }

  return mappedValueToReturn;

}
