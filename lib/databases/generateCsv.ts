import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import { sortBy } from 'lodash';

import type { Formatters, PropertyContext } from 'components/common/DatabaseEditor/octoUtils';
import { OctoUtils } from 'components/common/DatabaseEditor/octoUtils';
import { Utils } from 'components/common/DatabaseEditor/utils';
import { blockToFBBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import { baseUrl } from 'config/constants';
import { CardFilter } from 'lib/databases/cardFilter';
import type { FilterGroup } from 'lib/databases/filterGroup';
import { getRelatedBlocks } from 'lib/databases/getRelatedBlocks';
import { getBlocks as getBlocksForProposalSource } from 'lib/databases/proposalsSource/getBlocks';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { formatDate, formatDateTime } from 'lib/utils/dates';
import { isTruthy } from 'lib/utils/types';

import type { Board, IPropertyTemplate, PropertyType } from './board';
import type { BoardView } from './boardView';
import type { Card } from './card';
import { Constants } from './constants';

export const csvColumnSeparator = ',';
export const csvCellEnclosure = '"';
export const csvNewLine = '\r\n';

export async function loadAndGenerateCsv({
  databaseId,
  userId,
  customFilter,
  viewId
}: {
  viewId?: string;
  databaseId: string;
  userId: string;
  customFilter?: FilterGroup | null;
}): Promise<{ csvData: string; childPageIds: string[] }> {
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

  const [space, spaceMembers] = await Promise.all([
    prisma.space.findUniqueOrThrow({
      where: {
        id: boardBlock.spaceId
      },
      select: {
        domain: true
      }
    }),
    prisma.user
      .findMany({
        where: {
          spaceRoles: {
            some: {
              spaceId: boardBlock.spaceId
            }
          }
        },
        select: {
          id: true,
          username: true
        }
      })
      .then((users) =>
        users.reduce<Record<string, { username: string }>>((acc, user) => {
          acc[user.id] = {
            username: user.username
          };
          return acc;
        }, {})
      )
  ]);

  // geenrate card map for relation properties
  const cardMap = blocks.reduce<Record<string, { title: string }>>((acc, block) => {
    if (block.type === 'card') {
      acc[block.id] = { title: block.title || '' };
    }
    return acc;
  }, {});

  const csvData = generateCSV(
    boardBlock,
    viewBlock,
    cardBlocks,
    {
      date: formatDate,
      dateTime: formatDateTime
    },
    {
      users: spaceMembers,
      spaceDomain: space.domain
    },
    cardMap
  );

  return {
    csvData: csvData.csvContent,
    childPageIds: csvData.rowIds
  };
}

function generateCSV(
  board: Pick<Board, 'fields'>,
  view: BoardView,
  cards: Card[],
  formatters: Formatters,
  context: PropertyContext,
  cardMap: Record<string, { title: string }>
) {
  const { rows, rowIds } = generateTableArray(board, cards, view, formatters, context, cardMap);
  let csvContent = '';

  rows.forEach((row) => {
    const encodedRow = row.join(csvColumnSeparator);
    csvContent += `${encodedRow}${csvNewLine}`;
  });

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

function encodeText(text: string): string {
  return text.replace(/"/g, '""');
}

function generateTableArray(
  board: Pick<Board, 'fields'>,
  cards: Card[],
  viewToExport: BoardView,
  formatters: Formatters,
  context: PropertyContext,
  cardMap: Record<string, { title: string }>
): { rows: string[][]; rowIds: string[] } {
  const rows: string[][] = [];
  const visiblePropertyIds: string[] = arrayUtils.uniqueValues([
    ...viewToExport.fields.visiblePropertyIds,
    '8a21b99e-4aed-4746-b680-b8bf3ab51e2e'
  ]);
  const cardProperties =
    !visiblePropertyIds || visiblePropertyIds.length === 0
      ? (board.fields.cardProperties as IPropertyTemplate[])
      : board.fields.cardProperties.filter((template: IPropertyTemplate) => visiblePropertyIds.includes(template.id));

  const filterGroup = viewToExport.fields.filter || { filters: [] };
  const filteredCards = CardFilter.applyFilterGroup(filterGroup, cardProperties, cards) || [];

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

  const titleProperty = cardProperties.find((prop) => prop.id === Constants.titleColumnId);
  // Header row
  const row: string[] = titleProperty ? [] : ['Title'];
  cardProperties.forEach((template: IPropertyTemplate) => {
    row.push(template.name);
  });
  rows.push(row);

  filteredCards.forEach((card) => {
    const rowColumns = getCSVColumns({
      card,
      context,
      formatters,
      hasTitleProperty: !!titleProperty,
      visibleProperties: cardProperties,
      cardMap
    });
    rows.push(rowColumns);
  });

  return { rows, rowIds: filteredCards.map(({ id }) => id) };
}

function getCSVColumns({
  card,
  context,
  formatters,
  hasTitleProperty,
  visibleProperties,
  cardMap
}: {
  cardMap: Record<string, { title: string }>;
  card: Card;
  context: PropertyContext;
  formatters: Formatters;
  hasTitleProperty: boolean;
  visibleProperties: IPropertyTemplate<PropertyType>[];
}) {
  const columns: string[] = [];
  if (!hasTitleProperty) {
    columns.push(`${csvCellEnclosure}${encodeText(card.title)}${csvCellEnclosure}`);
  }
  visibleProperties.forEach((propertyTemplate: IPropertyTemplate) => {
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
      columns.push(`"${encodeText(card.title)}"`);
    } else if (
      propertyTemplate.type === 'number' ||
      propertyTemplate.type === 'proposalEvaluationAverage' ||
      propertyTemplate.type === 'proposalEvaluationTotal'
    ) {
      const numericValue = propertyValue ? Number(propertyValue).toString() : '';
      columns.push(numericValue);
    } else if (
      propertyTemplate.type === 'multiSelect' ||
      propertyTemplate.type === 'person' ||
      propertyTemplate.type === 'proposalEvaluatedBy' ||
      propertyTemplate.type === 'proposalAuthor' ||
      propertyTemplate.type === 'proposalReviewer' ||
      propertyTemplate.type === 'relation'
    ) {
      const multiSelectValue = (((displayValue as unknown) || []) as string[]).join('|');
      columns.push(multiSelectValue);
    } else if (propertyTemplate.type === 'proposalUrl') {
      // proposalUrl is an array on the Rewards database of [title, url], and only a string on database-as-a-source
      columns.push(`${baseUrl}${encodeText(Array.isArray(displayValue) ? displayValue[0] : displayValue.toString())}`);
    } else {
      // Export as string
      columns.push(`${csvCellEnclosure}${encodeText(displayValue as string)}${csvCellEnclosure}`);
    }
  });
  return columns;
}
