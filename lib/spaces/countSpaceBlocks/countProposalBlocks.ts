import type { Proposal } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import _sum from 'lodash/sum';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { Card, CardFields } from 'lib/focalboard/card';
import { paginatedPrismaTask } from 'lib/utilities/paginatedPrismaTask';

import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

export type DetailedProposalBlocksCount = {
  proposalViews: number;
  proposalProperties: number;
  proposalPropertyValues: number;
  proposalRubrics: number;
  proposalRubricAnswers: number;
};

export type ProposalBlocksCount = GenericBlocksCount<DetailedProposalBlocksCount>;

export async function countProposalBlocks({ spaceId, batchSize }: BlocksCountQuery): Promise<ProposalBlocksCount> {
  const detailedCount: ProposalBlocksCount = {
    total: 0,
    details: {
      proposalViews: 0,
      proposalProperties: 0,
      proposalPropertyValues: 0,
      proposalRubrics: 0,
      proposalRubricAnswers: 0
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
  detailedCount.details.proposalRubrics = await prisma.proposalRubricCriteria.count({
    where: {
      proposal: {
        page: {
          deletedAt: null
        },
        spaceId
      }
    }
  });

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
        if ((!propValue && propValue !== 0) || (Array.isArray(propValue) && !propValue.length) || !matchingSchema) {
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
