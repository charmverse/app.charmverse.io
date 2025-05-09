import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { BoardFields, IPropertyTemplate } from '@packages/databases/board';
import { defaultProposalPropertyTypes } from '@packages/databases/proposalDbProperties';
import { projectFieldColumnIds, projectMemberFieldColumnIds } from 'lib/projects/formField';
import { ProposalBoardBlockFields } from '@packages/lib/proposals/blocks/interfaces';
import fs from 'fs';

/**
 * Use this script to perform database searches.
 */

async function exportCustomProposalSourceBoardProperties() {
  const boards: {
    id: string;
    customProperties: IPropertyTemplate[];
  }[] = [];

  const proposalSourceBoards = await prisma.block.findMany({
    where: {
      type: 'board',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    },
    select: {
      spaceId: true,
      id: true,
      fields: true
    }
  });

  const total = proposalSourceBoards.length;
  let count = 0;

  for (const proposalSourceBoard of proposalSourceBoards) {
    try {
      const proposalBlock = await prisma.proposalBlock.findFirst({
        where: {
          type: 'board',
          spaceId: proposalSourceBoard.spaceId
        },
        select: {
          fields: true
        }
      });
      const proposalBlockFields = proposalBlock?.fields as unknown as ProposalBoardBlockFields;
      const proposalBlockPropertyIds = proposalBlockFields?.cardProperties.map((cardProperty) => cardProperty.id) ?? [];
      const fields = proposalSourceBoard.fields as unknown as BoardFields;
      const cardProperties = fields.cardProperties ?? [];
      const customProposalBoardProperties = cardProperties.filter((cardProperty) => {
        return (
          !defaultProposalPropertyTypes.includes(cardProperty.type) &&
          cardProperty.type !== 'proposalEvaluationAverage' &&
          cardProperty.type !== 'proposalEvaluationTotal' &&
          cardProperty.type !== 'proposalEvaluatedBy' &&
          cardProperty.type !== 'proposalRubricCriteriaTotal' &&
          // deprecated property just remove it
          (cardProperty.type as string) !== 'proposalCategory' &&
          !cardProperty.formFieldId &&
          !cardProperty.evaluationTitle &&
          !cardProperty.criteriaTitle &&
          !projectFieldColumnIds.includes(cardProperty.id) &&
          !projectMemberFieldColumnIds.includes(cardProperty.id) &&
          !proposalBlockPropertyIds.includes(cardProperty.id)
        );
      });

      if (customProposalBoardProperties.length) {
        boards.push({
          id: proposalSourceBoard.id,
          customProperties: customProposalBoardProperties
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      count++;
      console.log(`Progress: ${count}/${total}`);
    }
  }

  fs.writeFileSync('boards.json', JSON.stringify(boards, null, 2));
}

async function importCustomProposalSourceBoardProperties() {
  const boards = JSON.parse(fs.readFileSync('boards.json', 'utf-8')) as {
    id: string;
    customProperties: IPropertyTemplate[];
  }[];

  const proposalSourceBoards = await prisma.block.findMany({
    where: {
      type: 'board',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      },
      space: {
        domain: 'taiko'
      }
    },
    select: {
      spaceId: true,
      id: true,
      fields: true
    }
  });

  const proposalSourceBoardRecord: Record<
    string,
    {
      id: string;
      fields: BoardFields;
    }
  > = {};

  for (const proposalSourceBoard of proposalSourceBoards) {
    proposalSourceBoardRecord[proposalSourceBoard.id] = {
      id: proposalSourceBoard.id,
      fields: proposalSourceBoard.fields as unknown as BoardFields
    };
  }

  const total = boards.length;
  let count = 0;

  for (const board of boards) {
    try {
      const boardFields = proposalSourceBoardRecord[board.id]?.fields;
      if (boardFields) {
        await prisma.block.update({
          where: {
            id: board.id
          },
          data: {
            fields: {
              ...boardFields,
              cardProperties: [
                ...(boardFields.cardProperties as unknown as Prisma.JsonValue[]),
                ...(board.customProperties as unknown as Prisma.JsonValue[])
              ]
            }
          }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      count++;
      console.log(`Progress: ${count}/${total}`);
    }
  }
}

importCustomProposalSourceBoardProperties().then(() => console.log('Done'));

// exportCustomProposalSourceBoardProperties().then(() => console.log('Done'));
