import type { PageContent } from 'models';

import { IDType, Utils } from '../utils';

import type { Block } from './block';
import { createBlock } from './block';
import type { Card } from './card';

type PropertyType = 'text' | 'number' | 'select' | 'multiSelect' | 'date' | 'person' | 'file' | 'checkbox' | 'url' | 'email' | 'phone' | 'createdTime' | 'createdBy' | 'updatedTime' | 'updatedBy'

interface IPropertyOption {
    id: string;
    value: string;
    color: string;
}

// A template for card properties attached to a board
interface IPropertyTemplate {
    id: string;
    name: string;
    type: PropertyType;
    options: IPropertyOption[];
}

type BoardFields = {
    icon: string;
    description: PageContent;
    showDescription?: boolean;
    isTemplate?: boolean;
    cardProperties: IPropertyTemplate[];
    columnCalculations: Record<string, string>;
}

type Board = Block & {
    fields: BoardFields;
}

function createBoard ({ block, addDefaultProperty }: { block?: Block, addDefaultProperty?: boolean } | undefined = {}): Board {
  addDefaultProperty = addDefaultProperty ?? false;
  const cardProperties: IPropertyTemplate[] = block?.fields.cardProperties.map((o: IPropertyTemplate) => {
    return {
      id: o.id,
      name: o.name,
      type: o.type,
      options: o.options ? o.options.map((option) => ({ ...option })) : []
    };
  }) ?? [];

  const selectProperties = cardProperties.find((o) => o.type === 'select');

  if (!selectProperties && addDefaultProperty) {
    const property: IPropertyTemplate = {
      id: Utils.createGuid(IDType.BlockID),
      name: 'Status',
      type: 'select',
      options: [{
        color: 'propColorTeal',
        id: Utils.createGuid(IDType.BlockID),
        value: 'Completed'
      }, {
        color: 'propColorYellow',
        id: Utils.createGuid(IDType.BlockID),
        value: 'In progress'
      }, {
        color: 'propColorRed',
        id: Utils.createGuid(IDType.BlockID),
        value: 'Not started'
      }]
    };
    cardProperties.push(property);
  }

  return {
    ...createBlock(block),
    type: 'board',
    fields: {
      showDescription: block?.fields.showDescription || false,
      description: block?.fields.description || '',
      icon: block?.fields.icon || '',
      isTemplate: block?.fields.isTemplate || false,
      columnCalculations: block?.fields.columnCalculations || [],
      headerImage: block?.fields.headerImage || null,
      cardProperties
    }
  };
}

type BoardGroup = {
    option: IPropertyOption;
    cards: Card[];
}

export { createBoard };
export type { Board, PropertyType, IPropertyOption, IPropertyTemplate, BoardGroup };

