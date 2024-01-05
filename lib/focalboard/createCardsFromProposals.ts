import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Block, Page, ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { prismaToBlock } from 'lib/focalboard/block';
import { canAccessPrivateFields } from 'lib/proposal/form/canAccessPrivateFields';
import { getCurrentStep } from 'lib/proposal/getCurrentStep';
import { getProposalEvaluationStatus } from 'lib/proposal/getProposalEvaluationStatus';
import type { ProposalFields } from 'lib/proposal/interface';
import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from 'lib/proposal/rubric/interfaces';
import type { BoardPropertyValue } from 'lib/public-api';
import { relay } from 'lib/websockets/relay';

import { createCardPage } from '../pages/createCardPage';

import type { BoardFields } from './board';
import type { BoardViewFields } from './boardView';
import { extractDatabaseProposalProperties } from './extractDatabaseProposalProperties';
import { generateResyncedProposalEvaluationForCard } from './generateResyncedProposalEvaluationForCard';
import { setDatabaseProposalProperties } from './setDatabaseProposalProperties';
import { updateCardFormFieldPropertiesValue } from './updateCardFormFieldPropertiesValue';

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
          evaluationType: true,
          id: true,
          spaceId: true,
          authors: true,
          formId: true,
          status: true,
          evaluations: {
            select: {
              title: true,
              index: true,
              result: true,
              type: true
            }
          },
          rewards: {
            select: {
              id: true
            }
          },
          fields: true,
          createdBy: true,
          form: {
            select: {
              formFields: {
                select: {
                  id: true,
                  type: true,
                  private: true,
                  answers: {
                    select: {
                      proposalId: true,
                      value: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const boardBlock = await setDatabaseProposalProperties({
    boardId
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

  const proposalProps = extractDatabaseProposalProperties({ boardBlock });

  const proposalEvaluationTypeProperty = boardBlock.fields.cardProperties.find(
    (cardProperty) => cardProperty.type === 'proposalEvaluationType'
  );

  const updatedViewBlocks = await prisma.$transaction(
    views.map((block) => {
      return prisma.block.update({
        where: { id: block.id },
        data: {
          fields: {
            ...(block.fields as BoardViewFields),
            // Hide the proposal evaluation type property from the view
            visiblePropertyIds: [
              ...new Set([
                ...(block.fields as BoardViewFields).visiblePropertyIds,
                ...(boardBlock.fields as any as BoardFields).cardProperties.map((p) => p.id)
              ])
            ].filter((id) => id !== proposalEvaluationTypeProperty?.id),
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
      payload: updatedViewBlocks.map(prismaToBlock).concat(prismaToBlock(boardBlock as any))
    },
    spaceId
  );

  const cards: { page: Page; block: Block }[] = [];

  const databaseProposalProps = extractDatabaseProposalProperties({
    boardBlock
  });

  for (const pageProposal of pageProposals) {
    const createdAt = pageProposal.createdAt;

    let properties: Record<string, BoardPropertyValue> = {};

    if (proposalProps.proposalUrl) {
      properties[proposalProps.proposalUrl.id] = pageProposal.path;
    }
    const currentStep = pageProposal.proposal
      ? getCurrentStep({
          evaluations: pageProposal.proposal.evaluations,
          hasPendingRewards: ((pageProposal.proposal.fields as ProposalFields)?.pendingRewards ?? []).length > 0,
          proposalStatus: pageProposal.proposal.status,
          hasPublishedRewards: pageProposal.proposal.rewards.length > 0
        })
      : null;

    if (currentStep && proposalProps.proposalStatus) {
      properties[proposalProps.proposalStatus.id] = currentStep.result ?? 'in_progress';
    }

    if (currentStep && proposalProps.proposalEvaluationType) {
      properties[proposalProps.proposalEvaluationType.id] = currentStep.step;
    }

    if (currentStep && proposalProps.proposalStep) {
      properties[proposalProps.proposalStep.id] = currentStep.title;
    }

    const formFields = pageProposal.proposal?.form?.formFields ?? [];
    const boardBlockCardProperties = boardBlock.fields.cardProperties ?? [];

    const accessPrivateFields = await canAccessPrivateFields({
      userId,
      proposal: pageProposal.proposal ?? undefined,
      proposalId: pageProposal.proposal!.id
    });

    const formFieldProperties = await updateCardFormFieldPropertiesValue({
      accessPrivateFields,
      cardProperties: boardBlockCardProperties,
      formFields,
      proposalId: pageProposal.proposal!.id
    });

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
      properties: {
        ...properties,
        ...formFieldProperties
      },
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
