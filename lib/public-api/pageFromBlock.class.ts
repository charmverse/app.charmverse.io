import type { Block } from '@prisma/client';

import type { CardPage, PageContentFormats, PageProperty } from './interfaces';

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
    this.properties = this.parseProperties((block.fields as any).properties, propertySchemas);
  }

  /**
   * Convert the focalboard references to actual values
   * @param properties
   * @param propertySchemas
   */
  private parseProperties(
    properties: Record<string, string | number>,
    propertySchemas: PageProperty[]
  ): Record<string, string | number> {
    const values: any = Object.keys(properties).reduce((constructedObj, propertyId) => {
      const matchedSchema = propertySchemas.find((schema) => schema.id === propertyId);

      if (matchedSchema) {
        const valueToAssign =
          matchedSchema.type === 'select' || matchedSchema.type === 'multiSelect'
            ? matchedSchema.options.find((option) => option.id === properties[propertyId])?.value
            : properties[propertyId];

        const humanFriendlyPropertyKey = matchedSchema.name;

        constructedObj[humanFriendlyPropertyKey] = valueToAssign;
      }

      return constructedObj;
    }, <any>{});

    return values;
  }
}
