import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Block, Page, ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { prismaToBlock } from 'lib/focalboard/block';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type {
  ProposalRubricCriteriaWithTypedParams,
  ProposalRubricCriteriaAnswerWithTypedResponse
} from 'lib/proposal/rubric/interfaces';
import type { BoardPropertyValue } from 'lib/public-api';
import { relay } from 'lib/websockets/relay';

import { createCardPage } from '../pages/createCardPage';

import { extractDatabaseProposalProperties } from './extractDatabaseProposalProperties';
import { generateResyncedProposalEvaluationForCard } from './generateResyncedProposalEvaluationForCard';
import { setDatabaseProposalProperties } from './setDatabaseProposalProperties';

export async function createCardsFromProposals({
  boardId,
  spaceId,
  userId
}: {
  boardId: string;
  spaceId: string;
  userId: string;
}) {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError('Invalid spaceId');
  } else if (!stringUtils.isUUID(boardId)) {
    throw new InvalidInputError('Invalid boardId');
  }
  await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      id: true
    }
  });

  const pageProposals = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        archived: {
          not: true
        },
        status: {
          not: 'draft'
        }
      },
      deletedAt: null
    },
    include: {
      proposal: {
        select: {
          categoryId: true,
          status: true,
          evaluationType: true
        }
      },
      workspaceEvents: true
    }
  });

  const database = await setDatabaseProposalProperties({
    databaseId: boardId
  });

  const views = await prisma.block.findMany({
    where: {
      type: 'view',
      parentId: boardId
    }
  });

  const mappedPageIds = pageProposals.map((p) => p.id);

  const [rubricCriteria, rubricAnswers] = await Promise.all([
    prisma.proposalRubricCriteria.findMany({
      where: {
        proposalId: {
          in: mappedPageIds
        }
      }
    }),
    prisma.proposalRubricCriteriaAnswer.findMany({
      where: {
        proposalId: {
          in: mappedPageIds
        }
      }
    })
  ]);

  const mappedRubricCriteriaByProposal = rubricCriteria.reduce((acc, val) => {
    if (!acc[val.proposalId]) {
      acc[val.proposalId] = [];
    }

    acc[val.proposalId].push(val);
    return acc;
  }, {} as Record<string, ProposalRubricCriteria[]>);

  const mappedRubricAnswersByProposal = rubricAnswers.reduce((acc, val) => {
    if (!acc[val.proposalId]) {
      acc[val.proposalId] = [];
    }

    acc[val.proposalId].push(val);
    return acc;
  }, {} as Record<string, ProposalRubricCriteriaAnswer[]>);

  const proposalProps = extractDatabaseProposalProperties({ database });

  const updatedViewBlocks = await prisma.$transaction(
    views.map((block) => {
      return prisma.block.update({
        where: { id: block.id },
        data: {
          fields: {
            ...(block.fields as any),
            visiblePropertyIds: [
              ...new Set([
                ...(block.fields as any).visiblePropertyIds,
                ...(database.fields as any).cardProperties.map((p: IPropertyTemplate) => p.id)
              ])
            ],
            sourceType: 'proposals'
          },
          updatedAt: new Date(),
          updatedBy: userId
        }
      });
    })
  );

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: updatedViewBlocks.map(prismaToBlock).concat(prismaToBlock(database))
    },
    spaceId
  );

  const cards: { page: Page; block: Block }[] = [];

  const databaseProposalProps = extractDatabaseProposalProperties({
    database
  });

  for (const pageProposal of pageProposals) {
    const createdAt = pageProposal.workspaceEvents.find(
      (event) => event.type === 'proposal_status_change' && (event.meta as any).newStatus === 'discussion'
    )?.createdAt;

    let properties: Record<string, BoardPropertyValue> = {};

    if (proposalProps.proposalCategory) {
      properties[proposalProps.proposalCategory.id] = pageProposal.proposal?.categoryId ?? '';
    }

    if (proposalProps.proposalUrl) {
      properties[proposalProps.proposalUrl.id] = pageProposal.path;
    }

    if (proposalProps.proposalStatus) {
      properties[proposalProps.proposalStatus.id] =
        proposalProps.proposalStatus.options.find((opt) => opt.value === pageProposal.proposal?.status)?.id ?? '';
    }

    if (pageProposal?.proposal?.evaluationType === 'rubric') {
      const criteria = mappedRubricCriteriaByProposal[pageProposal.id] ?? [];
      const answers = mappedRubricAnswersByProposal[pageProposal.id] ?? [];

      const updatedCardShape = generateResyncedProposalEvaluationForCard({
        proposalEvaluationType: pageProposal.proposal.evaluationType,
        cardProps: { fields: properties },
        databaseProperties: databaseProposalProps,
        rubricCriteria: criteria as ProposalRubricCriteriaWithTypedParams[],
        rubricAnswers: answers as ProposalRubricCriteriaAnswerWithTypedResponse[]
      });

      properties = updatedCardShape.fields;
    }

    const _card = await createCardPage({
      title: pageProposal.title,
      boardId,
      spaceId: pageProposal.spaceId,
      createdAt,
      createdBy: userId,
      properties: properties as any,
      hasContent: pageProposal.hasContent,
      content: pageProposal.content,
      contentText: pageProposal.contentText,
      syncWithPageId: pageProposal.id
    });
    cards.push(_card);
  }

  if (cards.length > 0) {
    relay.broadcast(
      {
        type: 'blocks_created',
        payload: cards.map((card) => prismaToBlock(card.block))
      },
      spaceId
    );
    relay.broadcast(
      {
        type: 'pages_created',
        payload: cards.map((card) => card.page)
      },
      spaceId
    );
  }

  log.debug('Created cards from new Proposals', {
    boardId,
    createdCardPagesCount: pageProposals.length
  });

  return cards.map((card) => card.page);
}
