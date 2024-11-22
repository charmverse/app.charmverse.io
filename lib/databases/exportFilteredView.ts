import { InvalidInputError } from '@charmverse/core/errors';
import { baseUrl } from '@root/config/constants';
import { CardFilter } from '@root/lib/databases/cardFilter';
import type { FilterGroup } from '@root/lib/databases/filterGroup';
import { getRelatedBlocks } from '@root/lib/databases/getRelatedBlocks';
import { getBlocks as getBlocksForProposalSource } from '@root/lib/databases/proposalsSource/getBlocks';
import { permissionsApiClient } from '@root/lib/permissions/api/client';
import { isTruthy } from '@root/lib/utils/types';
import { stringify } from 'csv-stringify/sync';
import { sortBy } from 'lodash-es';

import type { Formatters, PropertyContext } from 'components/common/DatabaseEditor/octoUtils';
import { OctoUtils } from 'components/common/DatabaseEditor/octoUtils';
import { Utils } from 'components/common/DatabaseEditor/utils';
import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';

import type { Board, IPropertyTemplate, PropertyType } from './board';
import type { BoardView } from './boardView';
import type { Card } from './card';
import { Constants } from './constants';

export type FilteredViewToExport = {
  viewId?: string;
  databaseId: string;
  userId: string;
  customFilter?: FilterGroup | null;
};

export async function exportFilteredView({ databaseId, userId, customFilter, viewId }: FilteredViewToExport): Promise<{
  cards: Card[];
  boardBlock: Board;
  viewBlock: BoardView;
  blocks: Awaited<ReturnType<typeof getRelatedBlocks>>['blocks'];
}> {
  if (!databaseId) {
    throw new InvalidInputError('databaseId is required');
  }

  let { blocks } = await getRelatedBlocks(databaseId);
  const fbBlocks = blocks.map((block) => blockToFBBlock(block));
  const boardBlock = fbBlocks.find((b) => b.id === databaseId) as Board | undefined;
  if (!boardBlock) {
    throw new Error('Database block not found');
  }
  const viewBlocks = fbBlocks.filter((block) => block.type === 'view') as BoardView[];
  const viewBlock =
    viewBlocks.find((block) => (viewId ? block.id === viewId : block.fields.viewType === 'table')) || viewBlocks[0];

  // apply custom filter from user if one exists
  if (customFilter) {
    viewBlock.fields.filter = customFilter;
  }

  if (boardBlock && boardBlock.fields.sourceType === 'proposals') {
    // Hydrate and filter blocks based on proposal permissions
    blocks = await getBlocksForProposalSource(boardBlock, blocks);
  } else {
    const permissionsById = await permissionsApiClient.pages.bulkComputePagePermissions({
      pageIds: blocks.map((b) => b.pageId).filter(isTruthy),
      userId
    });
    // Remmeber to allow normal blocks that do not have a page, like views, to be shown
    blocks = blocks.filter((b) => typeof b.pageId === 'undefined' || !!permissionsById[b.pageId]?.read);
  }

  const cardBlocks = sortBy(
    blocks.filter((block) => block.type === 'card' && block.parentId === databaseId).map(blockToFBBlock),
    'createdAt'
  ) as Card[];

  return { cards: cardBlocks, boardBlock, blocks, viewBlock };
}

function generateCSV(
  board: Pick<Board, 'fields'>,
  view: BoardView,
  cards: Card[],
  formatters: Formatters,
  context: PropertyContext,
  cardMap: Record<string, { title: string }>
) {
  const { csvContent, rowIds } = generateCsvContent(board, cards, view, formatters, context, cardMap);

  let fileTitle = view.title;
  if (view.fields.sourceType === 'google_form') {
    fileTitle = `Responses to ${view.fields.sourceData?.formName}`;
  }

  const filename = `${Utils.sanitizeFilename(fileTitle || 'CharmVerse Table Export')}.csv`;

  return {
    filename,
    csvContent,
    rowIds
  };
}

