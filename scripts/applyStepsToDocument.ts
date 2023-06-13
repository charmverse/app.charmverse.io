import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@charmverse/core/prisma-client';
import { applyStepsToNode } from 'lib/prosemirror/applyStepsToNode';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';

const pageId = 'd4d3ffcc-0cbd-4aa3-a56f-230d45ecc443';
// const originalPageId = 'd4d3ffcc-0cbd-4aa3-a56f-230d45ecc443';

const fileName = `./updates.json`;
const pathName = path.join(process.cwd(), fileName);

type RestoreData = {
  message: {
    type: 'diff';
    ds: any[];
  };
};

function readJson(): Promise<RestoreData> {
  return fs.readFile(pathName).then((file) => JSON.parse(file.toString()));
}

async function applySteps() {
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    }
  });
  console.log('got apge');
  const logData = await readJson();
  console.log('got json', logData);
  const docNode = getNodeFromJson(page.content);
  const updatedNode = applyStepsToNode(logData.message.ds, docNode);
  console.log(updatedNode.textContent);
  await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      content: updatedNode.toJSON(),
      contentText: updatedNode.textContent,
      version: page.version + 1,
      updatedAt: new Date()
    }
  });
  await prisma.pageDiff.create({
    data: {
      createdAt: new Date(),
      createdBy: page.createdBy,
      version: page.version + 1,
      pageId: pageId,
      data: logData.message
    }
  });
}
applySteps();
