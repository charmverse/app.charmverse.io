import { stringUtils } from '@packages/core/utilities';
import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { isAddress } from 'viem';
import fs from 'node:fs/promises';

import * as readline from 'node:readline';

// Terminal color codes
// https://stackoverflow.com/a/41407246
const bright = '\x1b[1m';
const reset = '\x1b[0m';
const textRed = '\x1b[31m';
const textBlue = '\x1b[34m';

/**
 * @duplicateAddressOrUserId All wallets on this account will be merged to the original address
 */
type Props = {
  duplicateAddressOrUserIdOrPath: string;
  originalAddressOrUserIdOrPath: string;
};

async function confirmMerge({ duplicateAddressOrUserIdOrPath, originalAddressOrUserIdOrPath }: Props): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log(
      `\r\n${bright}You are about to merge all wallets from ${duplicateAddressOrUserIdOrPath} to ${originalAddressOrUserIdOrPath}${reset}`
    );
    console.log(`\r\n${textRed}WARNING: The duplicate account will not be accessible anymore!${reset}`);
    reader.question(`\r\nPlease type ${bright}confirm: ${reset}`, (key) => {
      resolve(key);
      reader.close();
    });
  });
}

function getUser(input: string): Prisma.UserWhereInput {
  return stringUtils.isUUID(input)
    ? { id: input }
    : isAddress(input)
      ? {
          wallets: {
            some: {
              address: input
            }
          }
        }
      : { path: input };
}

async function mergeWallet({ duplicateAddressOrUserIdOrPath, originalAddressOrUserIdOrPath }: Props) {
  if (
    typeof duplicateAddressOrUserIdOrPath !== 'string' ||
    typeof originalAddressOrUserIdOrPath !== 'string' ||
    duplicateAddressOrUserIdOrPath === originalAddressOrUserIdOrPath
  ) {
    throw new Error('Invalid address or userId');
  }

  const originalAccount = await prisma.user.findFirst({
    where: getUser(originalAddressOrUserIdOrPath),
    select: {
      id: true,
      path: true,
      username: true,
      wallets: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const duplicateAccount = await prisma.user.findFirst({
    where: getUser(duplicateAddressOrUserIdOrPath),
    select: {
      id: true,
      path: true,
      username: true,
      wallets: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!originalAccount) {
    throw new Error('Original account not found');
  }

  if (!duplicateAccount) {
    throw new Error('Duplicate account not found');
  }

  if (!duplicateAccount.wallets.length) {
    throw new Error('Duplicate account has no wallets');
  }

  console.log(`\r\n${textBlue}Original account:`, originalAccount, reset);
  console.log(`\r\n${textRed}Duplicate account:`, duplicateAccount, reset);

  const confirmation = await confirmMerge({
    duplicateAddressOrUserIdOrPath: duplicateAccount.id,
    originalAddressOrUserIdOrPath: originalAccount.id
  });

  if (confirmation !== 'confirm') {
    return console.log(`\r\n${textBlue}Cancelled operation${reset}`);
  }

  // Keep a record of what happened just in case we need to do some post processing
  await fs.writeFile(
    `${__dirname}/merge-wallet-${originalAccount.id}-${Date.now()}.json`,
    JSON.stringify(
      {
        originalAccount,
        duplicateAccount
      },
      null,
      2
    )
  );

  await prisma.userWallet.updateMany({
    where: {
      userId: duplicateAccount.id
    },
    data: {
      userId: originalAccount.id
    }
  });

  console.log(
    `\r\n ✅ Merged ${duplicateAccount.wallets.length} wallets from user ${duplicateAccount.id} to ${originalAccount.id}`
  );
}

mergeWallet({
  duplicateAddressOrUserIdOrPath: 'account2',
  originalAddressOrUserIdOrPath: 'account1'
})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