export function generateCsvContent(
  board: Pick<Board, 'fields'>,
  cards: Card[],
  viewToExport: BoardView,
  formatters: Formatters,
  context: PropertyContext,
  cardMap: Record<string, { title: string }>
) {
  const visiblePropertyIds: string[] = viewToExport.fields.visiblePropertyIds;

  const allCardProperties = board.fields.cardProperties as IPropertyTemplate[];

  const cardProperties =
    !visiblePropertyIds || visiblePropertyIds.length === 0
      ? allCardProperties
      : allCardProperties.filter((template: IPropertyTemplate) => visiblePropertyIds.includes(template.id));

  const filterGroup = viewToExport.fields.filter || { filters: [] };

  const filteredCards = CardFilter.applyFilterGroup(filterGroup, allCardProperties, cards) || [];

  if (
    viewToExport.fields.viewType === 'calendar' &&
    viewToExport.fields.dateDisplayPropertyId &&
    !viewToExport.fields.visiblePropertyIds.includes(viewToExport.fields.dateDisplayPropertyId)
  ) {
    const dateDisplay = board.fields.cardProperties.find(
      (template: IPropertyTemplate) => viewToExport.fields.dateDisplayPropertyId === template.id
    );
    if (dateDisplay) {
      cardProperties.push(dateDisplay);
    }
  }

  const visibleProperties = [...cardProperties];
  const titleProperty = cardProperties.find((prop) => prop.id === Constants.titleColumnId);

  // Header row
  const headers = visibleProperties.map((prop: IPropertyTemplate) => prop.name);

  // In case we don't have a title prop we creata it on the fly
  if (!titleProperty) {
    headers.unshift('Title');
    visibleProperties.unshift({
      id: Constants.titleColumnId,
      name: 'Title',
      type: 'text',
      options: [],
      readOnly: true,
      readOnlyValues: true
    });
  }

  const csvData: Record<string, string>[] = [];

  for (const card of filteredCards) {
    const csvCard = getCSVContent({
      card,
      context,
      formatters,
      visibleProperties,
      cardMap
    });

    csvData.push(csvCard);
  }

  const csvContent = stringify(csvData, {
    delimiter: '\t',
    header: true,
    columns: headers
  });

  const rowIds = filteredCards.map(({ id }) => id);

  return { csvContent, rowIds };
}

function getCSVContent({
  card,
  context,
  formatters,
  visibleProperties,
  cardMap
}: {
  cardMap: Record<string, { title: string }>;
  card: Card;
  context: PropertyContext;
  formatters: Formatters;
  visibleProperties: IPropertyTemplate<PropertyType>[];
}) {
  const csvCard = visibleProperties.reduce<Record<string, string>>((acc, propertyTemplate) => {
    const propertyValue = card.fields.properties[propertyTemplate.id];
    const displayValue =
      OctoUtils.propertyDisplayValue({
        block: card,
        context,
        propertyValue,
        propertyTemplate,
        formatters,
        cardMap
      }) || '';
    if (propertyTemplate.id === Constants.titleColumnId) {
      acc[propertyTemplate.name] = card.title;
    } else if (
      propertyTemplate.type === 'number' ||
      propertyTemplate.type === 'proposalEvaluationAverage' ||
      propertyTemplate.type === 'proposalEvaluationReviewerAverage' ||
      propertyTemplate.type === 'proposalEvaluationTotal' ||
      propertyTemplate.type === 'proposalRubricCriteriaTotal' ||
      propertyTemplate.type === 'proposalRubricCriteriaAverage'
    ) {
      const numericValue = propertyValue ? Number(propertyValue).toString() : '';
      acc[propertyTemplate.name] = numericValue;
    } else if (
      propertyTemplate.type === 'multiSelect' ||
      propertyTemplate.type === 'person' ||
      propertyTemplate.type === 'proposalEvaluatedBy' ||
      propertyTemplate.type === 'proposalAuthor' ||
      propertyTemplate.type === 'proposalReviewer' ||
      propertyTemplate.type === 'relation'
    ) {
      const multiSelectValue = (((displayValue as unknown) || []) as string[]).join(',');
      acc[propertyTemplate.name] = multiSelectValue;
    } else if (propertyTemplate.type === 'proposalUrl') {
      // proposalUrl is an array on the Rewards database of [title, url], and only a string on database-as-a-source
      acc[propertyTemplate.name] = `${baseUrl}${
        Array.isArray(displayValue) ? displayValue[0] : displayValue.toString()
      }`;
    } else {
      // Export as string
      acc[propertyTemplate.name] = displayValue.toString();
    }

    return acc;
  }, {});

  return csvCard;
}
