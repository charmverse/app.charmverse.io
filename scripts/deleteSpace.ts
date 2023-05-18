import { stringUtils } from "@charmverse/core";
import { Space, prisma } from "@charmverse/core/prisma-client";
import * as fs from 'node:fs/promises';
import * as readline from "node:readline";
import { v4 } from "uuid";

function getDeletionKeyPath() {
  return `${__dirname}/spaceDeletionKey.txt`
}


const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


async function awaitInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    reader.question(`Please enter the deletion key found in ${getDeletionKeyPath()}:\r\n`, (key) => {
      resolve(key)
      reader.close();
    });
  })
}





async function verifySpace({spaceIdOrDomain}: {spaceIdOrDomain: string}): Promise<Space> {

  await fs.rm(getDeletionKeyPath()).then(() => console.log('Deleted key file')).catch(err => console.log('No file to cleanup'))

  if (!spaceIdOrDomain || typeof spaceIdOrDomain !== 'string') {
    throw new Error(`Spacedomain is required`)
  }

  const isUUID = stringUtils.isUUID(spaceIdOrDomain)

  const space = await prisma.space.findUnique({
    where: isUUID ? {
      id: spaceIdOrDomain
    } : {
      domain: spaceIdOrDomain
    }
  });

  if (!space) {
    throw new Error(`Space not found with ${isUUID ? 'id' : 'domain'} ${spaceIdOrDomain}`)
  }

  const pages = await prisma.page.count({
    where: {
      spaceId: space.id
    }
  });

  console.log(`Will \x1b[31m delete `, pages, ' pages from \x1b[34m space', space.name, '\x1b[0m with \x1b[34m domain', space.domain, '\x1b[0m')

  const deletionKey = v4();

  await fs.writeFile(getDeletionKeyPath(), deletionKey)

  return space;
}

async function confirmDeleteSpace({spaceId}: {spaceId: string}) {

  const deletionKeyValue = await fs.readFile(getDeletionKeyPath(), 'utf8')

  const key = await awaitInput();

  if (!stringUtils.isUUID(key) || !stringUtils.isUUID(deletionKeyValue) || key !== deletionKeyValue) {
    throw new Error('Cannot delete space. Deletion key not valid')
  }

  await prisma.space.delete({
    where: {
      id: spaceId
    }
  })

  await fs.rm(getDeletionKeyPath()).then(() => console.log('Deleted key file')).catch(err => console.log('No file to cleanup'))
}

async function deleteSpace({spaceIdOrDomain}: {spaceIdOrDomain: string}) {
  const space = await verifySpace({spaceIdOrDomain});
  await confirmDeleteSpace({spaceId: space.id})
}


deleteSpace({spaceIdOrDomain: 'strategic-moccasin-earwig'}).then(() => console.log('done'))
