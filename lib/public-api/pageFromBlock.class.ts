import type { Block } from '@charmverse/core/prisma';

import type { BoardPropertyValue, CardPage, PageContentFormats, PageProperty } from './interfaces';
import type { DatabaseDate } from './mapPropertiesFromApiToSystemFormat/mapDateFromApiToSystem';

/**
 * @content markdown - Should be generated externally and assigned to the key
 */
export class PageFromBlock implements CardPage {
  id: string;

  createdAt: string;

  updatedAt: string;

  databaseId: string;

  spaceId: string;

  content: PageContentFormats;

  title: string;

  isTemplate: boolean;

  properties: Record<string, string | number>;

  constructor(block: Block, propertySchemas: PageProperty[]) {
    this.id = block.id;
    this.createdAt = new Date(block.createdAt).toISOString();
    this.updatedAt = new Date(block.createdAt).toISOString();
    this.databaseId = block.rootId;
    this.content = {
      markdown: ''
    };
    this.title = block.title;
    this.isTemplate = (block.fields as any).isTemplate === true;
    this.spaceId = block.spaceId;
    this.properties = this.parseProperties((block.fields as any).properties ?? {}, propertySchemas);
  }

  /**
   * Convert the focalboard references to actual values
   * @param properties
   * @param propertySchemas
   */
  private parseProperties(
    properties: Record<string, BoardPropertyValue>,
    propertySchemas: PageProperty[]
  ): Record<string, string | number> {
    const values: any = Object.keys(properties).reduce(
      (constructedObj, propertyId) => {
        const matchedSchema = propertySchemas.find((schema) => schema.id === propertyId);

        if (matchedSchema) {
          const currentValue = properties[propertyId];
          let valueToAssign =
            matchedSchema.type === 'select'
              ? matchedSchema.options?.find((option) => option.id === currentValue)?.value
              : matchedSchema.type === 'multiSelect'
                ? (currentValue as string[])
                    .map((value) => matchedSchema.options?.find((op) => op.id === value)?.value)
                    .filter((value) => !!value)
                : currentValue;

          // Provide some extra mappings for fields
          if (valueToAssign) {
            if (matchedSchema.type === 'number') {
              if (typeof valueToAssign !== 'number') {
                valueToAssign = parseFloat(valueToAssign as string);
              }
            } else if (matchedSchema.type === 'checkbox') {
              // Empty checkbox considered as false
              valueToAssign = valueToAssign === 'true' || valueToAssign === true;
            } else if (matchedSchema.type === 'date') {
              try {
                const parsed = JSON.parse(valueToAssign as string) as DatabaseDate;
                valueToAssign = parsed;
              } catch (err) {
                // Ignore
              }
            }
          }

          const humanFriendlyPropertyKey = matchedSchema.name;

          constructedObj[humanFriendlyPropertyKey] = valueToAssign;
        }

        return constructedObj;
      },
      <any>{}
    );

    return values;
  }
}
