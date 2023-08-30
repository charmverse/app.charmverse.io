import { v4 } from 'uuid';

import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { Card, CardPage } from './card';

export const proposalPropertyTypesList = [
  'proposalUrl',
  'proposalStatus',
  'proposalCategory',
  'proposalEvaluatedBy',
  'proposalEvaluationTotal',
  'proposalEvaluationAverage'
] as const;
export type DatabaseProposalPropertyType = (typeof proposalPropertyTypesList)[number];

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
  | 'updatedBy'
  | DatabaseProposalPropertyType;

export const propertyTypesList: PropertyType[] = [
  'text',
  'number',
  'email',
  'phone',
  'url',
  'select',
  'multiSelect',
  'date',
  'person',
  'checkbox',
  'createdTime',
  'createdBy',
  'updatedTime',
  'updatedBy',
  ...proposalPropertyTypesList
];

interface IPropertyOption<T = string> {
  id: T;
  value: string;
  color: string;
}

// A template for card properties attached to a board
export type IPropertyTemplate<T extends PropertyType = PropertyType> = {
  id: string;
  name: string;
  type: T;
  options: IPropertyOption[];
  description?: string;
};

export type DataSourceType = 'board_page' | 'google_form' | 'proposals';

export type GoogleFormSourceData = {
  credentialId: string;
  boardId?: string; // the board which contains the blocks that are synced from this form
  formId: string;
  formName: string;
  formUrl: string;
};

export type BoardFields = {
  icon: string;
  description: PageContent;
  showDescription?: boolean;
  isTemplate?: boolean;
  cardProperties: IPropertyTemplate[];
  columnCalculations: Record<string, string>;
  viewIds: string[];
  // Currently only for boards of type proposal
  sourceType?: DataSourceType;
  // Currently unused. We will migrate Google Data here in a subsequent PR
  sourceData?: GoogleFormSourceData;
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
      viewIds: block?.fields?.viewIds ?? [],
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
export type { Board, IPropertyOption, BoardGroup };
