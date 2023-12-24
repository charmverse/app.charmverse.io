import type { FormField, ProposalCategory } from '@charmverse/core/prisma';
import { ProposalStatus, prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import { getBoardColorFromColor } from 'lib/focalboard/constants';
import { proposalDbProperties, proposalStatusBoardColors } from 'lib/focalboard/proposalDbProperties';
import { InvalidStateError } from 'lib/middleware/errors';
import type { PageContent } from 'lib/prosemirror/interfaces';

type ProposalCategoryFields = Pick<ProposalCategory, 'title' | 'id' | 'color'>;

export async function setDatabaseProposalProperties({ boardId }: { boardId: string }): Promise<Board> {
  const boardBlock = (await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
    }
  })) as any as Board;
  if (boardBlock.fields.sourceType !== 'proposals') {
    throw new InvalidStateError(`Cannot add proposal cards to a database which does not have proposals as its source`);
  }
  const proposalCategories = await prisma.proposalCategory.findMany({
    where: {
      spaceId: boardBlock.spaceId
    },
    select: {
      id: true,
      color: true,
      title: true
    }
  });

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

  const spaceUsesRubrics = rubricProposals > 0;
  const boardProperties = getBoardProperties({ formFields, boardBlock, proposalCategories, spaceUsesRubrics });

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
  proposalCategories,
  spaceUsesRubrics,
  formFields = []
}: {
  boardBlock: Board;
  proposalCategories: ProposalCategoryFields[];
  spaceUsesRubrics: boolean;
  formFields?: FormField[];
}) {
  const boardProperties = boardBlock.fields.cardProperties ?? [];

  const categoryProp = generateUpdatedProposalCategoryProperty({
    boardProperties,
    proposalCategories
  });
  const statusProp = generateUpdatedProposalStatusProperty({ boardProperties });
  const proposalUrlProp = generateUpdatedProposalUrlProperty({ boardProperties });

  const existingCategoryPropIndex = boardProperties.findIndex((p) => p.type === 'proposalCategory');

  if (existingCategoryPropIndex > -1) {
    boardProperties[existingCategoryPropIndex] = categoryProp;
  } else {
    boardProperties.push(categoryProp);
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

function generateUpdatedProposalCategoryProperty({
  boardProperties,
  proposalCategories
}: {
  boardProperties: IPropertyTemplate[];
  proposalCategories: ProposalCategoryFields[];
}) {
  // We will mutate and return this property
  const proposalCategoryProp = {
    ...(boardProperties.find((p) => p.type === 'proposalCategory') ?? {
      ...proposalDbProperties.proposalCategory(),
      id: uuid()
    })
  };

  proposalCategories.forEach((c) => {
    const existingPropertyValue = proposalCategoryProp.options.find((opt) => opt.id === c.id);

    if (!existingPropertyValue) {
      proposalCategoryProp.options.push({
        id: c.id,
        value: c.title,
        color: getBoardColorFromColor(c.color)
      });
    } else {
      existingPropertyValue.value = c.title;
    }
  });

  return proposalCategoryProp;
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
    [...objectUtils.typedKeys(ProposalStatus), 'archived'].forEach((status) => {
      if (status !== 'draft') {
        const existingOption = proposalStatusProp.options.find((opt) => opt.value === status);
        if (!existingOption) {
          proposalStatusProp.options.push({
            color: proposalStatusBoardColors[status as Exclude<ProposalStatus, 'draft'> | 'archived'],
            id: uuid(),
            value: status
          });
        }
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
