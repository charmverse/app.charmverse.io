import { OverallBlocksCount, countSpaceBlocks } from 'lib/spaces/countSpaceBlocks/countAllSpaceBlocks';
import { prisma } from '@charmverse/core/prisma-client';
import { writeToSameFolder } from 'lib/utilities/file';

let record: OverallBlocksCount =  {
  "total": 11,
  "details": {
    "comments": {
      "total": 0,
      "details": {
        "applicationComment": 0,
        "blockComment": 0,
        "comment": 0,
        "pageComments": 0,
        "postComment": 0
      }
    },
    "forum": {
      "total": 0,
      "details": {
        "categories": 0,
        "posts": 0,
        "postContentBlocks": 0
      }
    },
    "editorContent": 0,
    "pages": {
      "total": 0,
      "details": {
        "documents": 0,
        "rewards": 0,
        "proposals": 0,
        "databases": 0,
        "cards": 0
      }
    },
    "databaseProperties": {
      "total": 0,
      "details": {
        "databaseViews": 2,
        "databaseDescriptions": 0,
        "databaseProperties": 0,
        "databaseRowPropValues": 0
      }
    },
    "memberProperties": {
      "total": 0,
      "details": {
        "memberProperties": 0,
        "memberPropertyValues": 0
      }
    },
    "proposals": {
      "total": 0,
      "details": {
        "proposalViews": 0,
        "proposalProperties": 0,
        "proposalPropertyValues": 0,
        "proposalCategories": 0,
        "proposalRubrics": 0,
        "proposalRubricAnswers": 0
      }
    }
  },
}

function camelToTitle(camelCase: string): string {
  return camelCase.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
}

function generateHeaders(record: OverallBlocksCount): string {
  const headers: string[] = ['Total'];
  for (const categoryKey in record.details) {
    const category = (record.details as any)[categoryKey];
    headers.push(`${camelToTitle(categoryKey)} (Total)`);
    if (category.details) {
      for (const detailKey in category.details) {
        headers.push(`${camelToTitle(categoryKey)} (${camelToTitle(detailKey)})`);
      }
    }
  }
  return headers.join(',') + '\n';
}

function generateRow(record: OverallBlocksCount): string {
  const dataRow: (string | number)[] = [record.total];
  for (const categoryKey in record.details) {
    const category = (record.details as any)[categoryKey];
    if (categoryKey === 'editorContent') {
      dataRow.push(record.details.editorContent)
    } else if (category.details) {
      dataRow.push(category.total);
      for (const detailKey in category.details) {
        dataRow.push(category.details[detailKey]);
      }
    }
  }
  return dataRow.join(',') + '\n';
}


async function init() {

  let csv = generateHeaders(record)

  const spaces = await prisma.space.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  for (let space of spaces) {
    const data = await countSpaceBlocks({ spaceId: space.id });
    csv += generateRow(data)
  }
  const fileName = `space-data-${new Date().toISOString()}.csv`;
  await writeToSameFolder({data: csv, fileName})
}

init().then(() => {
  console.log('done');
});
