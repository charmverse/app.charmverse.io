import { authorizeUserByLaunchDate } from '../lib/session/authorizeUserByLaunchDate';
import { prisma } from '@charmverse/core/prisma-client';
async function main() {
  const scout = await prisma.connectWaitlistSlot.findFirst({
    where: {
      username: 'qqsksk12'
    }
  });
  try {
    const authorized = await authorizeUserByLaunchDate({ fid: scout.fid });
    console.log(`User ${scout.fid} is authorized: ${authorized}`);
  } catch (error) {
    console.error(`Error authorizing user ${scout.fid}: ${error}`);
    console.log(scout);
  }
}

main();
