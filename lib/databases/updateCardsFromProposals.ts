import type {
  Block,
  Page,
  Prisma,
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import _ from 'lodash';

import { prismaToUIBlock } from 'lib/databases/block';
import { extractCardProposalProperties } from 'lib/databases/extractCardProposalProperties';
import { extractDatabaseProposalProperties } from 'lib/databases/extractDatabaseProposalProperties';
import { InvalidStateError } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getCurrentStep } from 'lib/proposals/getCurrentStep';
import type { ProposalFields } from 'lib/proposals/interfaces';
import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  RubricCriteriaTyped
} from 'lib/proposals/rubric/interfaces';
import { isTruthy } from 'lib/utils/types';
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

const pageSelectObject = {
  id: true,
  title: true,
  hasContent: true,
  content: true,
  contentText: true,
  createdAt: true,
  deletedAt: true,
  path: true,
  spaceId: true,
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
      fields: true
    }
  }
} as const;

type ProposalPage = Prisma.PageGetPayload<{ select: typeof pageSelectObject }>;

async function fetchAndProcessProposalPages({
  cursor = null,
  spaceId,
  process
}: {
  process: (proposalPages: ProposalPage[]) => Promise<void>;
  cursor?: string | null;
  spaceId: string;
}) {
  const batchSize = 100;
  const proposalPages = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        status: 'published'
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: batchSize,
    skip: cursor ? 1 : undefined,
    cursor: cursor ? { id: cursor } : undefined,
    select: pageSelectObject
  });

  if (proposalPages.length === batchSize) {
    const nextCursor = proposalPages[proposalPages.length - 1].id;
    await process(proposalPages);
    await fetchAndProcessProposalPages({
      cursor: nextCursor,
      spaceId,
      process
    });
  } else {
    await process(proposalPages);
  }
}

