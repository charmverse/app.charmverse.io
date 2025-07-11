import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';
import { InvalidInputError } from '@packages/core/errors';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { formatDate, formatDateTime } from '@packages/lib/utils/dates';
import { isTruthy } from '@packages/utils/types';
import { stringify } from 'csv-stringify/sync';
import { sortBy } from 'lodash-es';

import type { Board, IPropertyTemplate, PropertyType } from './board';
import type { BoardView } from './boardView';
import type { Card } from './card';
import { CardFilter } from './cardFilter';
import { Constants } from './constants';
import type { FilterGroup } from './filterGroup';
import { getRelatedBlocks } from './getRelatedBlocks';
import { OctoUtils } from './octoUtils';
import type { Formatters, PropertyContext } from './octoUtils';
import { getBlocks as getBlocksForProposalSource } from './proposalsSource/getBlocks';
import { Utils } from './utils';
import { blockToFBBlock } from './utils/blockUtils';

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
