import { stringUtils } from '@charmverse/core/utilities';
import { Space, prisma } from '@charmverse/core/prisma-client';
import * as readline from 'node:readline';

// Terminal color codes
// https://stackoverflow.com/a/41407246
const bright = '\x1b[1m';
const reset = '\x1b[0m';
const textRed = '\x1b[31m';
const textBlue = '\x1b[34m';

async function awaitInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    reader.question(`\r\nPlease type ${bright}confirm: ${reset}`, (key) => {
      resolve(key);
      reader.close();
    });
  });
}

async function verifySpace({ spaceIdOrDomain }: { spaceIdOrDomain: string }): Promise<Space> {
  if (!spaceIdOrDomain || typeof spaceIdOrDomain !== 'string') {
    throw new Error(`Spacedomain is required`);
  }

  const isUUID = stringUtils.isUUID(spaceIdOrDomain);

  const space = await prisma.space.findUnique({
    where: isUUID
      ? {
          id: spaceIdOrDomain
        }
      : {
          domain: spaceIdOrDomain
        }
  });

  if (!space) {
    throw new Error(`Space not found with ${isUUID ? 'id' : 'domain'} ${spaceIdOrDomain}`);
  }

  const pages = await prisma.page.count({
    where: {
      spaceId: space.id
    }
  });

  const users = await prisma.spaceRole.count({
    where: {
      spaceId: space.id
    }
  });

  console.log(`\r\n${textRed}⚠️ This will delete the entire space!${reset}\r\n`);
  console.log(`Space name: ${space.name}`);
  console.log(`Domain: ${textBlue} ${space.domain}${reset}\r\n`);
  console.log(pages, 'pages');
  console.log(users, 'memberships');

  return space;
}

async function confirmDeleteSpace({ spaceId }: { spaceId: string }) {
  const key = await awaitInput();

  if (key !== 'confirm') {
    throw new Error('Cannot delete space. Deletion not confirmed');
  }

  await prisma.space.delete({
    where: {
      id: spaceId
    }
  });

  console.log('\r\n🗑️  Deleted space');
}

async function deleteSpace({ spaceIdOrDomain }: { spaceIdOrDomain: string }) {
  const space = await verifySpace({ spaceIdOrDomain });
  await confirmDeleteSpace({ spaceId: space.id });
}

deleteSpace({ spaceIdOrDomain: 'final-ivory-ptarmigan' }).then(() => console.log('done'));
