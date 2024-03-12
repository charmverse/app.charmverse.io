import { validateTokenGate } from 'lib/tokenGates/validateTokenGate';
import { prisma } from '@charmverse/core/prisma-client';
const spaceDomain = 'myosinxyz';
import { TokenGate } from 'lib/tokenGates/interfaces';
const walletAddress = '0xCb4d8F23c078530005bBE2365eE8a6a3A40B9233';

async function init() {
  const tokenGates = await prisma.tokenGate.findMany({
    where: {
      space: {
        domain: spaceDomain
      }
    }
  });
  for (const gate of tokenGates) {
    const result = await validateTokenGate(gate as unknown as TokenGate, walletAddress);
    console.log(result);
  }
}

init()
  .then(() => console.log('Done'))
  .catch((e) => console.error(e));
