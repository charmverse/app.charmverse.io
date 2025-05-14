import { prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { CardFilter } from '@packages/databases/cardFilter';
import { Constants } from '@packages/databases/constants';
import { PROPOSAL_STEP_LABELS } from '@packages/databases/proposalDbProperties';
import { sortCards } from '@packages/databases/store/cards';
import { blockToFBBlock } from '@packages/databases/utils/blockUtils';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { CREATED_AT_ID, PROPOSAL_EVALUATION_TYPE_ID } from '@packages/lib/proposals/blocks/constants';
import type { ProposalBoardBlock } from '@packages/lib/proposals/blocks/interfaces';
import { getProposals } from '@packages/lib/proposals/getProposals';
import { formatDate, formatDateTime } from '@packages/lib/utils/dates';
import { stringify } from 'csv-stringify/sync';

import { OctoUtils } from 'components/common/DatabaseEditor/octoUtils';
import { getDefaultBoard, getDefaultTableView } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { mapProposalToCard } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';

export async function exportProposals({ spaceId, userId }: { spaceId: string; userId: string }) {
  const space = await prisma.space.findUniqueOrThrow({ where: { id: spaceId }, select: { domain: true } });

  const [proposalViewBlock, proposalBoardBlock] = await Promise.all([
    prisma.proposalBlock.findUnique({
      where: {
        id_spaceId: {
          id: '__defaultView',
          spaceId
        }
      }
    }),
    prisma.proposalBlock.findFirst({
      where: {
        spaceId,
        type: '__defaultBoard'
      }
    })
  ]);

  const ids = await permissionsApiClient.proposals.getAccessibleProposalIds({
    userId,
    spaceId
  });

  const [proposals, spaceMembers] = await Promise.all([
    getProposals({ ids, spaceId, userId }),
    prisma.user.findMany({
      where: {
        spaceRoles: {
          some: {
            spaceId
          }
        }
      },
      select: {
        id: true,
        username: true
      }
    })
  ]);

  const membersRecord = spaceMembers.reduce<Record<string, { username: string }>>((acc, user) => {
    acc[user.id] = { username: user.username };
    return acc;
  }, {});

  const evaluationStepTitles = new Set<string>();
  proposals.forEach((p) => {
    p.evaluations.forEach((e) => {
      evaluationStepTitles.add(e.title);
    });
  });

  const board = getDefaultBoard({
    storedBoard: proposalBoardBlock as ProposalBoardBlock,
    evaluationStepTitles: Array.from(evaluationStepTitles)
  });

  let viewBlock = proposalViewBlock ? (blockToFBBlock(proposalViewBlock as ProposalBoardBlock) as BoardView) : null;

  if (!viewBlock) {
    viewBlock = getDefaultTableView({ board });
    viewBlock.fields.sortOptions = [{ propertyId: CREATED_AT_ID, reversed: true }];
  }

  let cards = proposals.map((p) => mapProposalToCard({ proposal: p, spaceId }));

  if (viewBlock.fields.filter) {
    const filteredCardsIds = CardFilter.applyFilterGroup(
      viewBlock.fields.filter,
      [
        ...board.fields.cardProperties,
        {
          id: PROPOSAL_EVALUATION_TYPE_ID,
          name: 'Evaluation Type',
          options: objectUtils.typedKeys(PROPOSAL_STEP_LABELS).map((evaluationType) => ({
            color: 'propColorGray',
            id: evaluationType,
            value: evaluationType
          })),
          type: 'proposalEvaluationType'
        }
      ],
      cards as Card[]
    ).map((c) => c.id);

    cards = cards.filter((cp) => filteredCardsIds.includes(cp.id));
  }

  const cardTitles: Record<string, { title: string }> = cards.reduce<Record<string, { title: string }>>((acc, c) => {
    acc[c.id] = { title: c.title };
    return acc;
  }, {});

  if (viewBlock.fields.sortOptions?.length) {
    cards = sortCards(cards as Card[], board, viewBlock, membersRecord, cardTitles);
  }

  const visibleProperties = board.fields.cardProperties.filter(
    (prop) => !viewBlock.fields.visiblePropertyIds || viewBlock.fields.visiblePropertyIds.includes(prop.id)
  );

  const titleProperty = visibleProperties.find((prop) => prop.id === Constants.titleColumnId);
  if (!titleProperty) {
    visibleProperties.unshift({
      id: Constants.titleColumnId,
      name: 'Title',
      type: 'text',
      options: [],
      readOnly: true
    });
  }

  const csvData = cards.map((card) => {
    return visibleProperties.reduce<Record<string, string>>((acc, prop) => {
      const value = prop.id === Constants.titleColumnId ? card.title : card.fields.properties[prop.id];
      const displayValue = OctoUtils.propertyDisplayValue({
        block: card,
        propertyValue: value as string,
        propertyTemplate: prop,
        formatters: {
          date: formatDate,
          dateTime: formatDateTime
        },
        context: {
          spaceDomain: space.domain,
          users: membersRecord
        }
      });

      acc[prop.name] = Array.isArray(displayValue) ? displayValue.join(', ') : String(displayValue || '');
      return acc;
    }, {});
  });

  const csvContent = stringify(csvData, {
    header: true,
    delimiter: '\t'
  });

  return csvContent;
}
