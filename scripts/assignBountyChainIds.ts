// @ts-nocheck

import { RPCList } from 'connectors';
import { prisma } from 'db';

function assignChainIds (): Promise<any> {

  return Promise.all(
    RPCList
      .filter(chain => {
        return chain.testnet !== true;
      })
      .map(chain => {
        const nativeCurrency = chain.nativeCurrency.symbol;
        const chainId = chain.chainId;
        if (chainId && nativeCurrency) {
          return prisma.bounty.updateMany({
            where: {
              rewardToken: nativeCurrency,
              chainId: null
            },
            data: {
              chainId
            }
          });
        }
        return Promise.resolve(false);
      })
  );
}

/*
assignChainIds()
  .then(() => {
    console.log('Success!');
  });
*/
