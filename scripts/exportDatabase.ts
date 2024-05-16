import { prisma } from "@charmverse/core/prisma-client";
import { csvCellEnclosure, csvColumnSeparator, csvNewLine, loadAndGenerateCsv } from "lib/databases/generateCsv";
import { writeToSameFolder } from "lib/utils/file";

import { BoardFields } from "lib/databases/board";
import { BoardView } from "lib/databases/boardView";
import { prettyPrint } from "lib/utils/strings";
import { FilterGroup } from "lib/databases/filterGroup";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { exportEvaluatedProposalScores } from "./exportProposalScores";
import { isTruthy } from "lib/utils/types";
import { p } from "prosemirror-test-builder";
import { GiCoinsPile } from "react-icons/gi";

function readCSV({csvContent, csvFile}: {csvContent?: string; csvFile?: string}) {
  if (!csvContent && !csvFile) {
    throw new Error('Must provide either csvContent or csvFile');
  }
  const content = csvContent ?? readFileSync(csvFile as string).toString();
  var { data: rows } = Papa.parse<string[]>(content);
  const headers = rows[0];
  return rows.slice(1, rows.length).map((values) => {
    return values.reduce<Record<string, string>>((acc, field, index) => {
      const header = headers[index];
      if (header) {
        acc[header] = field;
      }
      return acc;
    }, {});
  });
}

async function displayBoardProperties({pagePath, spaceDomain}: {spaceDomain: string; pagePath: string}) {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: pagePath,
      type: 'board',
      space: {
        domain: spaceDomain
      }
    },
    select: {
      id: true,
      boardId: true
    }
  });

  const boardBlock = await prisma.block.findUniqueOrThrow({
    where: {
      id: page.boardId as string
    }
  });

  const viewBlocks = await prisma.block.findMany({
    where: {
      type: 'view',
      rootId: boardBlock.id
    }
  }) as any as BoardView[];


  const boardProps = (boardBlock.fields as any as BoardFields).cardProperties.map(propSchema => {
    const baseProp = {
      id: propSchema.id,
      name: propSchema.name,
      type: propSchema.type,
      options: propSchema.options,
      visibleInViews: viewBlocks.filter(block => !block.fields.visiblePropertyIds?.length || block.fields.visiblePropertyIds.includes(propSchema.id)).map(v => ({id: v.id, name: v.title}))
    }

    return baseProp;
  })

  prettyPrint(boardProps);
}



async function exportProposalDatabaseWithScores({pagePath, spaceDomain, filter, viewId}: {spaceDomain: string; pagePath: string; viewId?: string; filter?: FilterGroup;}) {
  const db = await prisma.page.findFirstOrThrow({
    where: {
      space: {
        domain: spaceDomain
      },
      path: pagePath,
      type: 'board'
    },
    select: {
      id: true,
      space: {
        select: {
          spaceRoles: {
            where: {
              isAdmin: true
            }
          }
        }
      }
    }
  });

  const {csvData, childPageIds} = await loadAndGenerateCsv({
    databaseId: db.id,
    viewId,
    userId: db.space.spaceRoles[0].userId,
    customFilter: filter
  });

  console.log('Number of pages', childPageIds.length);

  await writeToSameFolder({
    data: csvData,
    fileName: `exported.csv`
  })

  const csvDataAsArray =  csvData.split(csvNewLine).map(row => row.split(csvColumnSeparator));

  console.log('CSV data as array', csvDataAsArray.length);

  const proposalURLIndex = csvDataAsArray[0].indexOf('Proposal Url');

  if (proposalURLIndex === -1) {
    throw new Error('Could not find Proposal URL');
  }

  const paths =  csvDataAsArray.map(row => row[proposalURLIndex]?.split('/').pop()).filter(isTruthy);

  const uniqueProposals = await prisma.proposal.findMany({
    where: {
      page: {
        path: {
          in:paths
        }
      }
    },
    select: {
      id: true
    }
  })

  prettyPrint({uniquePages: uniqueProposals.length});

  const proposalScores = (await exportEvaluatedProposalScores({domain: spaceDomain, proposalIds: uniqueProposals.map(p => p.id)})).split(csvNewLine).map(row => row.split(csvColumnSeparator));

  const urlIndex = proposalScores[0].indexOf('Proposal URL');

  if (urlIndex === -1) {
    throw new Error('Could not find Proposal Url  in proposal scores');
  }

  // Extra useful data from export
  const totalIndex = proposalScores[0].indexOf('Total');

  if (totalIndex === -1) {
    throw new Error('Could not find Total in proposal scores');
  }

  const averageIndex = proposalScores[0].indexOf('Average');

  if (averageIndex === -1) {
    throw new Error('Could not find Average in proposal scores');
  }

  const rubricResultsIndex = proposalScores[0].indexOf('Rubric Results');

  if (rubricResultsIndex === -1) {
    throw new Error('Could not find Rubric Results in proposal scores');
  }



  console.log('Proposal scores', proposalScores.length);

  csvDataAsArray[0].push('Total');
  csvDataAsArray[0].push('Average');
  csvDataAsArray[0].push('Rubric Results');

  // Skip header row
  for (let i = 1; i < csvDataAsArray.length; i++) {
    console.log('Processing row', i + 1, 'of', proposalScores.length);
    const matchingProposal = proposalScores.find(row => row[urlIndex]?.match(csvDataAsArray[i][proposalURLIndex]));

    // console.log('Matching proposal', matchingProposal);

    const totalScore = matchingProposal?.[totalIndex];
    const averageScore = matchingProposal?.[averageIndex];
    const rubricResults = matchingProposal?.[rubricResultsIndex];

    prettyPrint({totalScore, averageScore, rubricResults});

    const fallback = `${csvCellEnclosure}-${csvCellEnclosure}`

    if (matchingProposal) {
      csvDataAsArray[i].push(totalScore ?? fallback);
      csvDataAsArray[i].push(averageScore ?? fallback);
      csvDataAsArray[i].push(rubricResults ?? fallback);
    }
  }

  const cleanDB = csvDataAsArray.map(row => row.join(csvColumnSeparator)).join(csvNewLine);

  await writeToSameFolder({
    data: cleanDB,
    fileName: `exportedWithScores.csv`
  })


  return {
    csvData,
    childPageIds
  }
}

// Display properties

// displayBoardProperties({
//   spaceDomain,
//   pagePath
// }).then(() => {
//   console.log('Done');
// })


exportProposalDatabaseWithScores({
  pagePath: '',
  spaceDomain: ''
}).then(() => {
  console.log('Done');
})

// prisma.page.count({
//   where: {
//     type: 'card',
//     parent: {
//       path: pagePath,
//       space: {
//         domain: spaceDomain
//       }
//     }
//   }
// }).then(console.log)