import { prisma } from "@charmverse/core/prisma-client";
import { findOrCreateFarcasterUser } from "lib/farcaster/findOrCreateFarcasterUser";



async function onboardScouts({fids}: {fids: number[]}) {

  const existingAccounts = await prisma.scout.findMany({
    where: {
      farcasterId: {
        in: fids
      }
    }
  });

  console.log(`Found ${existingAccounts.length} existing accounts`)

  const fidsRequiringAccount = fids.filter(fid => !existingAccounts.some(account => account.farcasterId === fid));
  const totalFidsToProcess = fidsRequiringAccount.length;

  for (let i = 0; i < totalFidsToProcess; i++) {
    const fid = fidsRequiringAccount[i];
    console.log(`Creating user ${i+1} / ${totalFidsToProcess}`)
    await findOrCreateFarcasterUser({fid})
  }
}


async function issuePoints({fids}: {fids: number[]}) {

  console.log('Skipping points issuing')
  return;

  await prisma.scout.updateMany({
    where: {
      farcasterId: {
        in: fids
      }
    },
    data: {
      currentBalance: {
        increment: 50
      }
    }
  }
  )
}



const fidList = [4339];



async function script() {
  await onboardScouts({fids: fidList});
  await issuePoints({fids: fidList});
}
