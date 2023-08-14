import type { Block, Page, ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { prismaToBlock } from 'lib/focalboard/block';
import { extractCardProposalProperties } from 'lib/focalboard/extractCardProposalProperties';
import { extractDatabaseProposalProperties } from 'lib/focalboard/extractDatabaseProposalProperties';
import { InvalidStateError } from 'lib/middleware';
import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';
import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from 'lib/proposal/rubric/interfaces';
import type { BoardPropertyValue } from 'lib/public-api';
import { relay } from 'lib/websockets/relay';

import { createCardPage } from '../pages/createCardPage';

import type { Card } from './card';
import { generateResyncedProposalEvaluationForCard } from './generateResyncedProposalEvaluationForCard';
import { setDatabaseProposalProperties } from './setDatabaseProposalProperties';

export async function updateCardsFromProposals({
  boardId,
  spaceId,
  userId
}: {
  boardId: string;
  spaceId: string;
  userId: string;
}) {
  if (boardId && spaceId) {
    await prisma.block.findFirstOrThrow({
      where: {
        id: boardId,
        spaceId
      }
    });
  }

  const database = await setDatabaseProposalProperties({
    databaseId: boardId
  });
  // Ideally all the views should have sourceType proposal when created, but there are views which doesn't have sourceType proposal even though they are created from proposal source
  if (database.fields.sourceType !== 'proposals') {
    throw new InvalidStateError('Board does not have a proposals view');
  }

  const pageProposals = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        status: {
          not: 'draft'
        }
      }
    },
    include: {
      proposal: {
        select: {
          evaluationType: true,
          status: true,
          categoryId: true,
          archived: true
        }
      },
      workspaceEvents: true
    }
  });

  const existingCards = await prisma.page.findMany({
    where: {
      type: 'card',
      parentId: boardId,
      spaceId,
      syncWithPageId: {
        not: null
      }
    }
  });

  const existingCardBlocks = await prisma.block
    .findMany({
      where: {
        id: {
          in: existingCards.map((c) => c.id)
        }
      }
    })
    .then((data) =>
      data.reduce((acc, val) => {
        acc[val.id] = val;
        return acc;
      }, {} as Record<string, Block>)
    );

  // Synced pages with a key referencing the proposal they belong to
  const existingSyncedCardsWithBlocks = existingCards
    .filter((card) => !!card.syncWithPageId)
    .reduce((acc, card) => {
      const cardPage = card;
      if (existingCardBlocks[cardPage.id]) {
        (card as Page & { block: Block }).block = existingCardBlocks[card.id];
        acc[cardPage.syncWithPageId as string] = card as Page & { block: Block };
      }
      return acc;
    }, {} as Record<string, Page & { block: Block }>);

  const databaseProposalProps = extractDatabaseProposalProperties({
    database
  });

  /**
   * Case for cards that are linked to a proposal page and need to be updated
   */
  const updatedCards: Page[] = [];
  const updatedBlocks: Block[] = [];
  const newCards: { page: Page; block: Block }[] = [];

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

  for (const pageWithProposal of pageProposals) {
    const card = existingSyncedCardsWithBlocks[pageWithProposal.id];

    if (card) {
      const { cardProposalCategory, cardProposalStatus, cardProposalUrl } = extractCardProposalProperties({
        card: card.block,
        databaseProperties: databaseProposalProps
      });

      const archivedStatusValueId = databaseProposalProps.proposalStatus?.options.find(
        (opt) => opt.value === 'archived'
      )?.id;
      if (
        // For now, always recalculate rubrics. We can optimise further later
        pageWithProposal.proposal?.evaluationType === 'rubric' ||
        card.title !== pageWithProposal.title ||
        card.hasContent !== pageWithProposal.hasContent ||
        card.content?.toString() !== pageWithProposal.content?.toString() ||
        card.contentText !== pageWithProposal.contentText ||
        card.deletedAt !== pageWithProposal.deletedAt ||
        cardProposalCategory?.optionId !== pageWithProposal.proposal?.categoryId ||
        cardProposalUrl?.value !== pageWithProposal.path ||
        (pageWithProposal.proposal?.archived && cardProposalStatus?.value !== 'archived') ||
        (!pageWithProposal.proposal?.archived && cardProposalStatus?.optionId === 'archived') ||
        (!pageWithProposal.proposal?.archived &&
          cardProposalStatus?.optionId !==
            databaseProposalProps.proposalStatus?.options.find((opt) => opt.value === pageWithProposal.proposal?.status)
              ?.id)
      ) {
        const newProps = {
          ...(card.block.fields as any).properties,
          [cardProposalUrl?.propertyId ?? '']: pageWithProposal.path,
          [cardProposalCategory?.propertyId ?? '']: pageWithProposal.proposal?.categoryId,
          [cardProposalStatus?.propertyId ?? '']: pageWithProposal.proposal?.archived
            ? archivedStatusValueId
            : databaseProposalProps.proposalStatus?.options.find(
                (opt) => opt.value === pageWithProposal.proposal?.status
              )?.id ?? ''
        };

        let newCardBlockFields = {
          ...(card.block.fields as any),
          properties: newProps
        };

        if (pageWithProposal.proposal?.evaluationType) {
          const criteria = mappedRubricCriteriaByProposal[pageWithProposal.id] ?? [];
          const answers = mappedRubricAnswersByProposal[pageWithProposal.id] ?? [];

          const updatedCardShape = generateResyncedProposalEvaluationForCard({
            proposalEvaluationType: pageWithProposal.proposal.evaluationType,
            cardProps: { fields: newCardBlockFields },
            databaseProperties: databaseProposalProps,
            rubricCriteria: criteria as ProposalRubricCriteriaWithTypedParams[],
            rubricAnswers: answers as ProposalRubricCriteriaAnswerWithTypedResponse[]
          });

          newCardBlockFields = updatedCardShape.fields;
        }

        const { updatedCardPage, updatedCardBlock } = await prisma.$transaction(async (tx) => {
          const updatedPage = await tx.page.update({
            where: {
              id: card.id
            },
            data: {
              updatedAt: new Date(),
              updatedBy: userId,
              deletedAt: pageWithProposal.deletedAt,
              title: pageWithProposal.title,
              hasContent: pageWithProposal.hasContent,
              content: pageWithProposal.content || undefined,
              contentText: pageWithProposal.contentText
            }
          });

          const updatedBlock = await tx.block.update({
            where: {
              id: updatedPage.id
            },
            data: {
              fields: newCardBlockFields
            }
          });

          return { updatedCardPage: updatedPage, updatedCardBlock: updatedBlock };
        });
        updatedCards.push(updatedCardPage);
        updatedBlocks.push(updatedCardBlock);
      }

      // Don't create new cards from archived cards
    } else if (!card && !pageWithProposal.proposal?.archived) {
      let properties: Record<string, BoardPropertyValue> = {};

      if (databaseProposalProps.proposalCategory) {
        properties[databaseProposalProps.proposalCategory.id] = pageWithProposal.proposal?.categoryId ?? '';
      }

      if (databaseProposalProps.proposalUrl) {
        properties[databaseProposalProps.proposalUrl.id] = pageWithProposal.path;
      }

      if (databaseProposalProps.proposalStatus) {
        properties[databaseProposalProps.proposalStatus.id] =
          databaseProposalProps.proposalStatus.options.find((opt) => opt.value === pageWithProposal.proposal?.status)
            ?.id ?? '';
      }
      const createdAt = pageWithProposal.workspaceEvents.find(
        (event) => event.type === 'proposal_status_change' && (event.meta as any).newStatus === 'discussion'
      )?.createdAt;
      if (pageWithProposal.proposal?.evaluationType) {
        const criteria = mappedRubricCriteriaByProposal[pageWithProposal.id] ?? [];
        const answers = mappedRubricAnswersByProposal[pageWithProposal.id] ?? [];

        const updatedCardShape = generateResyncedProposalEvaluationForCard({
          proposalEvaluationType: pageWithProposal.proposal.evaluationType,
          cardProps: { fields: properties },
          databaseProperties: databaseProposalProps,
          rubricCriteria: criteria as ProposalRubricCriteriaWithTypedParams[],
          rubricAnswers: answers as ProposalRubricCriteriaAnswerWithTypedResponse[]
        });

        properties = updatedCardShape.fields;
      }

      const _card = await createCardPage({
        title: pageWithProposal.title,
        boardId,
        spaceId: pageWithProposal.spaceId,
        createdAt,
        createdBy: userId,
        properties,
        hasContent: pageWithProposal.hasContent,
        content: pageWithProposal.content,
        contentText: pageWithProposal.contentText,
        syncWithPageId: pageWithProposal.id
      });
      newCards.push(_card);
    }
  }

  if (updatedCards.length > 0) {
    relay.broadcast(
      {
        type: 'pages_meta_updated',
        payload: updatedCards.map(
          ({ id, updatedAt, updatedBy, deletedAt, title, hasContent, content, contentText }) => ({
            id,
            spaceId,
            updatedAt,
            updatedBy,
            deletedAt,
            title,
            hasContent,
            content,
            contentText
          })
        )
      },
      spaceId
    );
  }

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: [prismaToBlock(database)]
    },
    spaceId
  );

  if (updatedBlocks.length > 0) {
    relay.broadcast(
      {
        type: 'blocks_updated',
        payload: updatedBlocks.map((block) => prismaToBlock(block))
      },
      spaceId
    );
  }

  if (newCards.length > 0) {
    relay.broadcast(
      {
        type: 'blocks_created',
        payload: newCards.map((card) => prismaToBlock(card.block))
      },
      spaceId
    );
    relay.broadcast(
      {
        type: 'pages_created',
        payload: newCards.map((card) => card.page)
      },
      spaceId
    );
  }

  const reducedPageProposals = pageProposals.reduce((acc, val) => {
    acc[val.id] = val.id;
    return acc;
  }, {} as Record<string, string>);

  const nonExistingProposalPagesIds = existingCards
    .filter((card) => card.syncWithPageId && !reducedPageProposals[card.syncWithPageId])
    .map((card) => card.id);

  /**
   * Case where a user permanently deleted a proposal page
   */
  if (nonExistingProposalPagesIds.length > 0) {
    await prisma.page.deleteMany({
      where: {
        id: {
          in: nonExistingProposalPagesIds
        }
      }
    });
  }

  if (nonExistingProposalPagesIds.length > 0) {
    relay.broadcast(
      {
        type: 'pages_deleted',
        payload: nonExistingProposalPagesIds.map((id) => ({ id }))
      },
      spaceId
    );
  }
}
