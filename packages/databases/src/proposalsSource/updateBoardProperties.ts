import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DEFAULT_BOARD_BLOCK_ID } from '@packages/lib/proposals/blocks/constants';
import type { FormFieldInput } from '@packages/lib/proposals/forms/interfaces';
import { InvalidStateError } from '@packages/nextjs/errors';

import type { IPropertyTemplate, BoardFields } from '../board';

import { getBoardProperties } from './getBoardProperties';
import type { SelectedProposalProperties } from './interfaces';

export async function updateBoardProperties({
  boardId,
  selectedProperties
}: {
  selectedProperties?: SelectedProposalProperties;
  boardId: string;
}): Promise<Block> {
  const boardBlock = await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
    },
    select: {
      spaceId: true,
      fields: true,
      id: true
    }
  });

  const [proposalBoardBlock, evaluationSteps, forms] = await Promise.all([
    prisma.proposalBlock.findUnique({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId: boardBlock.spaceId
        }
      },
      select: {
        fields: true
      }
    }) as Promise<null | { fields: BoardFields }>,
    prisma.proposalEvaluation.findMany({
      where: {
        proposal: {
          archived: false,
          spaceId: boardBlock.spaceId,
          page: {
            // Need only proposal templates for rubric evaluation & criteria properties
            // Need only proposals for rubric evaluation criteria score properties
            type: {
              in: ['proposal_template', 'proposal']
            },
            deletedAt: null
          }
        }
      },
      select: {
        proposal: {
          select: {
            page: {
              select: {
                sourceTemplateId: true,
                type: true,
                title: true,
                id: true
              }
            }
          }
        },
        type: true,
        title: true,
        rubricCriteria: {
          select: {
            title: true,
            description: true,
            answers: {
              select: {
                user: {
                  select: {
                    username: true,
                    id: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        index: 'asc'
      }
    }),
    prisma.form.findMany({
      where: {
        proposal: {
          some: {
            page: {
              type: 'proposal_template',
              deletedAt: null
            },
            archived: false,
            spaceId: boardBlock.spaceId
          }
        }
      },
      select: {
        proposal: {
          orderBy: {
            page: {
              createdAt: 'asc'
            }
          },
          select: {
            page: {
              select: {
                id: true,
                createdAt: true
              }
            }
          }
        },
        id: true,
        formFields: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    })
  ]);

  const boardFields = boardBlock.fields as unknown as BoardFields;
  if (boardFields.sourceType !== 'proposals') {
    throw new InvalidStateError(`Cannot add proposal cards to a database which does not have proposals as its source`);
  }

  const formFields: FormFieldInput[] = forms
    .sort((a, b) => (a.proposal[0]?.page?.createdAt.getTime() ?? 0) - (b.proposal[0]?.page?.createdAt.getTime() ?? 0))
    .flatMap((p) =>
      p.formFields.map((field) => ({
        ...field,
        pageId: p.proposal[0].page?.id,
        options: field.options as FormFieldInput['options']
      }))
    );

  const proposalCustomProperties = (proposalBoardBlock?.fields.cardProperties ?? []) as IPropertyTemplate[];
  const boardProperties = getBoardProperties({
    evaluationSteps,
    formFields,
    proposalCustomProperties,
    currentCardProperties: boardFields.cardProperties,
    selectedProperties
  });

  return prisma.block.update({
    where: {
      id: boardBlock.id
    },
    data: {
      fields: {
        ...(boardBlock.fields as any),
        cardProperties: boardProperties
      }
    }
  });
}
