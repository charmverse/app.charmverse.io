import type { Block, Page, ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { prismaToBlock } from 'lib/focalboard/block';
import { extractCardProposalProperties } from 'lib/focalboard/extractCardProposalProperties';
import { extractDatabaseProposalProperties } from 'lib/focalboard/extractDatabaseProposalProperties';
import { InvalidStateError } from 'lib/middleware';
import { canAccessPrivateFields } from 'lib/proposal/form/canAccessPrivateFields';
import { getCurrentStep } from 'lib/proposal/getCurrentStep';
import type { ProposalFields } from 'lib/proposal/interface';
import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from 'lib/proposal/rubric/interfaces';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

import { createCardPage } from '../pages/createCardPage';

import { proposalPropertyTypesList } from './board';
import type { IPropertyTemplate, BoardFields } from './board';
import type { BoardViewFields } from './boardView';
import type { CardFields, CardPropertyValue } from './card';
import { DEFAULT_BOARD_BLOCK_ID } from './customBlocks/constants';
import { generateResyncedProposalEvaluationForCard } from './generateResyncedProposalEvaluationForCard';
import { setDatabaseProposalProperties } from './setDatabaseProposalProperties';
import { updateCardFormFieldPropertiesValue } from './updateCardFormFieldPropertiesValue';

export async function updateCardsFromProposals({
  boardId,
  spaceId,
  userId
}: {
  boardId: string;
  spaceId: string;
  userId: string;
}) {
  const board = await prisma.block.findFirstOrThrow({
    where: {
      id: boardId,
      spaceId
    }
  });

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

  const boardBlock = await setDatabaseProposalProperties({
    boardId,
    cardProperties: []
  });

  const boardBlockCardPropertiesRecord: Record<string, IPropertyTemplate> = {};

  boardBlock.fields.cardProperties.forEach((prop) => {
    boardBlockCardPropertiesRecord[prop.id] = prop;
  });

  // Get the newly added proposal properties
  const newBoardProposalCustomProperties =
    proposalBoardBlock?.fields.cardProperties.filter((prop) => !boardBlockCardPropertiesRecord[prop.id]) ?? [];

  // Looping through proposal board block properties since its the source of truth for the properties
  const proposalBoardPropertiesUpdated =
    (newBoardProposalCustomProperties.length > 0 ||
      proposalBoardBlock?.fields.cardProperties.some((cardProperty) => {
        const boardBlockCardProperty = boardBlockCardPropertiesRecord[cardProperty.id];
        // If a new property was added to the proposal board block, we need to update the board block
        if (!boardBlockCardProperty) {
          return true;
        }

        // If a property was renamed in the proposal board block, we need to update the board block
        if (boardBlockCardProperty.name !== cardProperty.name) {
          return true;
        }

        // If a property type changed in the proposal board block, we need to update the board block
        if (boardBlockCardProperty.type !== cardProperty.type) {
          return true;
        }

        // Check if the options changed
        if (JSON.stringify(boardBlockCardProperty.options) !== JSON.stringify(cardProperty.options)) {
          return true;
        }

        return false;
      })) ??
    false;

  if (proposalBoardPropertiesUpdated) {
    // Existing custom properties that are not proposal properties
    const nonProposalCustomProperties = boardBlock.fields.cardProperties.filter((prop) => !prop.proposalFieldId);
    // Add the new proposal properties
    proposalBoardBlock?.fields.cardProperties.forEach((cardProperty) => {
      nonProposalCustomProperties.push({
        ...cardProperty,
        proposalFieldId: cardProperty.id
      });
    });

    await prisma.block.update({
      where: {
        id: boardId
      },
      data: {
        fields: {
          ...boardBlock.fields,
          cardProperties: nonProposalCustomProperties as any
        }
      }
    });
  }

  const updatedBoardBlock = await prisma.block.findFirstOrThrow({
    where: {
      id: boardId,
      spaceId
    },
    select: {
      fields: true
    }
  });

  const boardFieldsProperties = (board.fields as unknown as BoardFields)?.cardProperties ?? [];
  const newBoardProposalEvaluationPropertyIds = (
    ((updatedBoardBlock.fields as unknown as BoardFields)?.cardProperties ?? []).filter((property) => {
      return (
        (property.type === 'proposalEvaluatedBy' ||
          property.type === 'proposalEvaluationAverage' ||
          property.type === 'proposalEvaluationTotal') &&
        !boardFieldsProperties.find((boardProperty) => boardProperty.id === property.id)
      );
    }) ?? []
  ).map((property) => property.id);

  const newlyAddedProposalProperties = [
    ...newBoardProposalEvaluationPropertyIds,
    ...newBoardProposalCustomProperties.map((p) => p.id)
  ];

  // Add the newly added proposal properties to all the view blocks visiblePropertyIds
  if (newlyAddedProposalProperties.length) {
    const views = await prisma.block.findMany({
      select: {
        fields: true,
        id: true
      },
      where: {
        type: 'view',
        parentId: boardId
      }
    });
    await prisma.$transaction(
      views.map((block) => {
        return prisma.block.update({
          where: { id: block.id },
          data: {
            fields: {
              ...(block.fields as BoardViewFields),
              // Hide the proposal evaluation type property from the view
              visiblePropertyIds: [
                ...new Set([...(block.fields as BoardViewFields).visiblePropertyIds, ...newlyAddedProposalProperties])
              ]
            },
            updatedAt: new Date(),
            updatedBy: userId
          }
        });
      })
    );
  }

  const boardBlockCardProperties = (updatedBoardBlock.fields as unknown as BoardFields)?.cardProperties ?? [];

  // Ideally all the views should have sourceType proposal when created, but there are views which doesn't have sourceType proposal even though they are created from proposal source
  if ((boardBlock.fields as any as BoardFields).sourceType !== 'proposals') {
    throw new InvalidStateError('Database not configured to use proposals as a source');
  }

  const [proposalPages, existingCardPages] = await Promise.all([
    prisma.page.findMany({
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
            status: true,
            archived: true,
            createdBy: true,
            formId: true,
            authors: true,
            spaceId: true,
            id: true,
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
    }),
    prisma.page.findMany({
      where: {
        type: 'card',
        parentId: boardId,
        spaceId,
        syncWithPageId: {
          not: null
        }
      },
      include: {
        card: true
      }
    })
  ]);

  // Synced pages with a key referencing the proposal they belong to
  const existingSyncedCardsWithBlocks = existingCardPages.reduce<Record<string, Page & { block: Block }>>(
    (acc, { card, ...cardPage }) => {
      acc[cardPage.syncWithPageId as string] = {
        ...cardPage,
        block: card as Block
      };
      return acc;
    },
    {}
  );

  const databaseProposalProps = extractDatabaseProposalProperties({
    boardBlock
  });

  /**
   * Case for cards that are linked to a proposal page and need to be updated
   */
  const updatedPages: Page[] = [];
  const updatedBlocks: Block[] = [];
  const newCards: { page: Page; block: Block }[] = [];

  const proposalIds = proposalPages.map((p) => p.proposal?.id).filter(isTruthy);

  const [rubricCriteria, rubricAnswers] = await Promise.all([
    prisma.proposalRubricCriteria.findMany({
      where: {
        proposalId: {
          in: proposalIds
        }
      }
    }),
    prisma.proposalRubricCriteriaAnswer.findMany({
      where: {
        proposalId: {
          in: proposalIds
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

  for (const pageWithProposal of proposalPages) {
    const card = existingSyncedCardsWithBlocks[pageWithProposal.id];

    const accessPrivateFields = await canAccessPrivateFields({
      // Use the board creator to check if private fields are accessible
      userId: boardBlock.createdBy,
      proposal: pageWithProposal.proposal ?? undefined,
      proposalId: pageWithProposal.proposal!.id
    });

    const currentStep = pageWithProposal.proposal
      ? getCurrentStep({
          evaluations: pageWithProposal.proposal.evaluations ?? [],
          hasPendingRewards: ((pageWithProposal.proposal.fields as ProposalFields)?.pendingRewards ?? []).length > 0,
          hasPublishedRewards: pageWithProposal.proposal.rewards.length > 0,
          proposalStatus: pageWithProposal.proposal.status
        })
      : null;

    const proposalEvaluationStatus = currentStep?.result ?? 'in_progress';
    const proposalEvaluationStep = currentStep?.title ?? 'Draft';
    const proposalEvaluationType = currentStep?.step ?? 'draft';

    if (card) {
      const { cardProposalStatus, cardEvaluationType, cardProposalStep, cardProposalUrl } =
        extractCardProposalProperties({
          card: card.block,
          databaseProperties: databaseProposalProps
        });

      let hasCustomPropertyValueChanged = false;
      const cardProperties = (card.block.fields as CardFields).properties;
      boardBlockCardProperties.forEach((prop) => {
        const proposalFieldValue = (pageWithProposal.proposal?.fields as ProposalFields)?.properties?.[prop.id];
        const cardFieldValue = cardProperties[prop.id];
        if (proposalFieldValue && proposalFieldValue !== cardFieldValue) {
          hasCustomPropertyValueChanged = true;
          cardProperties[prop.id] = proposalFieldValue as CardPropertyValue;
        }
      });

      if (
        // For now, always recalculate rubrics. We can optimise further later
        currentStep?.step === 'rubric' ||
        card.title !== pageWithProposal.title ||
        card.hasContent !== pageWithProposal.hasContent ||
        card.content?.toString() !== pageWithProposal.content?.toString() ||
        card.contentText !== pageWithProposal.contentText ||
        card.deletedAt !== pageWithProposal.deletedAt ||
        cardProposalUrl?.value !== pageWithProposal.path ||
        (!pageWithProposal.proposal?.archived &&
          cardProposalStatus?.optionId !==
            databaseProposalProps.proposalStatus?.options.find((opt) => opt.value === proposalEvaluationStatus)?.id) ||
        (!pageWithProposal.proposal?.archived &&
          cardEvaluationType?.optionId !==
            databaseProposalProps.proposalEvaluationType?.options.find((opt) => opt.value === proposalEvaluationType)
              ?.id) ||
        (!pageWithProposal.proposal?.archived &&
          cardProposalStep?.optionId !==
            databaseProposalProps.proposalStep?.options.find((opt) => opt.value === proposalEvaluationStep)?.id) ||
        hasCustomPropertyValueChanged
      ) {
        let properties: Record<string, CardPropertyValue> = {
          ...(card.block.fields as any).properties,
          [cardProposalUrl?.propertyId ?? '']: pageWithProposal.path,
          [cardProposalStatus?.propertyId ?? '']: proposalEvaluationStatus,
          [cardEvaluationType?.propertyId ?? '']: proposalEvaluationType,
          [cardProposalStep?.propertyId ?? '']: proposalEvaluationStep
        };

        pageWithProposal.proposal?.evaluations.forEach((evaluation) => {
          if (evaluation.type === 'rubric') {
            const criteria = mappedRubricCriteriaByProposal[pageWithProposal.id] ?? [];
            const answers = mappedRubricAnswersByProposal[pageWithProposal.id] ?? [];
            properties = generateResyncedProposalEvaluationForCard({
              properties,
              rubricAnswers: (answers as ProposalRubricCriteriaAnswerWithTypedResponse[]) ?? [],
              rubricCriteria: (criteria as ProposalRubricCriteriaWithTypedParams[]) ?? [],
              step: {
                id: evaluation.id,
                title: evaluation.title
              },
              templates: boardBlockCardProperties
            });
          }
        });

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
              fields: {
                ...(card.block.fields as any),
                properties
              }
            }
          });

          return { updatedCardPage: updatedPage, updatedCardBlock: updatedBlock };
        });
        updatedPages.push(updatedCardPage);
        updatedBlocks.push(updatedCardBlock);
      }

      // Don't create new cards from archived cards
    } else if (!card && !pageWithProposal.proposal?.archived) {
      let properties: Record<string, CardPropertyValue> = {};

      if (databaseProposalProps.proposalUrl) {
        properties[databaseProposalProps.proposalUrl.id] = pageWithProposal.path;
      }

      if (databaseProposalProps.proposalStatus) {
        properties[databaseProposalProps.proposalStatus.id] = proposalEvaluationStatus ?? '';
      }

      if (databaseProposalProps.proposalEvaluationType) {
        properties[databaseProposalProps.proposalEvaluationType.id] = proposalEvaluationType ?? '';
      }

      if (databaseProposalProps.proposalStep) {
        properties[databaseProposalProps.proposalStep.id] = proposalEvaluationStep ?? '';
      }

      boardBlockCardProperties.forEach((cardProperty) => {
        if (!proposalPropertyTypesList.includes(cardProperty.type as any) && cardProperty.proposalFieldId) {
          const proposalFieldValue = (pageWithProposal.proposal?.fields as ProposalFields)?.properties?.[
            cardProperty.id
          ];
          if (proposalFieldValue !== null && proposalFieldValue !== undefined) {
            properties[cardProperty.id] = proposalFieldValue as CardPropertyValue;
          }
        }
      });

      const createdAt = pageWithProposal.createdAt;

      pageWithProposal.proposal?.evaluations.forEach((evaluation) => {
        if (evaluation.type === 'rubric') {
          const criteria = mappedRubricCriteriaByProposal[pageWithProposal.id] ?? [];
          const answers = mappedRubricAnswersByProposal[pageWithProposal.id] ?? [];
          properties = generateResyncedProposalEvaluationForCard({
            properties,
            rubricAnswers: answers as ProposalRubricCriteriaAnswerWithTypedResponse[],
            rubricCriteria: criteria as ProposalRubricCriteriaWithTypedParams[],
            step: evaluation,
            templates: boardBlockCardProperties
          });
        }
      });

      const formFields = pageWithProposal.proposal?.form?.formFields ?? [];

      const formFieldProperties = updateCardFormFieldPropertiesValue({
        accessPrivateFields,
        cardProperties: boardBlockCardProperties,
        formFields,
        proposalId: pageWithProposal.proposal!.id
      });

      const _card = await createCardPage({
        title: pageWithProposal.title,
        boardId,
        spaceId: pageWithProposal.spaceId,
        createdAt,
        createdBy: userId,
        properties: {
          ...properties,
          ...formFieldProperties
        },
        hasContent: pageWithProposal.hasContent,
        content: pageWithProposal.content,
        contentText: pageWithProposal.contentText,
        syncWithPageId: pageWithProposal.id,
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
      newCards.push(_card);
    }
  }

  if (updatedPages.length > 0) {
    relay.broadcast(
      {
        type: 'pages_meta_updated',
        payload: updatedPages.map(
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
      payload: [prismaToBlock(boardBlock as any)]
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

  const reducedproposalPages = proposalPages.reduce((acc, val) => {
    acc[val.id] = val.id;
    return acc;
  }, {} as Record<string, string>);

  const orphanPageIds = existingCardPages
    .filter((card) => card.syncWithPageId && !reducedproposalPages[card.syncWithPageId])
    .map((card) => card.id);

  /**
   * Case where a user permanently deleted a proposal page
   */
  if (orphanPageIds.length > 0) {
    await prisma.page.deleteMany({
      where: {
        id: {
          in: orphanPageIds
        }
      }
    });
    await prisma.block.deleteMany({
      where: {
        id: {
          in: orphanPageIds
        }
      }
    });
  }

  if (orphanPageIds.length > 0) {
    relay.broadcast(
      {
        type: 'pages_deleted',
        payload: orphanPageIds.map((id) => ({ id }))
      },
      spaceId
    );
  }
  return {
    created: newCards.length,
    deleted: orphanPageIds.length,
    updated: updatedPages.length
  };
}
