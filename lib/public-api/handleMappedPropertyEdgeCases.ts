import type { BoardPropertyValue, PageProperty } from './interfaces';

type PropertyEdgeCaseInput = {
  mapped: Record<string, BoardPropertyValue>;
  schema: PageProperty[];
};

/**
 * The properties should contain the new properties, and existing card properties so that the result can be considered final
 */
export function handleMappedPropertyEdgeCases({
  mapped,
  schema
}: PropertyEdgeCaseInput): Record<string, BoardPropertyValue> {
  const mappedSchema = schema.reduce(
    (acc, val) => {
      acc[val.id] = val;
      return acc;
    },
    {} as Record<string, PageProperty>
  );

  const updatedObject = Object.entries(mapped).reduce(
    (acc, [key, value]) => {
      if (mappedSchema[key]?.type === 'checkbox' && value === 'false') {
        return acc;
      }

      acc[key] = value;

      return acc;
    },
    {} as Record<string, BoardPropertyValue>
  );

  return updatedObject;
}
