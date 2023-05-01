import { v4 } from 'uuid';

import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { Card, CardPage } from './card';

export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'person'
  | 'file'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'createdTime'
  | 'createdBy'
  | 'updatedTime'
  | 'updatedBy';

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

export type BoardFields = {
  icon: string;
  description: PageContent;
  showDescription?: boolean;
  isTemplate?: boolean;
  cardProperties: IPropertyTemplate[];
  columnCalculations: Record<string, string>;
};

type Board = Block & {
  fields: BoardFields;
};

function createBoard({
  block,
  addDefaultProperty
}: { block?: Partial<Block>; addDefaultProperty?: boolean } | undefined = {}): Board {
  const cardProperties: IPropertyTemplate[] =
    block?.fields?.cardProperties?.map((o: IPropertyTemplate) => {
      return {
        ...o,
        options: o.options ? o.options.map((option) => ({ ...option })) : []
      };
    }) ?? [];

  const selectProperties = cardProperties.find((o) => o.type === 'select');

  if (!selectProperties && addDefaultProperty) {
    const property: IPropertyTemplate = {
      id: v4(),
      name: 'Status',
      type: 'select',
      options: [
        {
          color: 'propColorTeal',
          id: v4(),
          value: 'Completed'
        },
        {
          color: 'propColorYellow',
          id: v4(),
          value: 'In progress'
        },
        {
          color: 'propColorRed',
          id: v4(),
          value: 'Not started'
        }
      ]
    };
    cardProperties.push(property);
  }

  return {
    ...createBlock(block),
    type: 'board',
    fields: {
      showDescription: block?.fields?.showDescription ?? false,
      description: block?.fields?.description ?? '',
      icon: block?.fields?.icon ?? '',
      isTemplate: block?.fields?.isTemplate ?? false,
      columnCalculations: block?.fields?.columnCalculations ?? [],
      headerImage: block?.fields?.headerImage ?? null,
      ...block?.fields,
      cardProperties
    }
  };
}

type BoardGroup = {
  option: IPropertyOption;
  cards: Card[];
  cardPages: CardPage[];
};

export { createBoard };
export type { Board, IPropertyOption, IPropertyTemplate, BoardGroup };
