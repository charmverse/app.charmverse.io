import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { IPropertyTemplate, BoardFields } from 'lib/databases/board';
import { InvalidStateError } from 'lib/middleware/errors';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/proposals/blocks/constants';

import { getBoardProperties } from './getBoardProperties';

export async function updateBoardProperties({ boardId }: { boardId: string }): Promise<Block> {
  const boardBlock = await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
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
          spaceId: boardBlock.spaceId
        }
      },
      select: {
        type: true,
        title: true
      },
      orderBy: {
        index: 'asc'
      },
      distinct: ['title']
    }),
    prisma.form.findMany({
      where: {
        proposal: {
          some: {
            page: {
              type: 'proposal'
            },
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

  const formFields = forms
    .sort((a, b) => (a.proposal[0]?.page?.createdAt.getTime() ?? 0) - (b.proposal[0]?.page?.createdAt.getTime() ?? 0))
    .flatMap((p) => p.formFields);

  const evaluationStepTitles: Set<string> = new Set();
  const rubricStepTitles: Set<string> = new Set();
  evaluationSteps.forEach((e) => {
    evaluationStepTitles.add(e.title);
    if (e.type === 'rubric') {
      rubricStepTitles.add(e.title);
    }
  });

  const proposalCustomProperties = (proposalBoardBlock?.fields.cardProperties ?? []) as IPropertyTemplate[];
  const boardProperties = getBoardProperties({
    evaluationStepTitles: Array.from(evaluationStepTitles),
    formFields,
    proposalCustomProperties,
    currentCardProperties: boardFields.cardProperties,
    rubricStepTitles: Array.from(rubricStepTitles)
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
