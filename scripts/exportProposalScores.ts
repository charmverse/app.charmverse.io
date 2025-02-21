import { prisma } from '@charmverse/core/prisma-client';
import { objectUtils, stringUtils } from '@charmverse/core/utilities';
import { BoardFields } from 'lib/databases/board';
import { CardFields } from 'lib/databases/card';
import { ProposalBoardBlock, ProposalPropertyField } from 'lib/proposals/blocks/interfaces';
import { ProposalFields } from 'lib/proposals/interfaces';
import { AggregateResults, aggregateResults } from 'lib/proposals/rubric/aggregateResults';
import { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposals/rubric/interfaces';
import { writeToSameFolder } from 'lib/utils/file';
import { isNumber } from 'lib/utils/numbers';
import { isTruthy } from '@packages/lib/utils/types';
import { groupBy } from 'lodash';

type ExportedProposal = {
  proposalUrl: string;
  authors: string;
  title: string;
  total: string | number;
  average: string | number;
  rubricResults: string;
};

type ExportKeys = keyof ExportedProposal;

const exportedFormat: Record<ExportKeys, string> = {
  authors: 'Author',
  proposalUrl: 'Proposal URL',
  title: 'Title',
  total: 'Total',
  average: 'Average',
  rubricResults: 'Rubric Results'
};

const exportedCustomProps: string[] = ['Mission', 'Type'];
const exportedCustomFields: string[] = ['What is the size of your grant request?'];

const separator = ',';
const cellEnclosure = '"';
const newLine = '\n';

const headerRows = objectUtils.typedKeys(exportedFormat);

async function exportEvaluatedProposalScores({ domain }: { domain: string }) {
  const customBlocks = await prisma.proposalBlock.findFirstOrThrow({
    where: {
      id: '__defaultBoard',
      space: {
        domain: domain
      }
    }
  });

  const customProposalProperties = (customBlocks as ProposalBoardBlock)?.fields.cardProperties || [];

  const propertyMap = exportedCustomProps.reduce(
    (acc, propName) => {
      const property = customProposalProperties.find((prop) => prop.name === propName);

      if (!property) {
        throw new Error(`Property ${propName} not found in board ${customBlocks?.id}`);
      }

      acc[propName] = property;

      return acc;
    },
    {} as Record<string, ProposalPropertyField>
  );

  const formFields = await prisma.formField.findMany({
    where: {
      form: {
        proposal: {
          some: {
            space: {
              domain
            }
          }
        }
      },
      name: {
        in: exportedCustomFields
      }
    }
  });
  const formFieldIdsByName = groupBy(formFields, (field) => field.name);

  const pageIds = await _getPageIdsFromDatabase();

  const proposals = await prisma.proposal.findMany({
    // where: {
    //   status: 'published',
    //   page: {
    //     deletedAt: null,
    //     createdAt: {
    //       gte: new Date('2024-03-13')
    //     },
    //     type: 'proposal',
    //     space: {
    //       domain
    //     }
    //   }
    // },
    where: {
      status: 'published',
      page: {
        deletedAt: null,
        id: {
          in: pageIds
        }
      }
    },
    include: {
      formAnswers: true,
      rubricAnswers: true,
      rubricCriteria: {
        orderBy: {
          title: 'asc'
        }
      },
      authors: {
        select: {
          author: {
            select: {
              username: true
            }
          }
        }
      },
      page: {
        select: {
          title: true,
          path: true
        }
      }
    }
  });

  console.log('Found', proposals.length, 'proposals to export');

  const allContent = [
    [...headerRows.map((rowKey) => exportedFormat[rowKey]), ...exportedCustomProps, ...exportedCustomFields]
  ];

  const aggregatedResultsByProposal = proposals.reduce(
    (acc, proposal) => {
      const results = aggregateResults({
        answers: proposal.rubricAnswers as ProposalRubricCriteriaAnswerWithTypedResponse[],
        criteria: proposal.rubricCriteria
      });
      acc[proposal.id] = results;
      return acc;
    },
    {} as Record<string, AggregateResults>
  );

  const sortedProposals = proposals.sort((a, b) => {
    const avgA = aggregatedResultsByProposal[a.id]?.allScores?.sum;
    const avgB = aggregatedResultsByProposal[b.id]?.allScores?.sum;

    // If both are numbers, sort in descending order
    if (avgA !== null && avgB !== null) {
      return avgB - avgA;
    }
    // If avgA is null and avgB is a number, b comes first
    else if (avgA === null && avgB !== null) {
      return 1;
    }
    // If avgB is null and avgA is a number, a comes first
    else if (avgA !== null && avgB === null) {
      return -1;
    }
    // If both are null, maintain their order
    else {
      return 0;
    }
  });

  const contentRows = sortedProposals.map((p) => {
    const results = aggregatedResultsByProposal[p.id];
    const rubricDetails = p.rubricCriteria.reduce((details, criteria) => {
      const rubricResults = results.criteriaSummary[criteria.id];

      if (!criteria.title || rubricResults.sum === null) {
        return details;
      }

      let baseString = `Criteria: ${criteria.title} - Average: ${
        typeof rubricResults.average === 'number' ? rubricResults.average.toFixed(1) : '-'
      } || Total: ${rubricResults.sum ?? '-'}${newLine}${newLine}`;

      const mappedComments = rubricResults.comments
        .filter((comment) => !!comment?.trim())
        .map((comment) => `*${comment.trim()}${newLine}`);

      if (mappedComments.length) {
        baseString += mappedComments.join(newLine) + newLine;
      }

      baseString += newLine;

      return details + baseString;
    }, '');

    const row: ExportedProposal = {
      authors: p.authors.map((a) => a.author.username).join(newLine),
      average: results.allScores.average ?? '-',
      total: results.allScores.sum ?? '-',
      title: p.page?.title ?? 'Proposal',
      proposalUrl: `https://app.charmverse.io/${domain}/${p.page?.path}`,
      rubricResults: rubricDetails?.trim() ? rubricDetails.trim() : '-'
    };

    headerRows.forEach((rowKey) => {
      const rowValue = row[rowKey];

      if (rowKey === 'average') {
        if (isNumber(rowValue)) {
          if (rowValue === Math.round(rowValue as number)) {
            row.average = `${cellEnclosure}${(rowValue as number).toString()}${cellEnclosure}`;
          } else {
            row.average = `${cellEnclosure}${(rowValue as number).toFixed(1)}${cellEnclosure}`;
          }
        } else {
          row.average = `${cellEnclosure}${rowValue}${cellEnclosure}`;
        }
      } else if (rowKey === 'total') {
        row.total = `${cellEnclosure}${row.total?.toString() ?? '-'}${cellEnclosure}`;
      } else {
        row[rowKey] = `${cellEnclosure}${(rowValue as string)
          .replace(new RegExp(cellEnclosure, 'g'), '')
          .replace(new RegExp(separator, 'g'), '')
          .replace(/;/g, ' ')}${cellEnclosure}`;
      }
    });

    exportedCustomProps.forEach((rowKey) => {
      const property = propertyMap[rowKey];

      const rowValue = (p.fields as ProposalFields).properties?.[property.id] as string;

      const value = !rowValue
        ? '-'
        : stringUtils.isUUID(rowValue)
          ? (property.options.find((opt) => opt.id === rowValue)?.value ?? '-')
          : rowValue;

      (row as any)[rowKey] = `${cellEnclosure}${(value as string)
        .replace(new RegExp(cellEnclosure, 'g'), '')
        .replace(new RegExp(separator, 'g'), '')
        .replace(/;/g, ' ')}${cellEnclosure}`;
    });

    exportedCustomFields.forEach((rowKey) => {
      const fieldIds = (formFieldIdsByName[rowKey] || []).map((field) => field.id);
      const match = p.formAnswers.find((answer) => fieldIds?.includes(answer.fieldId));
      if (match) {
        const valueStr = (match.value as any).contentText ?? match.value;
        (row as any)[rowKey] = `${cellEnclosure}${valueStr
          .replace(new RegExp(cellEnclosure, 'g'), '')
          .replace(new RegExp(separator, 'g'), '')
          .replace(/;/g, ' ')}${cellEnclosure}`;
      }
    });

    return [...headerRows, ...exportedCustomProps, ...exportedCustomFields].map(
      (rowKey) => (row as any)[rowKey] as string
    );
  });

  allContent.push(...contentRows);

  // Debug JSON
  // await writeToSameFolder({data: JSON.stringify(allContent, null, 2), fileName: 'rawdata.json'})

  const textContent = allContent.reduce((acc, row) => {
    return acc + row.join(separator) + newLine;
  }, '');

  return textContent;
}

// Retrieve a list of proposal page ids based on a board property
async function _getPageIdsFromDatabase() {
  const board = await prisma.block.findFirstOrThrow({
    where: {
      id: '209510e1-898a-41ac-b03f-acbbdc94c311'
    }
  });
  const cards = await prisma.block.findMany({
    where: {
      parentId: board.id,
      type: 'card'
    },
    include: {
      page: true
    }
  });
  // console.log((board.fields as unknown as BoardFields).cardProperties);
  const property = (board.fields as unknown as BoardFields).cardProperties.find((prop) => prop.name === 'Finalist');
  const yesOption = property?.options.find((opt) => opt.value === 'Yes');
  if (!yesOption || !property) {
    throw new Error('cannot find property or option');
  }
  return cards
    .filter((card) => (card.fields as CardFields).properties[property.id] === yesOption.id)
    .map((card) => card.page?.syncWithPageId)
    .filter(isTruthy);
}

exportEvaluatedProposalScores({ domain: 'op-grants' }).then(async (csv) => {
  await writeToSameFolder({ data: csv, fileName: 'exported.csv' });
});
