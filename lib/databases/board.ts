import type { UIBlockWithDetails } from '@root/lib/databases/block';
import { createBlock } from '@root/lib/databases/block';
import type { PageContent } from '@root/lib/prosemirror/interfaces';
import { replaceS3Domain } from '@root/lib/utils/url';
import { v4 } from 'uuid';

import type { Card } from './card';
import { Constants } from './constants';

export const proposalPropertyTypesList = [
  'proposalUrl',
  'proposalStatus',
  'proposalEvaluatedBy',
  'proposalEvaluationTotal',
  'proposalRubricCriteriaAverage',
  'proposalRubricCriteriaTotal',
  'proposalEvaluationAverage',
  'proposalEvaluationReviewerAverage',
  'proposalAuthor',
  'proposalReviewer',
  'proposalEvaluationType',
  'proposalCreatedAt',
  'proposalPublishedAt',
  'proposalStep',
  'proposalReviewerNotes',
  'proposalRubricCriteriaReviewerScore',
  'proposalRubricCriteriaReviewerComment',
  'proposalEvaluationDueDate'
] as const;

export type ProposalPropertyType = (typeof proposalPropertyTypesList)[number];

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
  | 'tokenAmount'
  | 'tokenChain'
  | 'relation'
  | ProposalPropertyType;

export interface IPropertyOption<T = string> {
  id: T;
  value: string;
  color: string;
  disabled?: boolean;
  variant?: 'chip' | 'plain';
  dropdownValue?: string; // the label to show in the dropdown, if its different from the normal value
}

export type RelationPropertyData = {
  boardId: string;
  limit: 'single_page' | 'multiple_page';
  relatedPropertyId: string | null;
  showOnRelatedBoard: boolean;
};

// A template for card properties attached to a board
export type IPropertyTemplate<T extends PropertyType = PropertyType> = {
  id: string;
  name: string;
  type: T;
  deletedAt?: string; // ISODate. If set, the property will be visible based on when the page was created
  options: IPropertyOption[];
  description?: string;
  tooltip?: string;
  formFieldId?: string;
  private?: boolean; // used for answers to form fields in proposal-as-a-source
  relationData?: RelationPropertyData;
  readOnly?: boolean; // whether this property cannot be deleted or renamed by users
  readOnlyValues?: boolean; // whether the values of this property are synced and uneditable
  dynamicOptions?: boolean; // do not rely on a static list of options
  evaluationTitle?: string; // store the title of the evaluation to group properties together
  criteriaTitle?: string; // store the title of the rubric evaluation criteria to group rubric criteria score properties together
  reviewerId?: string; // store the reviewer id for rubric evaluation criteria score properties
  templateId?: string; // store the proposal template id for rubric evaluation properties
};

export type DataSourceType = 'board_page' | 'google_form' | 'proposals' | 'reward_applications' | 'rewards';

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
  // Currently only for boards of type proposal - TODO: use DataSourceType
  sourceType?: Extract<DataSourceType, 'proposals' | 'reward_applications' | 'rewards'>;
  // Currently unused. We will migrate Google Data here in a subsequent PR
  sourceData?: GoogleFormSourceData;
};

export type Board = UIBlockWithDetails & {
  pageType: Exclude<UIBlockWithDetails['pageType'], undefined>;
  fields: BoardFields;
  isLocked?: boolean | null;
};

export type BoardGroup = {
  id: string;
  option?: IPropertyOption;
  value?: string;
  cards: Card[];
};

export function createBoard({
  block,
  addDefaultProperty
}: { block?: Partial<UIBlockWithDetails>; addDefaultProperty?: boolean } | undefined = {}): Board {
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
    pageType: 'board',
    ...createBlock(block),
    type: 'board',
    isLocked: block?.isLocked,
    fields: {
      showDescription: block?.fields?.showDescription ?? false,
      description: block?.fields?.description ?? '',
      icon: block?.fields?.icon ?? '',
      isTemplate: block?.fields?.isTemplate ?? false,
      columnCalculations: block?.fields?.columnCalculations ?? [],
      headerImage: replaceS3Domain(block?.fields?.headerImage ?? null),
      viewIds: block?.fields?.viewIds ?? [],
      ...block?.fields,
      cardProperties
    }
  };
}

// these properties cannot be deleted or renamed by users
export function isReadonlyPropertyTitle({ id: templateId, readOnly }: IPropertyTemplate): boolean {
  return (templateId.startsWith('__') && templateId !== Constants.titleColumnId) || !!readOnly;
}
