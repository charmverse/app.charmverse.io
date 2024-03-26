import type { FormField } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { prismaToUIBlock } from 'lib/databases/block';
import type { Board, IPropertyTemplate, BoardFields } from 'lib/databases/board';
import {
  EVALUATION_STATUS_LABELS,
  PROPOSAL_STEP_LABELS,
  proposalDbProperties,
  proposalStatusColors
} from 'lib/databases/proposalDbProperties';
import { InvalidStateError } from 'lib/middleware/errors';
import type { PageContent } from 'lib/prosemirror/interfaces';

export async function setDatabaseProposalProperties({
  boardId,
  cardProperties
}: {
  boardId: string;
  cardProperties: IPropertyTemplate[];
}): Promise<Board> {
  const [boardBlock, boardPage] = await Promise.all([
    prisma.block.findUniqueOrThrow({
      where: {
        id: boardId
      }
    }),
    prisma.page.findFirstOrThrow({
      where: {
        boardId
      }
    })
  ]);
  const boardFields = boardBlock.fields as unknown as BoardFields;

  if (boardFields.sourceType !== 'proposals') {
    throw new InvalidStateError(`Cannot add proposal cards to a database which does not have proposals as its source`);
  }

  const forms = await prisma.form.findMany({
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
  });

  const formFields = forms
    .sort((a, b) => (a.proposal[0]?.page?.createdAt.getTime() ?? 0) - (b.proposal[0]?.page?.createdAt.getTime() ?? 0))
    .flatMap((p) => p.formFields);
  const proposals = await prisma.proposal.findMany({
    where: {
      spaceId: boardBlock.spaceId
    },
    select: {
      evaluations: {
        select: {
          type: true,
          title: true
        },
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  const evaluationStepTitles: Set<string> = new Set();
  const rubricStepTitles: Set<string> = new Set();

  proposals.forEach((p) => {
    p.evaluations.forEach((e) => {
      evaluationStepTitles.add(e.title);
      if (e.type === 'rubric') {
        rubricStepTitles.add(e.title);
      }
    });
  });

  const boardProperties = getBoardProperties({
    evaluationStepTitles: Array.from(evaluationStepTitles),
    formFields,
    cardProperties,
    currentCardProperties: boardFields.cardProperties,
    rubricStepTitles: Array.from(rubricStepTitles)
  });

  const updatedBoardBlock = await prisma.block.update({
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

  return prismaToUIBlock(updatedBoardBlock, boardPage) as Board;
}

function getBoardProperties({
  currentCardProperties = [],
  formFields = [],
  evaluationStepTitles = [],
  cardProperties = [],
  rubricStepTitles = []
}: {
  rubricStepTitles?: string[];
  cardProperties?: IPropertyTemplate[];
  evaluationStepTitles?: string[];
  currentCardProperties: IPropertyTemplate[];
  formFields?: FormField[];
}) {
  const boardProperties = [...currentCardProperties];

  const statusProp = generateUpdatedProposalStatusProperty({ boardProperties });
  const proposalUrlProp = generateUpdatedProposalUrlProperty({ boardProperties });
  const proposalEvaluationTypeProp = generateUpdatedProposalEvaluationTypeProperty({ boardProperties });
  const stepProp = generateUpdatedProposalStepProperty({ boardProperties, evaluationStepTitles });
  const proposalAuthorProp = generateUpdatedProposalAuthorProperty({ boardProperties });
  const proposalReviewerNotes = generateUpdatedProposalReviewerNotesProperty({ boardProperties });

  const existingReviewerNotesPropIndex = boardProperties.findIndex((p) => p.type === 'proposalReviewerNotes');
  if (existingReviewerNotesPropIndex > -1) {
    boardProperties[existingReviewerNotesPropIndex] = proposalReviewerNotes;
  } else {
    boardProperties.push(proposalReviewerNotes);
  }

  const existingAuthorPropIndex = boardProperties.findIndex((p) => p.type === 'proposalAuthor');

  if (existingAuthorPropIndex > -1) {
    boardProperties[existingAuthorPropIndex] = proposalAuthorProp;
  } else {
    boardProperties.push(proposalAuthorProp);
  }

  const existingStatusPropIndex = boardProperties.findIndex((p) => p.type === 'proposalStatus');

  if (existingStatusPropIndex > -1) {
    boardProperties[existingStatusPropIndex] = statusProp;
  } else {
    boardProperties.push(statusProp);
  }

  const existingUrlPropIndex = boardProperties.findIndex((p) => p.type === 'proposalUrl');

  if (existingUrlPropIndex > -1) {
    boardProperties[existingUrlPropIndex] = proposalUrlProp;
  } else {
    boardProperties.push(proposalUrlProp);
  }

  const existingEvaluationTypePropIndex = boardProperties.findIndex((p) => p.type === 'proposalEvaluationType');
  const existingStepPropIndex = boardProperties.findIndex((p) => p.type === 'proposalStep');

  if (existingEvaluationTypePropIndex > -1) {
    boardProperties[existingEvaluationTypePropIndex] = proposalEvaluationTypeProp;
  } else {
    boardProperties.push(proposalEvaluationTypeProp);
  }

  if (existingStepPropIndex > -1) {
    boardProperties[existingStepPropIndex] = stepProp;
  } else {
    boardProperties.push(stepProp);
  }

  addProposalEvaluationProperties({
    boardProperties,
    rubricStepTitles
  });

  cardProperties.forEach((cardProp) => {
    const existingPropIndex = boardProperties.findIndex((p) => p.id === cardProp.id);

    if (existingPropIndex > -1) {
      boardProperties[existingPropIndex] = { ...cardProp, proposalFieldId: cardProp.id };
    } else {
      boardProperties.push({
        ...cardProp,
        proposalFieldId: cardProp.id
      });
    }
  });

  formFields.forEach((formField) => {
    const existingPropIndex = boardProperties.findIndex((p) => p.formFieldId === formField.id);
    let boardPropertyType: IPropertyTemplate['type'] | null = null;
    let boardPropertyOptions: IPropertyTemplate['options'] = [];

    switch (formField.type) {
      case 'short_text':
      case 'wallet':
      case 'long_text': {
        boardPropertyType = 'text';
        break;
      }
      case 'multiselect': {
        boardPropertyType = 'multiSelect';
        boardPropertyOptions = ((formField.options ?? []) as SelectOptionType[]).map((option) => ({
          color: option.color,
          id: option.id,
          value: option.name
        }));
        break;
      }
      case 'select': {
        boardPropertyType = 'select';
        boardPropertyOptions = ((formField.options ?? []) as SelectOptionType[]).map((option) => ({
          color: option.color,
          id: option.id,
          value: option.name
        }));
        break;
      }
      default: {
        if (formField.type !== 'label') {
          boardPropertyType = formField.type as IPropertyTemplate['type'];
        }
      }
    }

    if (boardPropertyType) {
      const boardProperty = {
        name: formField.name,
        options: boardPropertyOptions,
        description: (formField.description as { content: PageContent; contentText: string })?.contentText,
        type: boardPropertyType,
        formFieldId: formField.id
      };

      if (existingPropIndex === -1) {
        boardProperties.push({
          id: uuid(),
          ...boardProperty
        });
      } else {
        boardProperties[existingPropIndex] = {
          ...boardProperties[existingPropIndex],
          ...boardProperty
        };
      }
    }
  });

  return boardProperties;
}

function addProposalEvaluationProperties({
  rubricStepTitles,
  boardProperties
}: {
  rubricStepTitles: string[];
  boardProperties: IPropertyTemplate[];
}) {
  for (const rubricStepTitle of rubricStepTitles) {
    const evaluatedByProp = boardProperties.find((p) => p.type === 'proposalEvaluatedBy' && p.name === rubricStepTitle);
    const evaluationTotalProp = boardProperties.find(
      (p) => p.type === 'proposalEvaluationTotal' && p.name === rubricStepTitle
    );
    const evaluationAverageProp = boardProperties.find(
      (p) => p.type === 'proposalEvaluationAverage' && p.name === rubricStepTitle
    );

    if (!evaluatedByProp) {
      boardProperties.push({
        id: uuid(),
        type: 'proposalEvaluatedBy',
        name: rubricStepTitle,
        options: []
      });
    }

    if (!evaluationTotalProp) {
      boardProperties.push({
        id: uuid(),
        type: 'proposalEvaluationTotal',
        name: rubricStepTitle,
        options: []
      });
    }

    if (!evaluationAverageProp) {
      boardProperties.push({
        id: uuid(),
        type: 'proposalEvaluationAverage',
        name: rubricStepTitle,
        options: []
      });
    }
  }
}

function generateUpdatedProposalReviewerNotesProperty(
  { boardProperties }: { boardProperties: IPropertyTemplate[] } = { boardProperties: [] }
): IPropertyTemplate {
  const existingProposalReviewerNotes = boardProperties.find((p) => p.type === 'proposalReviewerNotes');

  return {
    ...(existingProposalReviewerNotes ?? {
      ...proposalDbProperties.proposalReviewerNotes(),
      id: uuid()
    })
  };
}

function generateUpdatedProposalAuthorProperty(
  { boardProperties }: { boardProperties: IPropertyTemplate[] } = { boardProperties: [] }
): IPropertyTemplate {
  const existingProposalAuthorProperty = boardProperties.find((p) => p.type === 'proposalAuthor');

  return {
    ...(existingProposalAuthorProperty ?? {
      ...proposalDbProperties.proposalAuthor(),
      id: uuid()
    })
  };
}

function generateUpdatedProposalStepProperty({
  boardProperties,
  evaluationStepTitles
}: {
  evaluationStepTitles: string[];
  boardProperties: IPropertyTemplate[];
}): IPropertyTemplate {
  const existingProposalStepProperty = boardProperties.find((p) => p.type === 'proposalStep');

  return {
    ...(existingProposalStepProperty ?? {
      ...proposalDbProperties.proposalStep(),
      id: uuid()
    }),
    options: ['Draft', 'Rewards', ...evaluationStepTitles].map((title) => ({
      color: 'propColorGray',
      id: title,
      value: title
    }))
  };
}

function generateUpdatedProposalEvaluationTypeProperty({ boardProperties }: { boardProperties: IPropertyTemplate[] }) {
  const proposalEvaluationTypeProp = {
    ...(boardProperties.find((p) => p.type === 'proposalEvaluationType') ?? {
      ...proposalDbProperties.proposalEvaluationType(),
      id: uuid()
    })
  };

  if (proposalEvaluationTypeProp) {
    objectUtils.typedKeys(PROPOSAL_STEP_LABELS).forEach((evaluationType) => {
      const existingOption = proposalEvaluationTypeProp.options.find((opt) => opt.value === evaluationType);
      if (!existingOption) {
        proposalEvaluationTypeProp.options.push({
          color: 'propColorGray',
          id: evaluationType,
          value: evaluationType
        });
      }
    });

    return proposalEvaluationTypeProp;
  }

  return proposalEvaluationTypeProp;
}

function generateUpdatedProposalStatusProperty({ boardProperties }: { boardProperties: IPropertyTemplate[] }) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalStatus') ?? {
      ...proposalDbProperties.proposalStatus(),
      id: uuid()
    })
  };

  if (proposalStatusProp) {
    [...objectUtils.typedKeys(EVALUATION_STATUS_LABELS)].forEach((status) => {
      const existingOption = proposalStatusProp.options.find((opt) => opt.value === status);
      if (!existingOption) {
        proposalStatusProp.options.push({
          color: proposalStatusColors[status],
          id: status,
          value: status
        });
      }
    });

    return proposalStatusProp;
  }

  return proposalStatusProp;
}

function generateUpdatedProposalUrlProperty({ boardProperties }: { boardProperties: IPropertyTemplate[] }) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalUrl') ?? {
      ...proposalDbProperties.proposalUrl(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}