export async function updateCardsFromProposals({
  boardId,
  spaceId,
  userId
}: {
  boardId: string;
  spaceId: string;
  userId: string;
}) {
  const [board, rootPagePermissions, proposalBoardBlock] = await prisma.$transaction([
    prisma.block.findFirstOrThrow({
      where: {
        id: boardId,
        spaceId
      }
    }),
    prisma.page.findFirstOrThrow({
      where: {
        id: boardId
      },
      select: {
        permissions: true
      }
    }),
    prisma.proposalBlock.findUnique({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      },
      select: {
        fields: true
      }
    })
  ]);

  const boardBlockFields = (proposalBoardBlock as null | { fields: BoardFields })?.fields;

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
    boardBlockFields?.cardProperties.filter((prop) => !boardBlockCardPropertiesRecord[prop.id]) ?? [];

  // Looping through proposal board block properties since its the source of truth for the properties
  const proposalBoardPropertiesUpdated =
    (newBoardProposalCustomProperties.length > 0 ||
      boardBlockFields?.cardProperties.some((cardProperty) => {
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
    boardBlockFields?.cardProperties.forEach((cardProperty) => {
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

  const proposalPagesLite = await prisma.page.findMany({
    where: {
      spaceId,
      type: 'proposal',
      proposal: {
        status: {
          not: 'draft'
        }
      }
    },
    select: {
      id: true,
      proposal: {
        select: {
          id: true,
          formId: true
        }
      }
    }
  });

  const pageIdsSet = new Set(proposalPagesLite.map((p) => p.id));
  const formIds = Array.from(new Set(proposalPagesLite.map((p) => p.proposal?.formId))).filter(isTruthy);

  const existingCardPages = await prisma.page.findMany({
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
  });

  const formFields = await prisma.formField.findMany({
    where: {
      formId: {
        in: formIds
      }
    },
    select: {
      formId: true,
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
  });

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
  const updatedCards: { page: Page; block: Block }[] = [];
  const newCards: { page: Page; block: Block }[] = [];

  const proposalIds = proposalPagesLite.map((p) => p.proposal?.id).filter(isTruthy);

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

  await fetchAndProcessProposalPages({
    spaceId,
    process: async (proposalPages) => {
      for (const pageWithProposal of proposalPages) {
        const card = existingSyncedCardsWithBlocks[pageWithProposal.id];

        const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
          resourceId: pageWithProposal.proposal!.id,
          // Use the board creator to check if private fields are accessible
          userId: boardBlock.createdBy
        });
        const accessPrivateFields = permissions.view_private_fields;

        const currentStep = pageWithProposal.proposal
          ? getCurrentStep({
              evaluations: pageWithProposal.proposal.evaluations ?? [],
              hasPendingRewards:
                ((pageWithProposal.proposal.fields as ProposalFields)?.pendingRewards ?? []).length > 0,
              hasPublishedRewards: pageWithProposal.proposal.rewards.length > 0,
              proposalStatus: pageWithProposal.proposal.status
            })
          : null;

        const proposalEvaluationStatus = currentStep?.result ?? 'in_progress';
        const proposalEvaluationStep = currentStep?.title ?? 'Draft';
        const proposalEvaluationType = currentStep?.step ?? 'draft';

        if (card) {
          const { cardProposalStatus, cardEvaluationType, cardProposalStep, cardProposalUrl, cardProposalAuthor } =
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
                databaseProposalProps.proposalStatus?.options.find((opt) => opt.value === proposalEvaluationStatus)
                  ?.id) ||
            (!pageWithProposal.proposal?.archived &&
              cardEvaluationType?.optionId !==
                databaseProposalProps.proposalEvaluationType?.options.find(
                  (opt) => opt.value === proposalEvaluationType
                )?.id) ||
            (!pageWithProposal.proposal?.archived &&
              cardProposalAuthor &&
              !_.isEqual(pageWithProposal.proposal?.authors ?? [], cardProposalAuthor.value)) ||
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
              [cardProposalStep?.propertyId ?? '']: proposalEvaluationStep,
              [cardProposalAuthor?.propertyId ?? '']: pageWithProposal.proposal?.authors.map((a) => a.userId) ?? []
            };

            pageWithProposal.proposal?.evaluations.forEach((evaluation) => {
              if (evaluation.type === 'rubric') {
                const criteria = mappedRubricCriteriaByProposal[pageWithProposal.id] ?? [];
                const answers = mappedRubricAnswersByProposal[pageWithProposal.id] ?? [];
                properties = generateResyncedProposalEvaluationForCard({
                  properties,
                  rubricAnswers: (answers as ProposalRubricCriteriaAnswerWithTypedResponse[]) ?? [],
                  rubricCriteria: (criteria as RubricCriteriaTyped[]) ?? [],
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
            updatedCards.push({ block: updatedCardBlock, page: updatedCardPage });
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

          if (databaseProposalProps.proposalAuthor) {
            properties[databaseProposalProps.proposalAuthor.id] =
              pageWithProposal.proposal?.authors.map((a) => a.userId) ?? [];
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
                rubricCriteria: criteria as RubricCriteriaTyped[],
                step: evaluation,
                templates: boardBlockCardProperties
              });
            }
          });

          const proposalFormFields = formFields.filter((f) => f.formId === pageWithProposal.proposal?.formId);

          const formFieldProperties = updateCardFormFieldPropertiesValue({
            accessPrivateFields,
            cardProperties: boardBlockCardProperties,
            formFields: proposalFormFields,
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
    }
  });

  const updatedBlockPayload = [boardBlock, ...updatedCards.map(({ block, page }) => prismaToUIBlock(block, page))];

  relay.broadcast(
    {
      type: 'blocks_updated',
      payload: updatedBlockPayload
    },
    spaceId
  );

  if (newCards.length > 0) {
    relay.broadcast(
      {
        type: 'blocks_created',
        payload: newCards.map((card) => prismaToUIBlock(card.block, card.page))
      },
      spaceId
    );
  }

  const orphanPageIds = existingCardPages
    .filter((card) => card.syncWithPageId && !pageIdsSet.has(card.syncWithPageId))
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
    updated: updatedCards.length
  };
}
