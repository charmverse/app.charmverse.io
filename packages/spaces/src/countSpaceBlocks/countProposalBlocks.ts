import type { Proposal } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { IPropertyTemplate } from '@packages/databases/board';
import type { CardFields } from '@packages/databases/card';
import { paginatedPrismaTask } from '@packages/lib/utils/paginatedPrismaTask';
import _sum from 'lodash/sum';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedProposalBlocksCount = {
  proposalViews: number;
  proposalProperties: number;
  proposalPropertyValues: number;
  proposalRubricAnswers: number;
  proposalFormFields: number;
};

export type ProposalBlocksCount = GenericBlocksCount<DetailedProposalBlocksCount>;

export async function countProposalBlocks({ spaceId, batchSize }: BlocksCountQuery): Promise<ProposalBlocksCount> {
  const detailedCount: ProposalBlocksCount = {
    total: 0,
    details: {
      proposalViews: 0,
      proposalProperties: 0,
      proposalPropertyValues: 0,
      proposalRubricAnswers: 0,
      proposalFormFields: 0
    }
  };

  // 1 - Count views
  detailedCount.details.proposalViews = await prisma.proposalBlock.count({
    where: { spaceId, type: 'view' }
  });

  // Retrieve the single proposal board block for the space
  const proposalBlockRecord = await prisma.proposalBlock.findFirst({
    where: {
      type: 'board',
      spaceId
    },
    select: {
      fields: true
    }
  });

  if (!proposalBlockRecord) {
    // No proposal board block found, return the initial detailed count
    return detailedCount;
  }

  // 2 - Get schema for the proposal block
  const proposalSchema = (proposalBlockRecord.fields as any).cardProperties?.reduce(
    (acc: Record<string, IPropertyTemplate>, prop: IPropertyTemplate) => {
      acc[prop.id] = prop;
      return acc;
    },
    {} as Record<string, IPropertyTemplate>
  );

  detailedCount.details.proposalProperties = Object.keys(proposalSchema).length;

  // 3 - Handle rubrics
  detailedCount.details.proposalRubricAnswers = await prisma.proposalRubricCriteriaAnswer.count({
    where: {
      proposal: {
        page: {
          deletedAt: null
        },
        spaceId
      }
    }
  });

  const proposalsWithFormData = await prisma.proposal.findMany({
    where: {
      spaceId,
      page: {
        deletedAt: null
      }
    },
    select: {
      formAnswers: {
        select: {
          value: true
        }
      },
      form: {
        select: {
          formFields: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  const totalFormFieldsCount = proposalsWithFormData.reduce<number>((acc, proposal) => {
    const formFieldAnswersCount = proposal.formAnswers.filter(
      (answer) => answer.value !== undefined && answer.value !== null && answer.value !== ''
    ).length;
    return acc + formFieldAnswersCount;
  }, 0);

  detailedCount.details.proposalFormFields = totalFormFieldsCount;

  // 4 - Count proposal property values
  const proposalPropertyValues = await paginatedPrismaTask({
    batchSize,
    model: 'proposal',
    queryOptions: {
      where: {
        spaceId,
        page: {
          deletedAt: null
        }
      },
      select: {
        id: true,
        fields: true
      }
    },
    onSuccess: _sum,
    mapper: (proposal: Pick<Proposal, 'fields'>) => {
      const proposalProps = Object.entries((proposal.fields as CardFields)?.properties ?? {});
      return proposalProps.reduce((proposalPropAcc, [propId, propValue]) => {
        const matchingSchema = proposalSchema[propId];
        if (
          propValue === null ||
          propValue === undefined ||
          propValue === '' ||
          (Array.isArray(propValue) && !propValue.length) ||
          !matchingSchema
        ) {
          return proposalPropAcc;
        }
        return proposalPropAcc + 1;
      }, 0);
    }
  });

  detailedCount.details.proposalPropertyValues = proposalPropertyValues;

  // Summing up all counts
  detailedCount.total = _sum(Object.values(detailedCount.details));

  return detailedCount;
}
