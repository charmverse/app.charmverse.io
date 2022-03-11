import { RPCList } from 'connectors';
import { prisma } from 'db';

function assignChainIds (): Promise<any> {

  return Promise.all(
    RPCList
      .filter(chain => {
        // Ignore Goerli, Rinkeby and Mumbai chains
        return [5, 4, 80001].indexOf(chain.chainId) === -1;
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
