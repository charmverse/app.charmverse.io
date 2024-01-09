import type { FormField } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import {
  EVALUATION_STATUS_LABELS,
  PROPOSAL_STEP_LABELS,
  proposalDbProperties,
  proposalStatusColors
} from 'lib/focalboard/proposalDbProperties';
import { InvalidStateError } from 'lib/middleware/errors';
import type { PageContent } from 'lib/prosemirror/interfaces';

export async function setDatabaseProposalProperties({
  boardId,
  cardProperties
}: {
  boardId: string;
  cardProperties: IPropertyTemplate[];
}): Promise<Board> {
  const boardBlock = (await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
    }
  })) as any as Board;

  if (boardBlock.fields.sourceType !== 'proposals') {
    throw new InvalidStateError(`Cannot add proposal cards to a database which does not have proposals as its source`);
  }

  const rubricProposals = await prisma.proposal.count({
    where: {
      spaceId: boardBlock.spaceId,
      evaluationType: 'rubric'
    }
  });

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
      id: true,
      formFields: true
    }
  });

  const formFields = forms.flatMap((p) => p.formFields);
  const proposals = await prisma.proposal.findMany({
    where: {
      spaceId: boardBlock.spaceId
    },
    select: {
      evaluations: {
        select: {
          title: true
        }
      }
    }
  });

  const evaluationStepTitles: Set<string> = new Set();

  proposals.forEach((p) => {
    p.evaluations.forEach((e) => {
      evaluationStepTitles.add(e.title);
    });
  });

  const spaceUsesRubrics = rubricProposals > 0;
  const boardProperties = getBoardProperties({
    evaluationStepTitles: Array.from(evaluationStepTitles),
    formFields,
    boardBlock,
    spaceUsesRubrics,
    cardProperties
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
  }) as any as Board;
}

export function getBoardProperties({
  boardBlock,
  spaceUsesRubrics,
  formFields = [],
  evaluationStepTitles = [],
  cardProperties = []
}: {
  cardProperties?: IPropertyTemplate[];
  evaluationStepTitles?: string[];
  boardBlock: Board;
  spaceUsesRubrics: boolean;
  formFields?: FormField[];
}) {
  const boardProperties = boardBlock.fields.cardProperties ?? [];

  const statusProp = generateUpdatedProposalStatusProperty({ boardProperties });
  const proposalUrlProp = generateUpdatedProposalUrlProperty({ boardProperties });
  const proposalEvaluationTypeProp = generateUpdatedProposalEvaluationTypeProperty({ boardProperties });
  const stepProp = generateUpdatedProposalStepProperty({ boardProperties, evaluationStepTitles });

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

  if (spaceUsesRubrics) {
    const evaluatedByProp = generateUpdatedProposalEvaluatedByProperty({ boardProperties });
    const evaluationTotalProp = generateUpdatedProposalEvaluationTotalProperty({ boardProperties });
    const evaluationAverageProp = generateUpdatedProposalEvaluationAverageProperty({ boardProperties });

    const existingEvaluatedByPropPropIndex = boardProperties.findIndex((p) => p.type === 'proposalEvaluatedBy');

    if (existingEvaluatedByPropPropIndex > -1) {
      boardProperties[existingEvaluatedByPropPropIndex] = evaluatedByProp;
    } else {
      boardProperties.push(evaluatedByProp);
    }

    const existingEvaluationTotalPropIndex = boardProperties.findIndex((p) => p.type === 'proposalEvaluationTotal');

    if (existingEvaluationTotalPropIndex > -1) {
      boardProperties[existingEvaluationTotalPropIndex] = evaluationTotalProp;
    } else {
      boardProperties.push(evaluationTotalProp);
    }

    const existingEvaluationAveragePropIndex = boardProperties.findIndex((p) => p.type === 'proposalEvaluationAverage');

    if (existingEvaluationAveragePropIndex > -1) {
      boardProperties[existingEvaluationAveragePropIndex] = evaluationAverageProp;
    } else {
      boardProperties.push(evaluationAverageProp);
    }
  }

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

function generateUpdatedProposalStepProperty({
  boardProperties,
  evaluationStepTitles
}: {
  evaluationStepTitles: string[];
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStepProp = {
    ...(boardProperties.find((p) => p.type === 'proposalStep') ?? {
      ...proposalDbProperties.proposalStep(),
      id: uuid(),
      options: ['Draft', 'Rewards', ...evaluationStepTitles].map((title) => ({
        color: 'propColorGray',
        id: title,
        value: title
      }))
    })
  };

  return proposalStepProp;
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

function generateUpdatedProposalEvaluatedByProperty({ boardProperties }: { boardProperties: IPropertyTemplate[] }) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalEvaluatedBy') ?? {
      ...proposalDbProperties.proposalEvaluatedBy(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}

function generateUpdatedProposalEvaluationTotalProperty({ boardProperties }: { boardProperties: IPropertyTemplate[] }) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalEvaluationTotal') ?? {
      ...proposalDbProperties.proposalEvaluationTotal(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}

function generateUpdatedProposalEvaluationAverageProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalEvaluationAverage') ?? {
      ...proposalDbProperties.proposalEvaluationAverage(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}
