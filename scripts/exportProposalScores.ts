import { prisma } from "@charmverse/core/prisma-client";
import { objectUtils } from "@charmverse/core/utilities";
import { AggregateResults, aggregateResults } from "lib/proposal/rubric/aggregateResults";
import { ProposalRubricCriteriaAnswerWithTypedResponse } from "lib/proposal/rubric/interfaces";
import { writeToSameFolder } from "lib/utilities/file";
import { isNumber } from "lib/utilities/numbers";

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

  const aggregatedResultsByProposal = proposals.reduce((acc, proposal) => {
    const results = aggregateResults({
      answers: proposal.rubricAnswers as ProposalRubricCriteriaAnswerWithTypedResponse[],
      criteria: proposal.rubricCriteria
    });
    acc[proposal.id] = results;
    return acc;
  }, {} as Record<string, AggregateResults>);

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

  const contentRows = sortedProposals.map(p => {
    const results = aggregatedResultsByProposal[p.id]
    const rubricDetails = p.rubricCriteria.reduce((details, criteria) => {
   
      const rubricResults = results.criteriaSummary[criteria.id];

      if (!criteria.title || rubricResults.sum === null) {
        return details
      } 

      let baseString = `Criteria: ${criteria.title} - Average: ${typeof rubricResults.average === 'number' ? rubricResults.average.toFixed(1) : '-'} || Total: ${rubricResults.sum ?? '-'}${newLine}${newLine}`

      const mappedComments = rubricResults.comments.filter(comment => !!(comment?.trim())).map(comment => `*${comment.trim()}${newLine}`);

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
      rubricResults: (rubricDetails?.trim()) ? rubricDetails.trim() : '-'
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
          row.average = `${cellEnclosure}${rowValue}${cellEnclosure}`
        }
      } else if (rowKey === 'total') {
        row.total = `${cellEnclosure}${ row.total?.toString() ?? '-'}${cellEnclosure}`
      } else {
        row[rowKey] = `${cellEnclosure}${(rowValue as string).replace(new RegExp(cellEnclosure, 'g'), "").replace(new RegExp(separator, 'g'), '').replace(/;/g, ' ')}${cellEnclosure}`
      }
    })

    return headerRows.map(rowKey => row[rowKey] as string);
  })

  

  allContent.push(...contentRows);

  // Debug JSON
  // await writeToSameFolder({data: JSON.stringify(allContent, null, 2), fileName: 'rawdata.json'})

  const textContent = allContent.reduce((acc, row) => {
    return acc + row.join(separator) + newLine
  }, '');

  return textContent;
}

exportEvaluatedProposalScores({domain: 'example'}).then(async csv => {

  await writeToSameFolder({data: csv, fileName: 'exported.csv'})
})