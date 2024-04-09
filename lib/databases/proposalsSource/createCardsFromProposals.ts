import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Block, Page, ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { prismaToBlock, prismaToUIBlock } from 'lib/databases/block';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposals/blocks/constants';
import { getCurrentStep } from 'lib/proposals/getCurrentStep';
import type { ProposalFields } from 'lib/proposals/interfaces';
import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  RubricCriteriaTyped
} from 'lib/proposals/rubric/interfaces';
import { relay } from 'lib/websockets/relay';

import { createCardPage } from '../../pages/createCardPage';
import type { Board, BoardFields } from '../board';
import { proposalPropertyTypesList } from '../board';
import type { BoardViewFields } from '../boardView';
import type { CardPropertyValue } from '../card';

import { extractDatabaseProposalProperties } from './extractDatabaseProposalProperties';
import { generateResyncedProposalEvaluationForCard } from './generateResyncedProposalEvaluationForCard';
import { getCardPropertiesFromAnswers } from './getCardPropertiesFromAnswers';
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

  const rootPagePermissions = await prisma.page.findFirstOrThrow({
    where: {
      id: boardId
    },
    select: {
      permissions: true
    }
  });

  const proposalBoardBlock = (await prisma.proposalBlock.findUnique({
    where: {
      id_spaceId: {
        id: DEFAULT_BOARD_BLOCK_ID,
        spaceId
      }
    },
    select: {
      fields: true
    }
  })) as null | { fields: BoardFields };

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
    select: {
      id: true,
      path: true,
      title: true,
      content: true,
      contentText: true,
      hasContent: true,
      createdAt: true,
      spaceId: true,
      proposal: {
        select: {
          id: true,
          spaceId: true,
          authors: true,
          formId: true,
          status: true,
          evaluations: {
            select: {
              id: true,
              title: true,
              index: true,
              result: true,
              type: true
            },
            orderBy: {
              index: 'asc'
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
                },
                orderBy: {
                  index: 'asc'
                }
              }
            }
          }
        }
      }
    }
  });

  const [dbBlock, boardPage] = await Promise.all([
    setDatabaseProposalProperties({
      boardId,
      cardProperties: proposalBoardBlock?.fields.cardProperties ?? []
    }),
    prisma.page.findFirstOrThrow({
      where: {
        boardId
      }
    })
  ]);
  const boardBlock = prismaToUIBlock(dbBlock, boardPage) as Board;

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

  const cards: { page: Page; block: Block }[] = [];

  for (const pageProposal of pageProposals) {
    const createdAt = pageProposal.createdAt;

    let properties: Record<string, CardPropertyValue> = {};

    if (proposalProps.proposalUrl) {
      properties[proposalProps.proposalUrl.id] = pageProposal.path;
    }

    boardBlock.fields.cardProperties.forEach((cardProperty) => {
      if (!proposalPropertyTypesList.includes(cardProperty.type as any)) {
        const proposalFieldValue = (pageProposal.proposal?.fields as ProposalFields)?.properties?.[cardProperty.id];
        if (proposalFieldValue) {
          properties[cardProperty.id] = proposalFieldValue as CardPropertyValue;
        }
      }
    });

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

    if (proposalProps.proposalAuthor && pageProposal.proposal) {
      properties[proposalProps.proposalAuthor.id] = pageProposal.proposal.authors.map((author) => author.userId);
    }

    const formFields = pageProposal.proposal?.form?.formFields ?? [];
    const boardBlockCardProperties = boardBlock.fields.cardProperties ?? [];

    const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: pageProposal.proposal!.id,
      userId
    });
    const accessPrivateFields = permissions.view_private_fields;
    const formFieldProperties = getCardPropertiesFromAnswers({
      accessPrivateFields,
      cardProperties: boardBlockCardProperties,
      formFields,
      proposalId: pageProposal.proposal!.id
    });

    pageProposal.proposal?.evaluations.forEach((evaluation) => {
      if (evaluation.type === 'rubric') {
        properties = generateResyncedProposalEvaluationForCard({
          step: evaluation,
          templates: boardBlock.fields.cardProperties,
          properties,
          rubricAnswers:
            (mappedRubricAnswersByProposal[
              pageProposal.proposal!.id
            ] as ProposalRubricCriteriaAnswerWithTypedResponse[]) ?? [],
          rubricCriteria: (mappedRubricCriteriaByProposal[pageProposal.proposal!.id] as RubricCriteriaTyped[]) ?? []
        });
      }
    });

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
      syncWithPageId: pageProposal.id,
      permissions: rootPagePermissions.permissions.map((permission) => ({
        permissionLevel: permission.permissionLevel,
        allowDiscovery: permission.allowDiscovery,
        inheritedFromPermission: permission.id,
        public: permission.public,
        roleId: permission.roleId,
        spaceId: permission.spaceId,
        userId: permission.userId
      }))
    });
    cards.push(_card);
  }

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: updatedViewBlocks.map(prismaToBlock).concat(boardBlock)
    },
    spaceId
  );

  if (cards.length > 0) {
    relay.broadcast(
      {
        type: 'blocks_created',
        payload: cards.map((card) => prismaToUIBlock(card.block, card.page))
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
