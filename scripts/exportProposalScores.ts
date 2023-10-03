import { prisma } from "@charmverse/core/prisma-client";
import { objectUtils } from "@charmverse/core/utilities";
import { aggregateResults } from "lib/proposal/rubric/aggregateResults";
import { ProposalRubricCriteriaAnswerWithTypedResponse } from "lib/proposal/rubric/interfaces";
import { writeToSameFolder } from "lib/utilities/file";
import { isNumber } from "lib/utilities/numbers";
import { q } from "msw/lib/glossary-de6278a9";

type ExportedProposal = {
  proposalUrl: string,
  authors: string,
  title: string,
  category: string,
  total: string | number,
  average: string | number,
  rubricResults: string
}

type ExportKeys = keyof ExportedProposal;

const exportedFormat: Record<ExportKeys, string> = {
  authors: 'Author',
  proposalUrl: 'Proposal URL',
  title: 'Title',
  category: 'Category',
  total: 'Total',
  average: 'Average',
  rubricResults: 'Rubric Results'
};

const separator = ',';
const cellEnclosure = '"';
const newLine = "\n";

const headerRows = objectUtils.typedKeys(exportedFormat);

async function exportEvaluatedProposalScores({domain}: {domain: string}) {

  const proposals = await prisma.proposal.findMany({
    where: {
      evaluationType: 'rubric',
      status: {
        in: ['evaluation_closed', 'evaluation_active']
      },
      page: {
        space: {
          domain
        }
      }
    },
    include: {
      category: {
        select: {
          title: true
        }
      },
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

  const allContent = [headerRows.map(rowKey => exportedFormat[rowKey])]

  const contentRows = proposals.map(p => {

    const results = aggregateResults({
      answers: p.rubricAnswers as ProposalRubricCriteriaAnswerWithTypedResponse[],
      criteria: p.rubricCriteria
    });

    const rubricDetails = p.rubricCriteria.reduce((details, criteria) => {
      const rubricResults = results.criteriaSummary[criteria.id];

      if (!criteria.title || rubricResults.sum === null) {
        return details
      } 

      let baseString = `Criteria: ${criteria.title} - Average: ${typeof rubricResults.average === 'number' ? rubricResults.average.toFixed(1) : '-'} || Total: ${rubricResults.sum ?? '-'}${newLine}`

      const mappedComments = rubricResults.comments.filter(comment => !!(comment?.trim())).map(comment => `*${comment}`);

      if (mappedComments.length) {
        baseString += mappedComments.join(newLine) + newLine
      }

      baseString += newLine

      return details + baseString;
    }, '')

    const row: ExportedProposal = {
      authors: p.authors.map(a => a.author.username).join(newLine),
      average: results.allScores.average ?? '-',
      total: results.allScores.sum ?? '-',
      category: p.category?.title ?? 'Unnamed Category',
      title: p.page?.title ?? 'Proposal',
      proposalUrl: `https://app.charmverse.io/${domain}/${p.page?.path}`,
      rubricResults: rubricDetails
    }

    headerRows.forEach(rowKey => {

      const rowValue = row[rowKey];

      if (rowKey === 'average'){
        if (isNumber(rowValue)) {
          if (rowValue === Math.round(rowValue as number)) {
            row.average = `${cellEnclosure}${ (rowValue as number).toString()}${cellEnclosure}`
          } else {
            row.average = `${cellEnclosure}${ (rowValue as number).toFixed(1)}${cellEnclosure}`
          } 
        } else {
          row.average = `${cellEnclosure}${rowValue}${rowValue}`
        }
      } else if (rowKey === 'total') {
        row[rowKey] = `${cellEnclosure}${ row.total?.toString() ?? '-'}${cellEnclosure}`
      } else {
        row[rowKey] = `${cellEnclosure}${(rowValue as string).replace(new RegExp(cellEnclosure, 'g'), "").replace(new RegExp(separator, 'g'), '')}${cellEnclosure}`
      }
    })

    return headerRows.map(rowKey => row[rowKey] as string);
  })

  allContent.push(...contentRows);

  // Debug JSON
  await writeToSameFolder({data: JSON.stringify(allContent, null, 2), fileName: 'rawdata.json'})

  const textContent = allContent.reduce((acc, row) => {
    return acc + row.join(separator) + newLine
  }, '');

  return textContent;
}

exportEvaluatedProposalScores({domain: 'safe-grants-program'}).then(async csv => {

  await writeToSameFolder({data: csv, fileName: 'exported.csv'})
})